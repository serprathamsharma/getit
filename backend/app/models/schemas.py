"""Pydantic schemas for API request/response serialization."""

from pydantic import BaseModel, Field
from datetime import datetime


# ── Request Schemas ──────────────────────────────────────────────


class AnalyzeRequest(BaseModel):
    github_username: str = Field(..., min_length=1, max_length=255)


class SearchFilters(BaseModel):
    languages: list[str] | None = None
    expertise_areas: list[str] | None = None
    archetype: str | None = None
    talent_score_min: float | None = None
    talent_score_max: float | None = None
    confidence_min: float | None = None
    query: str | None = None
    sort_by: str = "talent_score"
    sort_order: str = "desc"
    page: int = 1
    page_size: int = 20


# ── Response Schemas ─────────────────────────────────────────────


class RepoSummary(BaseModel):
    repo_full_name: str
    repo_url: str | None = None
    description: str | None = None
    stars: int = 0
    forks: int = 0
    language: str | None = None
    is_fork: bool = False
    analysis_data: dict | None = None

    model_config = {"from_attributes": True}


class ScoreBreakdown(BaseModel):
    technical_depth: float = 0.0
    output_quality: float = 0.0
    consistency: float = 0.0
    collaboration: float = 0.0
    specialization: float = 0.0


class EngineerCard(BaseModel):
    """Compact view for search results / cards."""

    id: str
    github_username: str
    name: str | None = None
    avatar_url: str | None = None
    location: str | None = None
    talent_score: float | None = None
    profile_confidence: float | None = None
    archetype: str | None = None
    primary_languages: dict | None = None
    expertise_areas: list[str] | None = None
    would_hire_score: float | None = None

    model_config = {"from_attributes": True}


class EngineerProfile(BaseModel):
    """Full profile detail view."""

    id: str
    github_username: str
    github_id: int
    name: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    location: str | None = None
    email: str | None = None
    blog_url: str | None = None
    company: str | None = None
    followers: int = 0
    following: int = 0
    public_repos: int = 0

    # Computed profile
    talent_score: float | None = None
    profile_confidence: float | None = None
    archetype: str | None = None
    primary_languages: dict | None = None
    expertise_areas: list[str] | None = None
    ai_summary: str | None = None
    strengths: list[str] | None = None
    growth_areas: list[str] | None = None
    would_hire_score: float | None = None
    frameworks: list[str] | None = None
    domains: list[str] | None = None
    gaming_warnings: list[str] | None = None

    # Score breakdown
    score_breakdown: ScoreBreakdown | None = None

    # Repos
    top_repos: list[RepoSummary] = []

    # Timestamps
    created_at: datetime | None = None
    last_analyzed_at: datetime | None = None

    model_config = {"from_attributes": True}


class EngineerListResponse(BaseModel):
    engineers: list[EngineerCard]
    total: int
    page: int
    page_size: int
    total_pages: int


class AnalysisResponse(BaseModel):
    status: str
    message: str
    engineer_id: str | None = None
    profile: EngineerProfile | None = None


class AnalysisStatus(BaseModel):
    status: str  # "pending", "analyzing", "complete", "error"
    progress: int = 0  # 0-100
    message: str = ""
