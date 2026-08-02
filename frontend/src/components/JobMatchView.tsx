"use client";

import React, { useState } from "react";
import { matchCandidateToJob, JobMatchResponse } from "@/lib/api";

interface JobMatchViewProps {
  resumeId: string;
  candidateName?: string | null;
  candidateExperienceYears?: number | null;
}

const SAMPLE_JDS = [
  {
    label: "[ 🚀 FULL STACK ENGINEER ]",
    title: "Senior Full Stack Engineer",
    text: "Senior Full Stack Engineer requiring 5+ years experience in React, TypeScript, Node.js, Python, PostgreSQL, and AWS. Responsible for designing scalable web architectures and REST APIs.",
  },
  {
    label: "[ ☁ DEVOPS ARCHITECT ]",
    title: "DevOps Infrastructure Architect",
    text: "DevOps Infrastructure Architect requiring 6+ years experience in Docker, Kubernetes, Terraform, AWS, Python, CI/CD pipelines, and Linux system administration.",
  },
  {
    label: "[ 🏗 CIVIL PROJECT ENGINEER ]",
    title: "Civil Project Engineer",
    text: "Civil Project Engineer requiring 5+ years experience in site management, MEP, billing reconciliation, AutoCAD, Primavera, and structural project execution.",
  },
];

