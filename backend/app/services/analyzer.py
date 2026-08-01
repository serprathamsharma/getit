"""Main analysis engine — orchestrates the 4-layer analysis pipeline.

Layer 1: Raw data extraction (GitHub API)
Layer 2: Structured metrics computation
Layer 3: Semantic analysis (LLM)
Layer 4: Synthesis & scoring
"""

import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Engineer, EngineerRepo
from app.services.github import github_service
from app.services.scoring import compute_scores
from app.services.llm import llm_service

logger = logging.getLogger(__name__)


class AnalyzerService:
    """Orchestrates the full engineer analysis pipeline."""

    async def analyze_engineer(self, username: str, db: AsyncSession) -> Engineer | None:
        """
        Run the full analysis pipeline for a GitHub user.

        1. Fetch raw data from GitHub
        2. Compute structured metrics
        3. Run LLM synthesis
        4. Compute scores
        5. Persist to database
        """
        logger.info(f"Starting analysis for: {username}")

        # ── Layer 1: Raw Data Extraction ────────────────────────
        github_data = await github_service.collect_full_profile(username)
        if not github_data or not github_data.get("user"):
            logger.error(f"Could not fetch GitHub data for {username}")
            return None

        user_data = github_data["user"]
        logger.info(f"Fetched data for {user_data.get('login')}: {len(github_data.get('repo_details', []))} repos analyzed")

        # ── Layer 2: Structured Metrics Computation ─────────────
        metrics = self._compute_metrics(github_data)
        logger.info(f"Computed metrics: {metrics.get('language_count')} languages, {metrics.get('total_stars')} stars")

        # ── Layer 3 & 4: Scoring + LLM Synthesis ────────────────
        scores = compute_scores(github_data, metrics)
        logger.info(f"Scores: talent={scores['talent_score']}, confidence={scores['confidence']}")

        llm_profile = await llm_service.synthesize_profile(github_data, metrics, scores)
        logger.info(f"LLM synthesis complete: archetype={scores['archetype']}")

        # ── Persist to Database ─────────────────────────────────
        engineer = await self._persist_engineer(
            db=db,
            user_data=user_data,
            github_data=github_data,
            metrics=metrics,
            scores=scores,
            llm_profile=llm_profile,
        )

        return engineer

    def _compute_metrics(self, github_data: dict) -> dict:
        """Layer 2: Compute structured metrics from raw GitHub data."""
        user = github_data.get("user", {})
        repos = github_data.get("repo_details", [])
        events = github_data.get("events", [])

        # Language distribution
        language_bytes: dict[str, int] = {}
        for rd in repos:
            for lang, bytes_count in rd.get("languages", {}).items():
                language_bytes[lang] = language_bytes.get(lang, 0) + bytes_count

        total_bytes = sum(language_bytes.values()) or 1
        language_distribution = {
            lang: round(bytes_count / total_bytes * 100, 1)
            for lang, bytes_count in sorted(language_bytes.items(), key=lambda x: x[1], reverse=True)
        }

        # Repo statistics
        total_stars = 0
        total_forks = 0
        total_commits = 0
        original_repos = 0
        fork_repos = 0
        repos_with_tests = 0
        repos_with_ci = 0
        repos_with_readme = 0
        repos_with_docs = 0
        repos_with_recent_activity = 0
        all_commit_sizes = []
        detected_frameworks: set[str] = set()

        ci_indicators = {
            ".github", "Jenkinsfile", ".travis.yml", ".circleci",
            "Makefile", ".gitlab-ci.yml", "azure-pipelines.yml",
        }
        test_indicators = {"test", "tests", "spec", "specs", "__tests__", "testing"}
        doc_indicators = {"docs", "doc", "documentation", "wiki"}
        container_indicators = {"Dockerfile", "docker-compose.yml", "docker-compose.yaml"}

        has_ci_cd = False
        has_containerization = False

        for rd in repos:
            repo = rd.get("repo", {})
            stars = repo.get("stargazers_count", 0)
            forks = repo.get("forks_count", 0)
            commits = rd.get("commits", [])
            contents = rd.get("contents", [])

            total_stars += stars
            total_forks += forks
            total_commits += len(commits)

            if repo.get("fork", False):
                fork_repos += 1
            else:
                original_repos += 1

            # Check for recent activity (last 90 days)
            if repo.get("pushed_at"):
                try:
                    pushed = datetime.fromisoformat(repo["pushed_at"].replace("Z", "+00:00"))
                    if pushed > datetime.now(pushed.tzinfo) - timedelta(days=90):
                        repos_with_recent_activity += 1
                except (ValueError, TypeError):
                    pass

            # Analyze repo contents for patterns
            content_names = set()
            if contents:
                for item in contents:
                    name = item.get("name", "").lower() if isinstance(item, dict) else ""
                    content_names.add(name)
                    # Check for test directories/files
                    if any(t in name for t in test_indicators):
                        repos_with_tests += 1
                        break

            for item in contents or []:
                name = item.get("name", "") if isinstance(item, dict) else ""
                # CI/CD
                if name in ci_indicators or name.startswith(".github"):
                    has_ci_cd = True
                    repos_with_ci += 1
                # Docs
                if name.lower() in doc_indicators:
                    repos_with_docs += 1
                # README
                if name.lower().startswith("readme"):
                    repos_with_readme += 1
                # Container
                if name in container_indicators:
                    has_containerization = True

            # Commit size analysis
            for commit in commits:
                # GitHub commit stats aren't always available in list endpoint
                # We estimate from message length as a proxy
                msg = commit.get("commit", {}).get("message", "")
                all_commit_sizes.append(len(msg))

        total_repos = len(repos) or 1

        # Account age
        created_at = user.get("created_at", "")
        try:
            created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            account_age_years = (datetime.now(created.tzinfo) - created).days / 365.25
        except (ValueError, TypeError):
            account_age_years = 1

        # PR count estimation from events
        pr_events = [e for e in events if e.get("type") == "PullRequestEvent"]
        issue_events = [e for e in events if e.get("type") == "IssuesEvent"]

        # Complexity estimation
        avg_file_count = sum(
            len(rd.get("contents", []))
            for rd in repos
        ) / max(len(repos), 1)

        if avg_file_count > 30:
            avg_complexity = "high"
        elif avg_file_count > 10:
            avg_complexity = "medium"
        else:
            avg_complexity = "low"

        return {
            "language_distribution": language_distribution,
            "language_count": len(language_distribution),
            "total_stars": total_stars,
            "total_forks": total_forks,
            "total_commits": total_commits,
            "total_repos_analyzed": len(repos),
            "original_repos": original_repos,
            "fork_repos": fork_repos,
            "original_repo_ratio": original_repos / max(total_repos, 1),
            "test_ratio": repos_with_tests / max(total_repos, 1),
            "has_ci_cd": has_ci_cd,
            "has_containerization": has_containerization,
            "has_docs": repos_with_docs > 0,
            "readme_ratio": repos_with_readme / max(total_repos, 1),
            "avg_commits_per_repo": total_commits / max(total_repos, 1),
            "avg_commit_size": sum(all_commit_sizes) / max(len(all_commit_sizes), 1),
            "account_age_years": round(account_age_years, 1),
            "active_last_90_days": repos_with_recent_activity > 0,
            "repos_with_recent_activity": repos_with_recent_activity,
            "total_prs_authored": len(pr_events),
            "total_issues": len(issue_events),
            "avg_repo_complexity": avg_complexity,
            "domain_focus": len(language_distribution) <= 4,
            "detected_frameworks": list(detected_frameworks),
        }

    async def _persist_engineer(
        self,
        db: AsyncSession,
        user_data: dict,
        github_data: dict,
        metrics: dict,
        scores: dict,
        llm_profile: dict,
    ) -> Engineer:
        """Save or update engineer profile in the database."""
        # Check if engineer exists
        result = await db.execute(
            select(Engineer).where(Engineer.github_username == user_data["login"])
        )
        engineer = result.scalar_one_or_none()

        # Prepare language data
        lang_dist = metrics.get("language_distribution", {})

        if engineer:
            # Update existing
            engineer.name = user_data.get("name")
            engineer.avatar_url = user_data.get("avatar_url")
            engineer.bio = user_data.get("bio")
            engineer.location = user_data.get("location")
            engineer.email = user_data.get("email")
            engineer.blog_url = user_data.get("blog")
            engineer.company = user_data.get("company")
            engineer.followers = user_data.get("followers", 0)
            engineer.following = user_data.get("following", 0)
            engineer.public_repos = user_data.get("public_repos", 0)
        else:
            # Create new
            engineer = Engineer(
                github_username=user_data["login"],
                github_id=user_data["id"],
                name=user_data.get("name"),
                avatar_url=user_data.get("avatar_url"),
                bio=user_data.get("bio"),
                location=user_data.get("location"),
                email=user_data.get("email"),
                blog_url=user_data.get("blog"),
                company=user_data.get("company"),
                followers=user_data.get("followers", 0),
                following=user_data.get("following", 0),
                public_repos=user_data.get("public_repos", 0),
            )
            db.add(engineer)

        # Update computed fields
        engineer.talent_score = scores["talent_score"]
        engineer.profile_confidence = scores["confidence"]
        engineer.archetype = scores["archetype"]
        engineer.would_hire_score = scores["would_hire_score"]
        engineer.gaming_warnings = scores["gaming_warnings"]

        breakdown = scores["score_breakdown"]
        engineer.score_technical_depth = breakdown["technical_depth"]
        engineer.score_output_quality = breakdown["output_quality"]
        engineer.score_consistency = breakdown["consistency"]
        engineer.score_collaboration = breakdown["collaboration"]
        engineer.score_specialization = breakdown["specialization"]

        # LLM profile data
        engineer.ai_summary = llm_profile.get("ai_summary")
        engineer.strengths = llm_profile.get("strengths", [])
        engineer.growth_areas = llm_profile.get("growth_areas", [])
        engineer.expertise_areas = llm_profile.get("expertise_areas", [])
        engineer.frameworks = llm_profile.get("frameworks", [])
        engineer.domains = llm_profile.get("domains", [])
        engineer.primary_languages = lang_dist
        engineer.last_analyzed_at = datetime.utcnow()
        engineer.updated_at = datetime.utcnow()

        await db.flush()

        # Persist repo analyses
        for rd in github_data.get("repo_details", []):
            repo = rd.get("repo", {})
            repo_full_name = repo.get("full_name", "")

            # Check if repo already exists
            existing = await db.execute(
                select(EngineerRepo).where(
                    EngineerRepo.engineer_id == engineer.id,
                    EngineerRepo.repo_full_name == repo_full_name,
                )
            )
            existing_repo = existing.scalar_one_or_none()

            if existing_repo:
                existing_repo.stars = repo.get("stargazers_count", 0)
                existing_repo.forks = repo.get("forks_count", 0)
                existing_repo.language = repo.get("language")
                existing_repo.description = repo.get("description")
                existing_repo.analysis_data = {
                    "languages": rd.get("languages", {}),
                    "commit_count": len(rd.get("commits", [])),
                }
                existing_repo.analyzed_at = datetime.utcnow()
            else:
                new_repo = EngineerRepo(
                    engineer_id=engineer.id,
                    repo_full_name=repo_full_name,
                    repo_url=repo.get("html_url"),
                    description=repo.get("description"),
                    stars=repo.get("stargazers_count", 0),
                    forks=repo.get("forks_count", 0),
                    language=repo.get("language"),
                    is_fork=repo.get("fork", False),
                    analysis_data={
                        "languages": rd.get("languages", {}),
                        "commit_count": len(rd.get("commits", [])),
                    },
                    analyzed_at=datetime.utcnow(),
                )
                db.add(new_repo)

        await db.flush()
        return engineer


# Singleton
analyzer_service = AnalyzerService()
