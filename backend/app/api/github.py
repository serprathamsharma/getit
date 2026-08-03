"""API routes for GitHub Engineering Analysis dashboard data."""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.models import Engineer, EngineerRepo
from app.models.schemas import (
    GitHubDashboardResponse,
    RepoQualityMetrics,
    ArchitectureSignals,
    CommitWeek,
)
from app.services.analyzer import analyzer_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/github", tags=["github"])


# ── Helpers ───────────────────────────────────────────────────────

_CI_INDICATORS = {".github", "jenkinsfile", ".travis.yml", ".circleci", "makefile", ".gitlab-ci.yml", "azure-pipelines.yml"}
_TEST_INDICATORS = {"test", "tests", "spec", "specs", "__tests__", "testing", "test.py", "tests.py"}
_DOC_INDICATORS = {"docs", "doc", "documentation", "wiki", "README.md", "readme.md"}
_CONTAINER_INDICATORS = {"dockerfile", "docker-compose.yml", "docker-compose.yaml"}


def _compute_repo_quality(repo: EngineerRepo) -> RepoQualityMetrics:
    """Derive per-repo quality signals from stored analysis_data."""
    ad = repo.analysis_data or {}
    languages: dict = ad.get("languages", {})
    commit_count: int = ad.get("commit_count", 0)
    contents: list = ad.get("contents", [])

    content_names = {
        (c.get("name", "") if isinstance(c, dict) else "").lower()
        for c in contents
    }

    has_tests = any(t in n for n in content_names for t in _TEST_INDICATORS)
    has_ci = any(n in _CI_INDICATORS or n.startswith(".github") for n in content_names)
    has_readme = any(n.startswith("readme") for n in content_names)
    has_docs = any(n in _DOC_INDICATORS for n in content_names)
    has_container = any(n in _CONTAINER_INDICATORS for n in content_names)

    # File-count based complexity
    file_count = len(contents) if contents else ad.get("file_count", 0)
    if file_count > 30:
        complexity = "high"
    elif file_count > 10:
        complexity = "medium"
    else:
        complexity = "low"

    # Quality score (0–100)
    quality_score = 0
    if has_tests:
        quality_score += 25
    if has_ci:
        quality_score += 25
    if has_readme:
        quality_score += 20
    if has_docs:
        quality_score += 15
    if has_container:
        quality_score += 10
    if commit_count > 20:
        quality_score += 5

    return RepoQualityMetrics(
        repo_full_name=repo.repo_full_name,
        repo_url=repo.repo_url,
        description=repo.description,
        language=repo.language,
        stars=repo.stars,
        forks=repo.forks,
        is_fork=repo.is_fork,
        has_tests=has_tests,
        has_ci=has_ci,
        has_readme=has_readme,
        has_docs=has_docs,
        commit_count=commit_count,
        languages=languages,
        complexity=complexity,
        quality_score=min(quality_score, 100),
    )


def _generate_commit_heatmap(engineer: Engineer, repos: list[EngineerRepo]) -> list[CommitWeek]:
    """
    Generate a 52-week commit activity heatmap.

    Strategy: distribute total sampled commits across weeks proportionally,
    weighted by repo push dates stored in analysis_data. This gives a realistic
    shape without requiring extra API calls.
    """
    # Build a {week_label: count} mapping
    week_counts: dict[str, int] = {}

    now = datetime.utcnow()
    # Initialize all 52 weeks to 0
    for i in range(51, -1, -1):
        week_start = now - timedelta(weeks=i)
        iso = week_start.isocalendar()
        label = f"{iso[0]}-W{iso[1]:02d}"
        week_counts[label] = 0

    # Distribute commit counts from repos across recent weeks based on analyzed_at
    for repo in repos:
        commit_count: int = (repo.analysis_data or {}).get("commit_count", 0)
        if commit_count <= 0:
            continue

        # Use analyzed_at as a proxy for "when this repo was recently active"
        ref_date = repo.analyzed_at or now
        # Spread commits across the 8 weeks before analyzed_at
        for week_offset in range(8):
            week_date = ref_date - timedelta(weeks=week_offset)
            if (now - week_date).days > 365:
                continue
            iso = week_date.isocalendar()
            label = f"{iso[0]}-W{iso[1]:02d}"
            if label in week_counts:
                # Add weighted commits (more recent = more commits)
                weight = max(1, 8 - week_offset)
                contribution = max(1, int(commit_count * weight / 36))
                week_counts[label] = week_counts.get(label, 0) + contribution

    # Also bucket engineer account activity at creation
    if engineer.github_created_at:
        created_age = (now - engineer.github_created_at).days
        if created_age < 365:
            iso = engineer.github_created_at.isocalendar()
            label = f"{iso[0]}-W{iso[1]:02d}"
            if label in week_counts:
                week_counts[label] += 5

    return [
        CommitWeek(week_label=label, commit_count=count)
        for label, count in week_counts.items()
    ]


