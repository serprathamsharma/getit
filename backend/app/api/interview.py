"""API router for Personalized Interview Generator endpoints."""

import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import Engineer, InterviewPlan, Resume
from app.models.schemas import (
    InterviewPlanResponse,
    InterviewPlanGenerateRequest,
    InterviewQuestionCreate,
    InterviewQuestionUpdate,
)
from app.services.interview_service import (
    generate_interview_plan,
    export_interview_plan_markdown,
)

router = APIRouter(prefix="/api/interview", tags=["interview"])


@router.post("/generate", response_model=InterviewPlanResponse)
async def generate_plan(
    req: InterviewPlanGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate or retrieve a personalized technical interview questionnaire."""
    username = req.github_username or ""
    engineer_id = req.engineer_id
    resume_id = req.resume_id

    # Lookup existing engineer profile if possible
    engineer_dict = None
    if engineer_id:
        result = await db.execute(
            select(Engineer).options(selectinload(Engineer.repos)).where(Engineer.id == engineer_id)
        )
        engineer = result.scalars().first()
        if engineer:
            username = engineer.github_username
            engineer_dict = {
                "name": engineer.name,
                "github_username": engineer.github_username,
                "archetype": engineer.archetype,
                "primary_languages": engineer.primary_languages,
                "frameworks": engineer.frameworks,
                "strengths": engineer.strengths,
                "repos": [
                    {"repo_full_name": r.repo_full_name, "language": r.language, "stars": r.stars}
                    for r in (engineer.repos or [])
                ],
            }
    elif username:
        result = await db.execute(
            select(Engineer).options(selectinload(Engineer.repos)).where(Engineer.github_username == username)
        )
        engineer = result.scalars().first()
        if engineer:
            engineer_id = engineer.id
            engineer_dict = {
                "name": engineer.name,
                "github_username": engineer.github_username,
                "archetype": engineer.archetype,
                "primary_languages": engineer.primary_languages,
                "frameworks": engineer.frameworks,
                "strengths": engineer.strengths,
                "repos": [
                    {"repo_full_name": r.repo_full_name, "language": r.language, "stars": r.stars}
                    for r in (engineer.repos or [])
                ],
            }

    # Lookup resume if resume_id passed
    resume_dict = None
    if resume_id:
        res_result = await db.execute(select(Resume).where(Resume.id == resume_id))
        resume_record = res_result.scalars().first()
        if resume_record:
            if not username and resume_record.github_username:
                username = resume_record.github_username
            resume_dict = {
                "candidate_name": resume_record.candidate_name,
                "skills": resume_record.skills,
                "experience_years": resume_record.experience_years,
                "work_history": resume_record.work_history,
                "education": resume_record.education,
                "projects": resume_record.projects,
            }

    if not username and resume_dict and resume_dict.get("candidate_name"):
        username = resume_dict["candidate_name"].lower().replace(" ", "")
    elif not username:
        username = "candidate"

    # Check existing saved plan
    existing_result = await db.execute(
        select(InterviewPlan).where(InterviewPlan.github_username == username).order_by(InterviewPlan.created_at.desc())
    )
    existing_plan = existing_result.scalars().first()

    if existing_plan:
        return existing_plan

    # Generate new plan
    plan_data = generate_interview_plan(
        github_username=username,
        engineer_profile=engineer_dict,
        resume_profile=resume_dict,
        target_role=req.target_role,
        custom_topics=req.custom_topics,
    )

    db_plan = InterviewPlan(
        id=plan_data["id"],
        engineer_id=engineer_id,
        github_username=username,
        candidate_name=plan_data["candidate_name"],
        questions=plan_data["questions"],
        overview_summary=plan_data["overview_summary"],
        recommended_duration_mins=plan_data["recommended_duration_mins"],
    )

    db.add(db_plan)
    await db.commit()
    await db.refresh(db_plan)
    return db_plan


@router.get("/{identifier}", response_model=InterviewPlanResponse)
async def get_plan(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve saved interview plan by engineer_id, plan_id, or github_username."""
    result = await db.execute(
        select(InterviewPlan).where(
            (InterviewPlan.id == identifier)
            | (InterviewPlan.engineer_id == identifier)
            | (InterviewPlan.github_username == identifier)
        ).order_by(InterviewPlan.created_at.desc())
    )
    plan = result.scalars().first()

    if not plan:
        # Automatically generate if engineer exists or username passed
        eng_result = await db.execute(
            select(Engineer)
            .options(selectinload(Engineer.repos))
            .where(
                (Engineer.id == identifier) | (Engineer.github_username == identifier)
            )
        )
        engineer = eng_result.scalars().first()
        username = engineer.github_username if engineer else identifier
        eng_dict = None
        if engineer:
            eng_dict = {
                "name": engineer.name,
                "github_username": engineer.github_username,
                "archetype": engineer.archetype,
                "primary_languages": engineer.primary_languages,
                "frameworks": engineer.frameworks,
                "strengths": engineer.strengths,
                "repos": [
                    {"repo_full_name": r.repo_full_name, "language": r.language, "stars": r.stars}
                    for r in (engineer.repos or [])
                ],
            }
        plan_data = generate_interview_plan(github_username=username, engineer_profile=eng_dict)
        plan = InterviewPlan(
            id=plan_data["id"],
            engineer_id=engineer.id if engineer else None,
            github_username=username,
            candidate_name=plan_data["candidate_name"],
            questions=plan_data["questions"],
            overview_summary=plan_data["overview_summary"],
            recommended_duration_mins=plan_data["recommended_duration_mins"],
        )
        db.add(plan)
        await db.commit()
        await db.refresh(plan)
    return plan


@router.post("/{identifier}/questions")
async def add_question(
    identifier: str,
    q_create: InterviewQuestionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a custom question to an existing interview plan."""
    plan = await get_plan(identifier, db)

    new_q = {
        "id": str(uuid.uuid4()),
        "category": q_create.category,
        "question": q_create.question,
        "context_reference": q_create.context_reference,
        "ideal_answer": q_create.ideal_answer,
        "red_flags": q_create.red_flags,
        "probing_hints": q_create.probing_hints,
        "difficulty": q_create.difficulty,
        "estimated_time_mins": q_create.estimated_time_mins,
        "user_notes": None,
        "is_asked": False,
        "rating": None,
    }

    current_questions = list(plan.questions or [])
    current_questions.append(new_q)
    plan.questions = current_questions

    await db.commit()
    await db.refresh(plan)
    return plan


@router.put("/{identifier}/questions/{question_id}")
async def update_question(
    identifier: str,
    question_id: str,
    q_update: InterviewQuestionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update question fields (rating, is_asked, user_notes, text, etc.)."""
    plan = await get_plan(identifier, db)
    current_questions = list(plan.questions or [])

    found = False
    for q in current_questions:
        if q.get("id") == question_id:
            found = True
            update_data = q_update.model_dump(exclude_unset=True)
            for key, val in update_data.items():
                if val is not None:
                    q[key] = val
            break

    if not found:
        raise HTTPException(status_code=404, detail="Question ID not found in plan")

    plan.questions = current_questions
    await db.commit()
    await db.refresh(plan)
    return plan


@router.delete("/{identifier}/questions/{question_id}")
async def delete_question(
    identifier: str,
    question_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a question from an interview plan."""
    plan = await get_plan(identifier, db)
    current_questions = [q for q in (plan.questions or []) if q.get("id") != question_id]

    plan.questions = current_questions
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/{identifier}/export")
async def export_plan_markdown(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Export the interview plan as a downloadable Markdown document."""
    plan = await get_plan(identifier, db)
    plan_dict = {
        "github_username": plan.github_username,
        "candidate_name": plan.candidate_name,
        "overview_summary": plan.overview_summary,
        "recommended_duration_mins": plan.recommended_duration_mins,
        "questions": plan.questions,
    }
    md_content = export_interview_plan_markdown(plan_dict)

    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename=interview_{plan.github_username}.md"
        },
    )
