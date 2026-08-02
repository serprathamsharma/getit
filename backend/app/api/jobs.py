from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Resume
from app.models.schemas import (
    JobDescriptionParseRequest,
    ParsedJobDescription,
    JobMatchRequest,
    JobMatchResponse,
)
from app.services.llm import llm_service
from app.services.matching_engine import matching_engine

router = APIRouter(prefix="/jobs", tags=["Job Description Matching"])


@router.post("/parse", response_model=ParsedJobDescription)
async def parse_job_description(payload: JobDescriptionParseRequest):
    """
    Parse a raw job description into structured role criteria.
    Extracts required skills, nice-to-haves, experience level, domain knowledge,
    and key responsibilities.
    """
    parsed_jd = await llm_service.parse_job_description(payload.job_description)
    return parsed_jd


@router.post("/match", response_model=JobMatchResponse)
async def match_candidate_to_job(
    payload: JobMatchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Evaluates candidate resume against parsed job criteria using the Matching Engine.
    Computes overall Match Percentage, matched & unmatched skills, qualification score,
    strengths, and critical skill gaps.
    """
    result = await db.execute(select(Resume).where(Resume.id == payload.resume_id))
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="Candidate resume record not found")

    parsed_resume_dict = {
        "candidate_name": resume.candidate_name,
        "skills": resume.skills or [],
        "experience_years": resume.experience_years or 0.0,
        "work_history": resume.work_history or [],
        "education": resume.education or [],
        "projects": resume.projects or [],
    }

    match_result = await matching_engine.evaluate_candidate_match(
        parsed_resume=parsed_resume_dict,
        job_description=payload.job_description,
        resume_id=payload.resume_id,
    )

    # Persist latest evaluation in database
    resume.job_description = payload.job_description
    resume.job_fit_evaluation = match_result.model_dump()
    resume.qualification_score = match_result.qualification_score

    await db.commit()
    await db.refresh(resume)

    return match_result