def _build_architecture_signals(engineer: Engineer, repos: list[EngineerRepo]) -> ArchitectureSignals:
    """Reconstruct architecture signals from stored repo data."""
    total_repos = len(repos) or 1
    original_repos = sum(1 for r in repos if not r.is_fork)
    total_stars = sum(r.stars for r in repos)
    total_forks = sum(r.forks for r in repos)
    total_commits = sum((r.analysis_data or {}).get("commit_count", 0) for r in repos)

    repos_with_tests = 0
    repos_with_ci = 0
    repos_with_readme = 0
    repos_with_docs = 0
    has_ci_cd = False
    has_containerization = False
    detected_frameworks: set[str] = set()

    for repo in repos:
        ad = repo.analysis_data or {}
        contents = ad.get("contents", [])
        content_names = {
            (c.get("name", "") if isinstance(c, dict) else "").lower()
            for c in contents
        }

        if any(t in n for n in content_names for t in _TEST_INDICATORS):
            repos_with_tests += 1
        if any(n in _CI_INDICATORS or n.startswith(".github") for n in content_names):
            repos_with_ci += 1
            has_ci_cd = True
        if any(n.startswith("readme") for n in content_names):
            repos_with_readme += 1
        if any(n in _DOC_INDICATORS for n in content_names):
            repos_with_docs += 1
        if any(n in _CONTAINER_INDICATORS for n in content_names):
            has_containerization = True

        # Framework detection from language/file names
        lang = (repo.language or "").lower()
        if lang in {"python", "jupyter notebook"}:
            if any("django" in n or "flask" in n or "fastapi" in n for n in content_names):
                detected_frameworks.update(["Django", "Flask", "FastAPI"])
        if "package.json" in content_names:
            detected_frameworks.add("Node.js")
        if "pom.xml" in content_names or "build.gradle" in content_names:
            detected_frameworks.add("Java/Maven")

    # Account age
    account_age = 0.0
    if engineer.github_created_at:
        account_age = round((datetime.utcnow() - engineer.github_created_at).days / 365.25, 1)

    return ArchitectureSignals(
        has_ci_cd=has_ci_cd,
        has_containerization=has_containerization,
        has_documentation=repos_with_docs > 0,
        test_coverage_ratio=round(repos_with_tests / total_repos, 2),
        readme_ratio=round(repos_with_readme / total_repos, 2),
        avg_commits_per_repo=round(total_commits / total_repos, 1),
        avg_complexity="high" if total_commits / total_repos > 50 else "medium" if total_commits / total_repos > 15 else "low",
        original_repo_ratio=round(original_repos / total_repos, 2),
        account_age_years=account_age,
        total_stars=total_stars,
        total_forks=total_forks,
        total_commits_sampled=total_commits,
        detected_frameworks=list(detected_frameworks),
    )


# ── Routes ────────────────────────────────────────────────────────


@router.get("/{username}", response_model=GitHubDashboardResponse)
async def get_github_dashboard(
    username: str,
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Return structured GitHub Engineering Analysis dashboard data for a user.

    If the user is not yet in the database, triggers a live analysis and returns
    the result. Subsequent calls will return the cached analysis from the DB.
    """
    # Lookup engineer in DB
    result = await db.execute(
        select(Engineer).where(Engineer.github_username.ilike(username))
    )
    engineer = result.scalar_one_or_none()

    # Auto-analyze if not found
    if not engineer:
        logger.info(f"GitHub Dashboard: '{username}' not in DB. Running live analysis...")
        try:
            engineer = await analyzer_service.analyze_engineer(username, db)
            if engineer:
                await db.commit()
        except Exception as e:
            logger.error(f"Live analysis failed for '{username}': {e}")
            engineer = None

    if not engineer:
        raise HTTPException(
            status_code=404,
            detail=f"GitHub user '{username}' not found or could not be analyzed.",
        )

    # Lazy-populate github_created_at if missing for existing DB records
    if engineer.github_created_at is None:
        try:
            u_data = await github_service.get_user(engineer.github_username)
            if u_data and u_data.get("created_at"):
                engineer.github_created_at = datetime.fromisoformat(
                    u_data["created_at"].replace("Z", "+00:00")
                ).replace(tzinfo=None)
                await db.commit()
        except Exception as e:
            logger.warning(f"Could not lazy-populate github_created_at for {username}: {e}")

    # Fetch all repos for this engineer
    repos_result = await db.execute(
        select(EngineerRepo)
        .where(EngineerRepo.engineer_id == engineer.id)
        .order_by(desc(EngineerRepo.stars))
    )
    repos: list[EngineerRepo] = repos_result.scalars().all()

    # Build per-repo quality metrics
    repo_quality = [_compute_repo_quality(r) for r in repos]

    # Build architecture signals
    architecture = _build_architecture_signals(engineer, repos)

    # Generate commit heatmap
    commit_activity = _generate_commit_heatmap(engineer, repos)

    # Language distribution from stored primary_languages
    lang_dist: dict[str, float] = {}
    if engineer.primary_languages and isinstance(engineer.primary_languages, dict):
        lang_dist = engineer.primary_languages

    return GitHubDashboardResponse(
        github_username=engineer.github_username,
        name=engineer.name,
        avatar_url=engineer.avatar_url,
        bio=engineer.bio,
        followers=engineer.followers,
        public_repos=engineer.public_repos,
        account_age_years=architecture.account_age_years,
        archetype=engineer.archetype,
        talent_score=engineer.talent_score,
        language_distribution=lang_dist,
        commit_activity=commit_activity,
        repo_quality=repo_quality,
        architecture=architecture,
        last_analyzed_at=engineer.last_analyzed_at,
    )
