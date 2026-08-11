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
    interview_questions: dict | None = None

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


# ── Resume Intelligence Schemas ───────────────────────────────────


class WorkExperience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    highlights: list[str] = []


class EducationItem(BaseModel):
    institution: str | None = None
    degree: str | None = None
    year: str | None = None


class ProjectItem(BaseModel):
    title: str | None = None
    description: str | None = None
    technologies: list[str] = []


class JobFitRequest(BaseModel):
    job_description: str = Field(..., min_length=10)


class JobFitEvaluation(BaseModel):
    match_percentage: float = 0.0
    qualification_score: float = 0.0
    verdict: str = "Neutral"  # Excellent, Strong, Moderate, Weak
    fit_summary: str = ""
    key_strengths: list[str] = []
    skill_gaps: list[str] = []
    missing_prerequisites: list[str] = []
    recommendation: str = ""


class ParsedResumeResponse(BaseModel):
    id: str
    filename: str
    file_format: str
    raw_text: str | None = None
    candidate_name: str | None = None
    github_username: str | None = None
    email: str | None = None
    phone: str | None = None

    experience_years: float | None = 0.0
    skills: list[str] = []
    work_history: list[WorkExperience] = []
    education: list[EducationItem] = []
    projects: list[ProjectItem] = []
    certifications: list[str] = []
    job_fit_evaluation: JobFitEvaluation | None = None
    model_config = {"from_attributes": True}


# ── Job Description Requirement Parsing Schemas ───────────────────


class JobDescriptionParseRequest(BaseModel):
    job_description: str = Field(..., min_length=10)


class ParsedJobDescription(BaseModel):
    role_title: str | None = None
    required_skills: list[str] = []
    nice_to_have_skills: list[str] = []
    experience_years_required: float | None = 0.0
    experience_level: str | None = None  # Junior, Mid-Level, Senior, Staff, Lead
    domain_knowledge: list[str] = []
    key_responsibilities: list[str] = []
    education_requirements: str | None = None


# ── Job Description Matching Engine Schemas ───────────────────────


class JobMatchRequest(BaseModel):
    resume_id: str
    job_description: str = Field(..., min_length=10)


class ExperienceComparison(BaseModel):
    candidate_years: float = 0.0
    required_years: float = 0.0
    meets_requirement: bool = True


class JobMatchResponse(BaseModel):
    resume_id: str
    candidate_name: str | None = None
    match_percentage: float = 0.0
    qualification_score: float = 0.0
    verdict: str = "Neutral"
    fit_summary: str = ""
    parsed_jd: ParsedJobDescription
    matched_skills: list[str] = []
    unmatched_required_skills: list[str] = []
    key_strengths: list[str] = []
    skill_gaps: list[str] = []
    missing_prerequisites: list[str] = []
    experience_comparison: ExperienceComparison
    recommendation: str = ""


# ── Interview Intelligence Schemas ─────────────────────────────────


class InterviewQuestion(BaseModel):
    id: str
    question: str
    difficulty: str
    category: str
    repo_context: str
    ideal_answer_points: list[str]
    rationale: str


class InterviewSuite(BaseModel):
    easy: list[InterviewQuestion]
    medium: list[InterviewQuestion]
    hard: list[InterviewQuestion]


class AdaptiveFollowupRequest(BaseModel):
    original_question: str
    category: str
    difficulty: str
    repo_context: str | None = None
    user_response_rating: str  # "correct", "partially_correct", "incorrect"
    candidate_answer_notes: str | None = None


class AdaptiveFollowupResponse(BaseModel):
    rating: str
    follow_up_question: str
    harder_question: str
    easier_question: str
    alternative_scenario: str
    deeper_architecture_question: str
    guidance_notes: str



