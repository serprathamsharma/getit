"""Matching Engine Service comparing candidate resume details against job description criteria."""

import re
import logging
from app.models.schemas import JobMatchResponse, ParsedJobDescription, ExperienceComparison
from app.services.llm import llm_service

logger = logging.getLogger(__name__)


class MatchingEngineService:
    """Core matching service evaluating candidate resumes against job description criteria."""

    async def evaluate_candidate_match(
        self, parsed_resume: dict, job_description: str, resume_id: str = ""
    ) -> JobMatchResponse:
        """
        Runs comprehensive multi-factor comparison between candidate resume data and job criteria.
        Calculates Match Percentage, qualification score, matched/unmatched skills, and experience comparison.
        """
        # 1. Parse JD into structured criteria via Task 2.1 parser
        raw_parsed_jd = await llm_service.parse_job_description(job_description)
        parsed_jd = ParsedJobDescription(**raw_parsed_jd)

        # 2. Extract full text from candidate resume for deep search
        candidate_skills = [s.strip() for s in parsed_resume.get("skills", []) if s.strip()]
        candidate_text_parts = list(candidate_skills)

        for job in parsed_resume.get("work_history", []):
            if isinstance(job, dict):
                candidate_text_parts.append(job.get("role", ""))
                candidate_text_parts.append(job.get("company", ""))
                candidate_text_parts.append(job.get("description", ""))
                candidate_text_parts.extend(job.get("highlights", []))

        for edu in parsed_resume.get("education", []):
            if isinstance(edu, dict):
                candidate_text_parts.append(edu.get("degree", ""))
                candidate_text_parts.append(edu.get("institution", ""))

        for proj in parsed_resume.get("projects", []):
            if isinstance(proj, dict):
                candidate_text_parts.append(proj.get("title", ""))
                candidate_text_parts.append(proj.get("description", ""))
                candidate_text_parts.extend(proj.get("technologies", []))

        full_candidate_text = " ".join(candidate_text_parts).lower()

        # 3. Match required & nice-to-have skills
        matched_skills = []
        unmatched_required_skills = []

        for req_skill in parsed_jd.required_skills:
            if re.search(r"\b" + re.escape(req_skill.lower()) + r"\b", full_candidate_text):
                matched_skills.append(req_skill)
            else:
                unmatched_required_skills.append(req_skill)

        # Also check nice-to-have skill matches
        for nth_skill in parsed_jd.nice_to_have_skills:
            if re.search(r"\b" + re.escape(nth_skill.lower()) + r"\b", full_candidate_text) and nth_skill not in matched_skills:
                matched_skills.append(nth_skill)

        # 4. Evaluate fit score and verdict using LLM service / fallback
        fit_eval = await llm_service.evaluate_candidate_job_fit(
            parsed_resume=parsed_resume,
            job_description=job_description
        )

        # 5. Experience Comparison
        candidate_exp_years = float(parsed_resume.get("experience_years", 0.0) or 0.0)
        required_exp_years = float(parsed_jd.experience_years_required or 0.0)
        meets_exp = candidate_exp_years >= required_exp_years

        exp_comp = ExperienceComparison(
            candidate_years=candidate_exp_years,
            required_years=required_exp_years,
            meets_requirement=meets_exp
        )

        return JobMatchResponse(
            resume_id=resume_id,
            candidate_name=parsed_resume.get("candidate_name"),
            match_percentage=fit_eval.get("match_percentage", 0.0),
            qualification_score=fit_eval.get("qualification_score", 0.0),
            verdict=fit_eval.get("verdict", "Neutral"),
            fit_summary=fit_eval.get("fit_summary", ""),
            parsed_jd=parsed_jd,
            matched_skills=matched_skills,
            unmatched_required_skills=unmatched_required_skills,
            key_strengths=fit_eval.get("key_strengths", []),
            skill_gaps=fit_eval.get("skill_gaps", []),
            missing_prerequisites=fit_eval.get("missing_prerequisites", []),
            experience_comparison=exp_comp,
            recommendation=fit_eval.get("recommendation", "")
        )


matching_engine = MatchingEngineService()