export default function JobMatchView({
  resumeId,
  candidateName,
  candidateExperienceYears,
}: JobMatchViewProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() || isMatching) return;

    setIsMatching(true);
    setError(null);

    try {
      const res = await matchCandidateToJob(resumeId, jobDescription);
      setMatchResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matching evaluation failed");
    } finally {
      setIsMatching(false);
    }
  };

  const applySampleJd = (sampleText: string) => {
    setJobDescription(sampleText);
  };

  return (
    <div className="vintage-box p-8 sm:p-10 bg-[#FAF3E6] border-2 border-[#151515] space-y-8">
      {/* Section Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-[#8C241B]"
        style={{ marginBottom: "32px" }}
      >
        <div>
          <span className="stamp-badge mb-3 block w-max">MATCHING & EVALUATION ENGINE</span>
          <h2 className="font-headline text-2xl font-bold uppercase text-[#151515]">
            Job Description Matching & Intelligence
          </h2>
        </div>
        {matchResult && (
          <div
            className={`stamp-badge text-xs font-bold ${
              matchResult.match_percentage >= 70
                ? "text-[#3A6335] border-[#3A6335]"
                : matchResult.match_percentage >= 45
                ? "text-[#B8860B] border-[#B8860B]"
                : "text-[#8C241B] border-[#8C241B]"
            }`}
          >
            VERDICT: {matchResult.verdict.toUpperCase()} ({matchResult.match_percentage}% MATCH)
          </div>
        )}
      </div>

      {/* Input & Quick Sample Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="font-typewriter text-xs font-bold uppercase text-[#787167]">
            TARGET JOB DESCRIPTION:
          </label>
          <div className="flex flex-wrap gap-2">
            <span className="font-typewriter text-[10px] font-bold text-[#787167] self-center mr-1">
              QUICK SAMPLES:
            </span>
            {SAMPLE_JDS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applySampleJd(sample.text)}
                className="font-typewriter text-[11px] font-bold text-[#8C241B] hover:bg-[#EADCBF] px-2 py-0.5 border border-[#8C241B] transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleMatchSubmit} className="space-y-4">
          <textarea
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target Job Description here, or select a Quick Sample above to test matching engine..."
            className="input-vintage"
          />

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isMatching || !jobDescription.trim()}
              className="btn-vintage disabled:opacity-50"
            >
              {isMatching ? "[ EVALUATING CANDIDATE MATCH... ]" : "EXECUTE MATCHING ENGINE →"}
            </button>
          </div>
        </form>

        {error && (
          <p className="font-typewriter text-xs text-[#8C241B] font-bold">[ ERROR ]: {error}</p>
        )}
      </div>

      {/* Match Visualization & Breakdown */}
      {matchResult && (
        <div className="space-y-8 pt-4 border-t-2 border-dashed border-[#B8AC98]">
          {/* Parsed Role Criteria Summary */}
          {matchResult.parsed_jd && (
            <div className="classified-box p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[#B8AC98] pb-3">
                <div>
                  <span className="font-typewriter text-xs font-bold text-[#787167] uppercase block">
                    PARSED TARGET ROLE:
                  </span>
                  <h3 className="font-headline text-xl font-bold uppercase text-[#151515]">
                    {matchResult.parsed_jd.role_title || "Target Position"}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-typewriter text-xs font-bold">
                  <span className="stamp-badge text-[#8C241B] border-[#8C241B]">
                    {matchResult.parsed_jd.experience_level || "Mid-Level"} LEVEL
                  </span>
                  {matchResult.parsed_jd.experience_years_required ? (
                    <span className="tag-vintage bg-[#EADCBF]">
                      {matchResult.parsed_jd.experience_years_required} YRS REQUIRED
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Domain Knowledge Tags */}
              {matchResult.parsed_jd.domain_knowledge &&
                matchResult.parsed_jd.domain_knowledge.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-typewriter text-xs font-bold text-[#787167] mr-1">
                      TARGET DOMAIN:
                    </span>
                    {matchResult.parsed_jd.domain_knowledge.map((domain, idx) => (
                      <span key={idx} className="stamp-badge text-xs">
                        {domain}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Master Match Percentage Bar & Score Gauge */}
          <div className="classified-box p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Rubber Stamp Match Dial */}
              <div className="flex items-center gap-4">
                <div
                  className={`rubber-stamp-circle border-4 flex-shrink-0 ${
                    matchResult.match_percentage >= 70
                      ? "border-[#3A6335] text-[#3A6335]"
                      : matchResult.match_percentage >= 45
                      ? "border-[#B8860B] text-[#B8860B]"
                      : "border-[#8C241B] text-[#8C241B]"
                  }`}
                  style={{ width: 88, height: 88 }}
                >
                  <span className="font-extrabold text-2xl leading-none">
                    {matchResult.match_percentage}%
                  </span>
                  <span className="text-[9px] font-bold mt-1">MATCH</span>
                </div>

                <div>
                  <p className="font-typewriter text-xs font-bold uppercase text-[#787167]">
                    Overall Role Compatibility
                  </p>
                  <h3 className="font-headline text-2xl font-bold text-[#151515]">
                    {matchResult.verdict} Candidate Fit
                  </h3>
                  <p className="font-typewriter text-xs font-bold text-[#8C241B] mt-0.5">
                    QUALIFICATION SCORE: [ {matchResult.qualification_score} / 10 ]
                  </p>
                </div>
              </div>

              {/* Recommendation Box */}
              {matchResult.recommendation && (
                <div className="md:max-w-md bg-[#FAF3E6] border border-[#151515] p-3 text-xs font-body leading-relaxed">
                  <span className="font-typewriter font-bold text-[#8C241B] uppercase block mb-1">
                    💡 Hiring Recommendation:
                  </span>
                  <p className="italic text-[#151515]">{matchResult.recommendation}</p>
                </div>
              )}
            </div>

            {/* Visual Match Percentage Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-typewriter text-xs font-bold text-[#151515]">
                <span>MATCH PERCENTAGE PROGRESS</span>
                <span>{matchResult.match_percentage}%</span>
              </div>
              <div className="w-full h-4 bg-[#EADCBF] border border-[#151515] p-0.5">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${matchResult.match_percentage}%`,
                    background:
                      matchResult.match_percentage >= 70
                        ? "#3A6335"
                        : matchResult.match_percentage >= 45
                        ? "#B8860B"
                        : "#8C241B",
                  }}
                />
              </div>
            </div>

            {/* Experience Level & Years Comparison Bar */}
            {matchResult.experience_comparison && (
              <div className="pt-3 border-t border-dashed border-[#B8AC98] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="font-typewriter text-xs font-bold text-[#787167]">
                    EXPERIENCE EVALUATION:
                  </span>
                  <span className="font-body text-sm font-bold text-[#151515]">
                    {matchResult.experience_comparison.candidate_years} YRS CANDIDATE VS{" "}
                    {matchResult.experience_comparison.required_years} YRS REQUIRED
                  </span>
                </div>
                <span
                  className={`stamp-badge text-xs font-bold ${
                    matchResult.experience_comparison.meets_requirement
                      ? "text-[#3A6335] border-[#3A6335]"
                      : "text-[#8C241B] border-[#8C241B]"
                  }`}
                >
                  {matchResult.experience_comparison.meets_requirement
                    ? "✓ MEETS EXPERIENCE REQUIREMENT"
                    : "⚠ BELOW EXPERIENCE REQUIREMENT"}
                </span>
              </div>
            )}
          </div>

          {/* Side-by-Side Strengths & Skill Gap Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Required Skills & Strengths */}
            <div className="classified-box p-5 space-y-4">
              <div className="pb-3 border-b border-dashed border-[#B8AC98]">
                <h4 className="font-headline text-lg font-bold text-[#3A6335] flex items-center gap-1.5">
                  <span>✓ Matched Required Skills & Strengths</span>
                </h4>
              </div>

              {/* Matched Skill Tags */}
              <div>
                <span className="font-typewriter text-xs font-bold text-[#787167] uppercase block mb-2">
                  CONFIRMED SKILL OVERLAP:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.matched_skills && matchResult.matched_skills.length > 0 ? (
                    matchResult.matched_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="font-typewriter text-xs font-bold text-[#3A6335] bg-[#EADCBF] px-2.5 py-1 border border-[#3A6335]"
                      >
                        ✓ {skill}
                      </span>
                    ))
                  ) : (
                    <span className="font-body text-xs text-[#787167] italic">
                      No direct required skill overlap found.
                    </span>
                  )}
                </div>
              </div>

              {/* Key Strengths List */}
              <div className="pt-2">
                <span className="font-typewriter text-xs font-bold text-[#787167] uppercase block mb-2">
                  VERIFIED CANDIDATE STRENGTHS:
                </span>
                <ul className="space-y-2 font-body text-sm text-[#4A453E] leading-relaxed">
                  {matchResult.key_strengths && matchResult.key_strengths.length > 0 ? (
                    matchResult.key_strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-[#3A6335] font-bold mr-1">▪</span>
                        <span>{strength}</span>
                      </li>
                    ))
                  ) : (
                    <li className="font-body text-xs text-[#787167] italic">
                      No verified strengths listed.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Unmatched Required Skills & Gaps */}
            <div className="classified-box p-5 space-y-4">
              <div className="pb-3 border-b border-dashed border-[#B8AC98]">
                <h4 className="font-headline text-lg font-bold text-[#8C241B] flex items-center gap-1.5">
                  <span>⚠ Missing Requirements & Skill Gaps</span>
                </h4>
              </div>

              {/* Missing Required Skills Tags */}
              <div>
                <span className="font-typewriter text-xs font-bold text-[#787167] uppercase block mb-2">
                  UNMATCHED MANDATORY SKILLS:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.unmatched_required_skills &&
                  matchResult.unmatched_required_skills.length > 0 ? (
                    matchResult.unmatched_required_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="font-typewriter text-xs font-bold text-[#8C241B] bg-[#EADCBF] px-2.5 py-1 border border-[#8C241B]"
                      >
                        ✗ {skill}
                      </span>
                    ))
                  ) : (
                    <span className="font-body text-xs text-[#3A6335] font-bold">
                      ✓ All required skills matched!
                    </span>
                  )}
                </div>
              </div>

              {/* Skill Gaps List */}
              <div className="pt-2">
                <span className="font-typewriter text-xs font-bold text-[#787167] uppercase block mb-2">
                  CRITICAL DOMAIN & SKILL GAPS:
                </span>
                <ul className="space-y-2 font-body text-sm text-[#4A453E] leading-relaxed">
                  {matchResult.skill_gaps && matchResult.skill_gaps.length > 0 ? (
                    matchResult.skill_gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-[#8C241B] font-bold mr-1">▪</span>
                        <span>{gap}</span>
                      </li>
                    ))
                  ) : (
                    <li className="font-body text-xs text-[#787167] italic">
                      No critical skill gaps flagged.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Fit Summary Note */}
          <div className="classified-box p-5 space-y-2">
            <h4 className="font-typewriter text-xs font-bold uppercase text-[#787167]">
              Gazette Analyst Narrative Summary:
            </h4>
            <p className="font-body text-base text-[#151515] leading-relaxed">
              {matchResult.fit_summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
