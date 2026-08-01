"""Multi-dimensional scoring engine for engineer profiles.

Implements the scoring model from the spec:
- Technical Depth (30%)
- Output Quality (25%)
- Consistency (20%)
- Collaboration (15%)
- Specialization (10%)
"""

import math
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ── Score Weights ────────────────────────────────────────────────

WEIGHTS = {
    "technical_depth": 0.30,
    "output_quality": 0.25,
    "consistency": 0.20,
    "collaboration": 0.15,
    "specialization": 0.10,
}

# ── Archetype Definitions ───────────────────────────────────────

ARCHETYPES = {
    "Backend Systems Engineer": {
        "languages": ["Go", "Rust", "Java", "C++", "Python"],
        "signals": ["api", "server", "database", "microservice", "distributed"],
    },
    "Frontend Engineer": {
        "languages": ["JavaScript", "TypeScript"],
        "signals": ["react", "vue", "angular", "css", "ui", "frontend", "component"],
    },
    "Full-Stack Developer": {
        "languages": ["JavaScript", "TypeScript", "Python", "Ruby"],
        "signals": ["fullstack", "full-stack", "web", "api", "frontend", "backend"],
    },
    "ML/AI Engineer": {
        "languages": ["Python", "Jupyter Notebook", "R"],
        "signals": ["machine-learning", "ml", "ai", "deep-learning", "tensorflow", "pytorch", "model"],
    },
    "DevOps/Infrastructure": {
        "languages": ["Python", "Shell", "Go", "HCL"],
        "signals": ["docker", "kubernetes", "terraform", "ci", "cd", "infrastructure", "deploy"],
    },
    "Mobile Developer": {
        "languages": ["Swift", "Kotlin", "Dart", "Java"],
        "signals": ["ios", "android", "mobile", "flutter", "react-native"],
    },
    "Systems Programmer": {
        "languages": ["C", "C++", "Rust", "Assembly"],
        "signals": ["kernel", "os", "embedded", "low-level", "performance", "compiler"],
    },
    "Data Engineer": {
        "languages": ["Python", "Scala", "SQL", "Java"],
        "signals": ["data", "pipeline", "etl", "spark", "kafka", "streaming", "warehouse"],
    },
    "Security Engineer": {
        "languages": ["Python", "C", "Go", "Rust"],
        "signals": ["security", "crypto", "vulnerability", "audit", "penetration"],
    },
    "Open Source Maintainer": {
        "languages": [],
        "signals": ["maintainer", "community", "contributor", "oss"],
    },
}


def compute_scores(github_data: dict, metrics: dict) -> dict:
    """
    Compute all score dimensions from raw GitHub data and computed metrics.

    Returns a dict with individual scores (0-10), composite talent_score (0-100),
    archetype, and confidence.
    """
    technical = _score_technical_depth(github_data, metrics)
    output = _score_output_quality(github_data, metrics)
    consistency = _score_consistency(github_data, metrics)
    collaboration = _score_collaboration(github_data, metrics)
    specialization = _score_specialization(github_data, metrics)

    # Composite score (0-100)
    talent_score = (
        technical * WEIGHTS["technical_depth"]
        + output * WEIGHTS["output_quality"]
        + consistency * WEIGHTS["consistency"]
        + collaboration * WEIGHTS["collaboration"]
        + specialization * WEIGHTS["specialization"]
    ) * 10  # Scale from 0-10 to 0-100

    # Clamp
    talent_score = max(0, min(100, talent_score))

    # Confidence scoring
    confidence = _compute_confidence(github_data, metrics)

    # Archetype classification
    archetype = _classify_archetype(github_data, metrics)

    # Gaming detection
    gaming_warnings = _detect_gaming(github_data, metrics)

    # Would-hire score (1-5 stars)
    would_hire = _compute_would_hire(talent_score, confidence, gaming_warnings)

    return {
        "talent_score": round(talent_score, 1),
        "score_breakdown": {
            "technical_depth": round(technical, 1),
            "output_quality": round(output, 1),
            "consistency": round(consistency, 1),
            "collaboration": round(collaboration, 1),
            "specialization": round(specialization, 1),
        },
        "confidence": round(confidence, 2),
        "archetype": archetype,
        "would_hire_score": round(would_hire, 1),
        "gaming_warnings": gaming_warnings,
    }


# ── Individual Score Functions ───────────────────────────────────


