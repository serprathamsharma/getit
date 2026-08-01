"""API routes for triggering GitHub profile analysis."""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.schemas import AnalyzeRequest, AnalysisResponse, EngineerProfile, ScoreBreakdown, RepoSummary
from app.services.analyzer import analyzer_service
from app.models.models import EngineerRepo
from sqlalchemy import select, desc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analyze", tags=["analysis"])


@router.post("/{username}", response_model=AnalysisResponse)
async def analyze_engineer(username: str, db: AsyncSession = Depends(get_db)):
    """
    Trigger analysis of a GitHub user.
    Fetches their data, computes metrics, generates AI profile, and scores them.
    """
    try:
        logger.info(f"Analysis requested for: {username}")

        engineer = await analyzer_service.analyze_engineer(username, db)

        if not engineer:
            raise HTTPException(
                status_code=404,
                detail=f"GitHub user '{username}' not found or could not be analyzed."
            )

        await db.commit()

        # Fetch repos for the response
        repos_result = await db.execute(
            select(EngineerRepo)
            .where(EngineerRepo.engineer_id == engineer.id)
            .order_by(desc(EngineerRepo.stars))
        )
        repos = repos_result.scalars().all()

        profile = EngineerProfile(
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

        return AnalysisResponse(
            status="complete",
            message=f"Successfully analyzed {username}",
            engineer_id=engineer.id,
            profile=profile,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed for {username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
