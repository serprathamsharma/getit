"""SQLAlchemy ORM models for TalentRadar."""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Text, DateTime, JSON, ForeignKey, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Engineer(Base):
    """Primary entity — an analyzed GitHub engineer."""

    __tablename__ = "engineers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    github_username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    github_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    bio: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    blog_url: Mapped[str | None] = mapped_column(Text)
    company: Mapped[str | None] = mapped_column(String(255))
    followers: Mapped[int] = mapped_column(Integer, default=0)
    following: Mapped[int] = mapped_column(Integer, default=0)
    public_repos: Mapped[int] = mapped_column(Integer, default=0)

    # Computed profile data
    talent_score: Mapped[float | None] = mapped_column(Float)
    profile_confidence: Mapped[float | None] = mapped_column(Float)
    archetype: Mapped[str | None] = mapped_column(String(100))
    primary_languages: Mapped[dict | None] = mapped_column(JSON)
    expertise_areas: Mapped[list | None] = mapped_column(JSON)
    ai_summary: Mapped[str | None] = mapped_column(Text)
    strengths: Mapped[list | None] = mapped_column(JSON)
    growth_areas: Mapped[list | None] = mapped_column(JSON)
    would_hire_score: Mapped[float | None] = mapped_column(Float)
    frameworks: Mapped[list | None] = mapped_column(JSON)
    domains: Mapped[list | None] = mapped_column(JSON)
    gaming_warnings: Mapped[list | None] = mapped_column(JSON)

    # Score breakdown
    score_technical_depth: Mapped[float | None] = mapped_column(Float)
    score_output_quality: Mapped[float | None] = mapped_column(Float)
    score_consistency: Mapped[float | None] = mapped_column(Float)
    score_collaboration: Mapped[float | None] = mapped_column(Float)
    score_specialization: Mapped[float | None] = mapped_column(Float)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_analyzed_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationships
    repos: Mapped[list["EngineerRepo"]] = relationship(back_populates="engineer", cascade="all, delete-orphan")
    score_components: Mapped[list["ScoreComponent"]] = relationship(back_populates="engineer", cascade="all, delete-orphan")


class EngineerRepo(Base):
    """A repository analyzed for a specific engineer."""

    __tablename__ = "engineer_repos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    engineer_id: Mapped[str] = mapped_column(String(36), ForeignKey("engineers.id"), nullable=False)
    repo_full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    repo_url: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    stars: Mapped[int] = mapped_column(Integer, default=0)
    forks: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str | None] = mapped_column(String(100))
    is_fork: Mapped[bool] = mapped_column(default=False)
    analysis_data: Mapped[dict | None] = mapped_column(JSON)
    analyzed_at: Mapped[datetime | None] = mapped_column(DateTime)

    engineer: Mapped["Engineer"] = relationship(back_populates="repos")


class ScoreComponent(Base):
    """Individual score components for an engineer."""

    __tablename__ = "score_components"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    engineer_id: Mapped[str] = mapped_column(String(36), ForeignKey("engineers.id"), nullable=False)
    component_name: Mapped[str] = mapped_column(String(100), nullable=False)
    raw_score: Mapped[float] = mapped_column(Float, default=0.0)
    normalized_score: Mapped[float] = mapped_column(Float, default=0.0)
    weight: Mapped[float] = mapped_column(Float, default=0.0)
    details: Mapped[str | None] = mapped_column(Text)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    engineer: Mapped["Engineer"] = relationship(back_populates="score_components")


class Resume(Base):
    """Uploaded and parsed resume record with job fit evaluation."""

    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    candidate_name: Mapped[str | None] = mapped_column(String(255))
    github_username: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_format: Mapped[str] = mapped_column(String(20), nullable=False)  # pdf, docx, txt
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    file_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)

    # Parsed structured data
    parsed_data: Mapped[dict | None] = mapped_column(JSON)
    skills: Mapped[list | None] = mapped_column(JSON)
    experience_years: Mapped[float | None] = mapped_column(Float)
    work_history: Mapped[list | None] = mapped_column(JSON)
    education: Mapped[list | None] = mapped_column(JSON)
    projects: Mapped[list | None] = mapped_column(JSON)
    certifications: Mapped[list | None] = mapped_column(JSON)

    # Job Fit Analysis
    job_description: Mapped[str | None] = mapped_column(Text)
    job_fit_evaluation: Mapped[dict | None] = mapped_column(JSON)
    qualification_score: Mapped[float | None] = mapped_column(Float)

    # Optional linkage
    engineer_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("engineers.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

