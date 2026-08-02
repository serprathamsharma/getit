"""API routes for AI Resume Intelligence and Job Description Evaluation."""

import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Resume
from app.models.schemas import JobFitRequest, ParsedResumeResponse
from app.services.llm import llm_service
from app.services.resume_parser import ResumeParserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/resumes", tags=["resumes"])


def generate_simple_pdf(title: str, text: str) -> bytes:
    """Generate a clean, valid PDF 1.4 binary file from text for document streaming."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        lines = [title]

    safe_title = title[:60].replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    content_stream_lines = [
        "BT",
        "/F1 16 Tf",
        "50 750 Td",
        f"({safe_title}) Tj",
        "0 -24 Td",
        "/F1 10 Tf",
    ]

    y = 726
    for line in lines[:45]:
        safe_line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        content_stream_lines.append(f"({safe_line[:90]}) Tj")
        content_stream_lines.append("0 -14 Td")
        y -= 14
        if y < 50:
            break

    content_stream_lines.append("ET")
    content_stream = "\n".join(content_stream_lines)
    content_len = len(content_stream)

    pdf_body = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {content_len} >>
stream
{content_stream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000256 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
500
%%EOF"""

    return pdf_body.encode("latin-1", errors="replace")


@router.post("/upload", response_model=ParsedResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a candidate resume file (PDF, DOCX, TXT), extract text,
    run AI entity parsing, and return the structured candidate profile.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # 1. Extract raw text from file
    try:
        raw_text, file_format = ResumeParserService.parse_file(file.filename, contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not raw_text or len(raw_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Could not extract readable text from document")

    # 2. Extract structured data via LLM
    parsed = await llm_service.extract_resume_data(raw_text)

    # 3. Create DB record
    resume = Resume(
        filename=file.filename,
        file_format=file_format,
        raw_text=raw_text,
        file_data=contents,
        candidate_name=parsed.get("candidate_name"),
        github_username=parsed.get("github_username"),
        email=parsed.get("email"),
        phone=parsed.get("phone"),
        parsed_data=parsed,
        skills=parsed.get("skills", []),
        experience_years=parsed.get("experience_years", 0.0),
        work_history=parsed.get("work_history", []),
        education=parsed.get("education", []),
        projects=parsed.get("projects", []),
        certifications=parsed.get("certifications", []),
    )

    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    return resume


@router.post("/{resume_id}/evaluate-fit", response_model=ParsedResumeResponse)
async def evaluate_job_fit(
    resume_id: str,
    payload: JobFitRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Evaluate parsed resume candidate against a target Job Description.
    Computes match %, qualification score, strengths, and skill gaps.
    """
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found")

    parsed_resume_dict = {
        "candidate_name": resume.candidate_name,
        "skills": resume.skills,
        "experience_years": resume.experience_years,
        "work_history": resume.work_history,
        "education": resume.education,
        "projects": resume.projects,
    }

    # Run AI job fit evaluation
    fit_eval = await llm_service.evaluate_candidate_job_fit(
        parsed_resume=parsed_resume_dict,
        job_description=payload.job_description,
    )

    resume.job_description = payload.job_description
    resume.job_fit_evaluation = fit_eval
    resume.qualification_score = fit_eval.get("qualification_score", 0.0)

    await db.commit()
    await db.refresh(resume)

    return resume


@router.get("/{resume_id}", response_model=ParsedResumeResponse)
async def get_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetch parsed resume detail by ID."""
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found")

    return resume


@router.get("", response_model=list[ParsedResumeResponse])
async def list_resumes(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """List recently uploaded resumes."""
    result = await db.execute(
        select(Resume).order_by(Resume.created_at.desc()).limit(limit)
    )
    return result.scalars().all()


@router.get("/{resume_id}/file")
async def get_resume_file(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Serve original or dynamically generated resume document (PDF/DOCX/TXT) inline for browser viewing."""
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found")

    file_bytes = resume.file_data
    media_type = "application/pdf"

    if resume.file_format == "docx":
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif resume.file_format == "txt":
        media_type = "text/plain; charset=utf-8"

    if not file_bytes:
        title = resume.candidate_name or resume.filename
        file_bytes = generate_simple_pdf(f"Resume: {title}", resume.raw_text or "No text content extracted.")
        media_type = "application/pdf"

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{resume.filename}"',
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        },
    )


@router.get("/{resume_id}/download")
async def download_resume_file(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Download resume file attachment."""
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found")

    file_bytes = resume.file_data
    media_type = "application/pdf"
    ext = "pdf"

    if resume.file_format == "docx":
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ext = "docx"
    elif resume.file_format == "txt":
        media_type = "text/plain; charset=utf-8"
        ext = "txt"

    if not file_bytes:
        title = resume.candidate_name or resume.filename
        file_bytes = generate_simple_pdf(f"Resume: {title}", resume.raw_text or "")
        media_type = "application/pdf"
        ext = "pdf"

    filename = resume.filename if resume.filename.lower().endswith(f".{ext}") else f"{resume.filename}.{ext}"

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Allow-Origin": "*",
        },
    )