def _score_technical_depth(github_data: dict, metrics: dict) -> float:
    """Score based on architecture sophistication, code complexity, problem domain."""
    score = 5.0  # Start at midpoint

    # Language diversity bonus
    lang_count = metrics.get("language_count", 0)
    if lang_count >= 5:
        score += 1.5
    elif lang_count >= 3:
        score += 1.0
    elif lang_count >= 2:
        score += 0.5

    # Repo complexity (estimated from avg file count and structure depth)
    avg_complexity = metrics.get("avg_repo_complexity", "low")
    if avg_complexity == "high":
        score += 1.5
    elif avg_complexity == "medium":
        score += 0.8

    # Has CI/CD configs
    if metrics.get("has_ci_cd", False):
        score += 0.5

    # Has Docker/K8s
    if metrics.get("has_containerization", False):
        score += 0.5

    # Has test files
    test_ratio = metrics.get("test_ratio", 0)
    if test_ratio > 0.15:
        score += 1.0
    elif test_ratio > 0.05:
        score += 0.5

    # Documentation quality
    if metrics.get("has_docs", False):
        score += 0.5

    return max(0, min(10, score))


def _score_output_quality(github_data: dict, metrics: dict) -> float:
    """Score based on repo quality, project utility, OSS impact."""
    score = 4.0

    # Stars received
    total_stars = metrics.get("total_stars", 0)
    if total_stars >= 1000:
        score += 3.0
    elif total_stars >= 100:
        score += 2.0
    elif total_stars >= 20:
        score += 1.5
    elif total_stars >= 5:
        score += 0.8

    # Forks (people using the code)
    total_forks = metrics.get("total_forks", 0)
    if total_forks >= 100:
        score += 1.5
    elif total_forks >= 20:
        score += 1.0
    elif total_forks >= 5:
        score += 0.5

    # Repos with README
    readme_ratio = metrics.get("readme_ratio", 0)
    if readme_ratio > 0.8:
        score += 0.8
    elif readme_ratio > 0.5:
        score += 0.4

    # Non-fork ratio (original work)
    original_ratio = metrics.get("original_repo_ratio", 0)
    if original_ratio > 0.8:
        score += 0.5
    elif original_ratio < 0.3:
        score -= 1.0

    return max(0, min(10, score))


def _score_consistency(github_data: dict, metrics: dict) -> float:
    """Score based on activity span, commit regularity, sustained contribution."""
    score = 4.0

    # Account age
    account_age_years = metrics.get("account_age_years", 0)
    if account_age_years >= 5:
        score += 2.0
    elif account_age_years >= 3:
        score += 1.5
    elif account_age_years >= 1:
        score += 0.8

    # Recent activity (last 90 days)
    if metrics.get("active_last_90_days", False):
        score += 1.0

    # Commit frequency
    avg_commits_per_repo = metrics.get("avg_commits_per_repo", 0)
    if avg_commits_per_repo >= 50:
        score += 1.5
    elif avg_commits_per_repo >= 20:
        score += 1.0
    elif avg_commits_per_repo >= 5:
        score += 0.5

    # Sustained multi-repo activity
    active_repos = metrics.get("repos_with_recent_activity", 0)
    if active_repos >= 5:
        score += 1.0
    elif active_repos >= 3:
        score += 0.5

    return max(0, min(10, score))


def _score_collaboration(github_data: dict, metrics: dict) -> float:
    """Score based on PR reviews, issue engagement, community involvement."""
    score = 4.0

    # Has collaborators / external contributions
    followers = github_data.get("user", {}).get("followers", 0)
    if followers >= 100:
        score += 2.0
    elif followers >= 20:
        score += 1.0
    elif followers >= 5:
        score += 0.5

    # PR activity
    total_prs = metrics.get("total_prs_authored", 0)
    if total_prs >= 50:
        score += 1.5
    elif total_prs >= 10:
        score += 1.0
    elif total_prs >= 3:
        score += 0.5

    # Issues engagement
    total_issues = metrics.get("total_issues", 0)
    if total_issues >= 50:
        score += 1.0
    elif total_issues >= 10:
        score += 0.5

    # Organizations
    orgs = github_data.get("user", {}).get("public_gists", 0)
    if orgs > 0:
        score += 0.5

    return max(0, min(10, score))


def _score_specialization(github_data: dict, metrics: dict) -> float:
    """Score based on domain concentration and language/tool depth."""
    score = 5.0

    # Primary language dominance
    language_distribution = metrics.get("language_distribution", {})
    if language_distribution:
        sorted_langs = sorted(language_distribution.values(), reverse=True)
        if sorted_langs:
            top_pct = sorted_langs[0] / sum(sorted_langs) if sum(sorted_langs) > 0 else 0
            if top_pct >= 0.6:
                score += 1.5  # Deep specialization
            elif top_pct >= 0.35:
                score += 1.0  # Good focus
            else:
                score += 0.5  # Generalist (slightly less specialized)

    # Domain consistency
    if metrics.get("domain_focus", False):
        score += 1.5

    # Framework depth
    framework_count = len(metrics.get("detected_frameworks", []))
    if framework_count >= 3:
        score += 1.0
    elif framework_count >= 1:
        score += 0.5

    return max(0, min(10, score))


