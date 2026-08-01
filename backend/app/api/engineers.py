"""API routes for engineer search and profile retrieval."""

import logging
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_

from app.core.database import get_db
from app.models.models import Engineer, EngineerRepo
from app.services.analyzer import analyzer_service
from app.models.schemas import (
    EngineerCard,
    EngineerProfile,
    EngineerListResponse,
    ScoreBreakdown,
    RepoSummary,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/engineers", tags=["engineers"])


@router.get("", response_model=EngineerListResponse)
async def list_engineers(
    query: str | None = Query(None, description="Search by name or username"),
    languages: str | None = Query(None, description="Comma-separated language filter"),
    archetype: str | None = Query(None),
    talent_score_min: float | None = Query(None, ge=0, le=100),
    talent_score_max: float | None = Query(None, ge=0, le=100),
    confidence_min: float | None = Query(None, ge=0, le=1),
    sort_by: str = Query("talent_score", description="Sort field"),
    sort_order: str = Query("desc", description="asc or desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search and list analyzed engineers with filters."""
    stmt = select(Engineer).where(Engineer.talent_score.isnot(None))

    # Text search
    if query:
        search = f"%{query}%"
        stmt = stmt.where(
            or_(
                Engineer.github_username.ilike(search),
                Engineer.name.ilike(search),
                Engineer.archetype.ilike(search),
                Engineer.bio.ilike(search),
            )
        )

    # Language filter
    if languages:
        lang_list = [l.strip() for l in languages.split(",") if l.strip()]
        for lang in lang_list:
            stmt = stmt.where(
                Engineer.primary_languages.isnot(None),
                Engineer.primary_languages.cast(String).ilike(f"%{lang}%")
            )

    # Archetype filter
    if archetype:
        stmt = stmt.where(Engineer.archetype == archetype)

    # Score filters
    if talent_score_min is not None:
        stmt = stmt.where(Engineer.talent_score >= talent_score_min)
    if talent_score_max is not None:
        stmt = stmt.where(Engineer.talent_score <= talent_score_max)
    if confidence_min is not None:
        stmt = stmt.where(Engineer.profile_confidence >= confidence_min)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    # Safe Sorting Mapping
    sort_fields = {
        "talent_score": Engineer.talent_score,
        "profile_confidence": Engineer.profile_confidence,
        "created_at": Engineer.created_at,
        "updated_at": Engineer.updated_at,
        "followers": Engineer.followers,
        "public_repos": Engineer.public_repos,
    }
    sort_column = sort_fields.get(sort_by, Engineer.talent_score)
    if sort_order == "desc":
        stmt = stmt.order_by(desc(sort_column))
    else:
        stmt = stmt.order_by(asc(sort_column))

    # Pagination
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    engineers = result.scalars().all()

    cards = [
        EngineerCard(
            id=e.id,
            github_username=e.github_username,
            name=e.name,
            avatar_url=e.avatar_url,
            location=e.location,
            talent_score=e.talent_score,
            profile_confidence=e.profile_confidence,
            archetype=e.archetype,
            primary_languages=e.primary_languages,
            expertise_areas=e.expertise_areas,
            would_hire_score=e.would_hire_score,
        )
        for e in engineers
    ]

    total_pages = max(1, (total + page_size - 1) // page_size)

    return EngineerListResponse(
        engineers=cards,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/archetypes")
async def list_archetypes(db: AsyncSession = Depends(get_db)):
    """Get all unique archetypes with counts."""
    stmt = (
        select(Engineer.archetype, func.count(Engineer.id))
        .where(Engineer.archetype.isnot(None))
        .group_by(Engineer.archetype)
        .order_by(desc(func.count(Engineer.id)))
    )
    result = await db.execute(stmt)
    return [{"archetype": row[0], "count": row[1]} for row in result.all()]


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get platform statistics."""
    total = await db.execute(select(func.count(Engineer.id)))
    avg_score = await db.execute(
        select(func.avg(Engineer.talent_score)).where(Engineer.talent_score.isnot(None))
    )
    avg_confidence = await db.execute(
        select(func.avg(Engineer.profile_confidence)).where(Engineer.profile_confidence.isnot(None))
    )

    return {
        "total_engineers": total.scalar() or 0,
        "avg_talent_score": round(avg_score.scalar() or 0, 1),
        "avg_confidence": round(avg_confidence.scalar() or 0, 2),
    }


@router.get("/by-username/{username}", response_model=EngineerProfile)
async def get_engineer_by_username(username: str, db: AsyncSession = Depends(get_db)):
    """Get engineer profile by GitHub username."""
    result = await db.execute(
        select(Engineer).where(Engineer.github_username.ilike(username))
    )
    engineer = result.scalar_one_or_none()

    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer not found. Analyze them first.")

    return await _build_profile_response(engineer, db)


@router.get("/{engineer_id}", response_model=EngineerProfile)
async def get_engineer(engineer_id: str, db: AsyncSession = Depends(get_db)):
    """Get full engineer profile by ID or username."""
    try:
        uuid.UUID(engineer_id)
        is_uuid = True
    except ValueError:
        is_uuid = False

    if is_uuid:
        result = await db.execute(select(Engineer).where(Engineer.id == engineer_id))
        engineer = result.scalar_one_or_none()
    else:
        result = await db.execute(select(Engineer).where(Engineer.github_username.ilike(engineer_id)))
        engineer = result.scalar_one_or_none()

        # If not in database, analyze live from GitHub API on the fly
        if not engineer:
            logger.info(f"Engineer '{engineer_id}' not found in DB. Auto-analyzing live from GitHub...")
            try:
                engineer = await analyzer_service.analyze_engineer(engineer_id, db)
                if engineer:
                    await db.commit()
            except Exception as e:
                logger.error(f"Live analysis failed for '{engineer_id}': {e}")
                engineer = None

    if not engineer:
        raise HTTPException(status_code=404, detail=f"GitHub user '{engineer_id}' not found or could not be analyzed.")

    return await _build_profile_response(engineer, db)


async def _build_profile_response(engineer: Engineer, db: AsyncSession) -> EngineerProfile:
    """Helper to build EngineerProfile schema from Engineer ORM model."""
    repos_result = await db.execute(
        select(EngineerRepo)
        .where(EngineerRepo.engineer_id == engineer.id)
        .order_by(desc(EngineerRepo.stars))
    )
    repos = repos_result.scalars().all()

    return EngineerProfile(
        id=engineer.id,
        github_username=engineer.github_username,
        github_id=engineer.github_id,
        name=engineer.name,
        avatar_url=engineer.avatar_url,
        bio=engineer.bio,
        location=engineer.location,
        email=engineer.email,
        blog_url=engineer.blog_url,
        company=engineer.company,
        followers=engineer.followers,
        following=engineer.following,
        public_repos=engineer.public_repos,
        talent_score=engineer.talent_score,
        profile_confidence=engineer.profile_confidence,
        archetype=engineer.archetype,
        primary_languages=engineer.primary_languages,
        expertise_areas=engineer.expertise_areas,
        ai_summary=engineer.ai_summary,
        strengths=engineer.strengths,
        growth_areas=engineer.growth_areas,
        would_hire_score=engineer.would_hire_score,
        frameworks=engineer.frameworks,
        domains=engineer.domains,
        gaming_warnings=engineer.gaming_warnings,
        score_breakdown=ScoreBreakdown(
            technical_depth=engineer.score_technical_depth or 0,
            output_quality=engineer.score_output_quality or 0,
            consistency=engineer.score_consistency or 0,
            collaboration=engineer.score_collaboration or 0,
            specialization=engineer.score_specialization or 0,
        ),
        top_repos=[
            RepoSummary(
                repo_full_name=r.repo_full_name,
                repo_url=r.repo_url,
                description=r.description,
                stars=r.stars,
                forks=r.forks,
                language=r.language,
                is_fork=r.is_fork,
                analysis_data=r.analysis_data,
            )
            for r in repos
        ],
        created_at=engineer.created_at,
        last_analyzed_at=engineer.last_analyzed_at,
    )