# ── Confidence Scoring ───────────────────────────────────────────


def _compute_confidence(github_data: dict, metrics: dict) -> float:
    """
    Confidence score (0-1) based on data completeness, signal diversity,
    temporal spread, and cross-validation.
    """
    completeness = 0.0
    diversity = 0.0
    temporal = 0.0
    cross_val = 0.0

    # Data completeness (0-1)
    repos_analyzed = len(github_data.get("repo_details", []))
    total_repos = github_data.get("user", {}).get("public_repos", 1)
    completeness = min(1.0, repos_analyzed / max(total_repos, 1))

    # Signal diversity (0-1)
    signals = 0
    if metrics.get("language_count", 0) > 0:
        signals += 1
    if metrics.get("total_stars", 0) > 0:
        signals += 1
    if metrics.get("total_commits", 0) > 0:
        signals += 1
    if metrics.get("total_prs_authored", 0) > 0:
        signals += 1
    if metrics.get("has_ci_cd", False):
        signals += 1
    if metrics.get("test_ratio", 0) > 0:
        signals += 1
    diversity = min(1.0, signals / 6)

    # Temporal spread (0-1)
    years = metrics.get("account_age_years", 0)
    temporal = min(1.0, years / 5)

    # Cross-validation (simplified)
    cross_val = 0.7 if repos_analyzed >= 3 else 0.4

    confidence = (
        completeness * 0.4
        + diversity * 0.3
        + temporal * 0.2
        + cross_val * 0.1
    )

    return max(0.0, min(1.0, confidence))


# ── Archetype Classification ────────────────────────────────────


def _classify_archetype(github_data: dict, metrics: dict) -> str:
    """Determine the best-fit engineer archetype based on language and signal analysis."""
    language_dist = metrics.get("language_distribution", {})
    repo_descriptions = []
    repo_names = []

    for rd in github_data.get("repo_details", []):
        repo = rd.get("repo", {})
        desc = (repo.get("description") or "").lower()
        name = (repo.get("name") or "").lower()
        repo_descriptions.append(desc)
        repo_names.append(name)

    all_text = " ".join(repo_descriptions + repo_names)
    top_languages = sorted(language_dist.keys(), key=lambda l: language_dist[l], reverse=True)

    best_archetype = "Full-Stack Developer"
    best_score = 0

    for archetype, criteria in ARCHETYPES.items():
        archetype_score = 0

        # Language match
        for lang in criteria["languages"]:
            if lang in top_languages[:5]:
                archetype_score += 2

        # Signal match (keyword in repo names/descriptions)
        for signal in criteria["signals"]:
            if signal in all_text:
                archetype_score += 1

        if archetype_score > best_score:
            best_score = archetype_score
            best_archetype = archetype

    return best_archetype


# ── Gaming Detection ────────────────────────────────────────────


def _detect_gaming(github_data: dict, metrics: dict) -> list[str]:
    """Detect potential gaming patterns."""
    warnings = []

    # High fork ratio
    original_ratio = metrics.get("original_repo_ratio", 1.0)
    if original_ratio < 0.2:
        warnings.append("High fork ratio — mostly borrowed code, limited original work visible")

    # Very small average commit size
    avg_commit_size = metrics.get("avg_commit_size", 50)
    if avg_commit_size < 10 and metrics.get("total_commits", 0) > 20:
        warnings.append("Suspiciously small average commit size — possible commit spam")

    # No tests detected
    test_ratio = metrics.get("test_ratio", 0)
    if test_ratio < 0.01 and metrics.get("total_repos_analyzed", 0) >= 5:
        top_langs = list(metrics.get("language_distribution", {}).keys())[:3]
        testable = any(l in ["Python", "JavaScript", "TypeScript", "Go", "Java", "Rust"] for l in top_langs)
        if testable:
            warnings.append("No test files detected across analyzed repos — quality concerns")

    # Star-to-fork ratio anomaly
    total_stars = metrics.get("total_stars", 0)
    total_forks = metrics.get("total_forks", 0)
    if total_stars > 100 and total_forks > 0:
        ratio = total_stars / total_forks
        if ratio > 50:
            warnings.append("Unusually high star-to-fork ratio — potential star farming")

    return warnings


# ── Would-Hire Score ─────────────────────────────────────────────


def _compute_would_hire(talent_score: float, confidence: float, warnings: list[str]) -> float:
    """Convert talent score to a 1-5 hire recommendation."""
    base = talent_score / 20  # 0-5 range

    # Penalize low confidence
    if confidence < 0.4:
        base *= 0.7
    elif confidence < 0.6:
        base *= 0.85

    # Penalize gaming warnings
    base -= len(warnings) * 0.3

    return max(1.0, min(5.0, base))
