const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ScoreBreakdown {
  technical_depth: number;
  output_quality: number;
  consistency: number;
  collaboration: number;
  specialization: number;
}

export interface RepoSummary {
  repo_full_name: string;
  repo_url: string | null;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  is_fork: boolean;
  analysis_data: Record<string, unknown> | null;
}

export interface EngineerCard {
  id: string;
  github_username: string;
  name: string | null;
  avatar_url: string | null;
  location: string | null;
  talent_score: number | null;
  profile_confidence: number | null;
  archetype: string | null;
  primary_languages: Record<string, number> | null;
  expertise_areas: string[] | null;
  would_hire_score: number | null;
}

export interface EngineerProfile extends EngineerCard {
  github_id: number;
  bio: string | null;
  email: string | null;
  blog_url: string | null;
  company: string | null;
  followers: number;
  following: number;
  public_repos: number;
  ai_summary: string | null;
  strengths: string[] | null;
  growth_areas: string[] | null;
  frameworks: string[] | null;
  domains: string[] | null;
  gaming_warnings: string[] | null;
  score_breakdown: ScoreBreakdown | null;
  top_repos: RepoSummary[];
  created_at: string | null;
  last_analyzed_at: string | null;
}

export interface EngineerListResponse {
  engineers: EngineerCard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AnalysisResponse {
  status: string;
  message: string;
  engineer_id: string | null;
  profile: EngineerProfile | null;
}

export interface PlatformStats {
  total_engineers: number;
  avg_talent_score: number;
  avg_confidence: number;
}

// ── API Functions ───────────────────────────────────────────────

export async function analyzeEngineer(
  username: string
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/analyze/${username}`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Analysis failed (${res.status})`);
  }
  return res.json();
}

export async function getEngineers(params: {
  query?: string;
  languages?: string;
  archetype?: string;
  talent_score_min?: number;
  talent_score_max?: number;
  confidence_min?: number;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}): Promise<EngineerListResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const res = await fetch(`${API_BASE}/api/engineers?${searchParams}`);
  if (!res.ok) throw new Error(`Failed to fetch engineers (${res.status})`);
  return res.json();
}

export async function getEngineer(id: string): Promise<EngineerProfile> {
  const res = await fetch(`${API_BASE}/api/engineers/${id}`);
  if (!res.ok) throw new Error(`Engineer not found (${res.status})`);
  return res.json();
}

export async function getEngineerByUsername(username: string): Promise<EngineerProfile> {
  const res = await fetch(`${API_BASE}/api/engineers/by-username/${username}`);
  if (!res.ok) throw new Error(`Engineer not found`);
  return res.json();
}

export async function getStats(): Promise<PlatformStats> {
  const res = await fetch(`${API_BASE}/api/engineers/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats (${res.status})`);
  return res.json();
}

export async function getArchetypes(): Promise<
  { archetype: string; count: number }[]
> {
  const res = await fetch(`${API_BASE}/api/engineers/archetypes`);
  if (!res.ok) return [];
  return res.json();
}

// ── Resume Intelligence API ──────────────────────────────────────

export interface WorkExperience {
  company: string | null;
  role: string | null;
  duration: string | null;
  description: string | null;
  highlights: string[];
}

export interface EducationItem {
  institution: string | null;
  degree: string | null;
  year: string | null;
}

export interface ProjectItem {
  title: string | null;
  description: string | null;
  technologies: string[];
}

export interface JobFitEvaluation {
  match_percentage: number;
  qualification_score: number;
  verdict: string;
  fit_summary: string;
  key_strengths: string[];
  skill_gaps: string[];
  missing_prerequisites: string[];
  recommendation: string;
}

export interface ParsedResume {
  id: string;
  filename: string;
  file_format: string;
  raw_text?: string;
  candidate_name: string | null;
  github_username: string | null;
  email: string | null;
  phone: string | null;

  experience_years: number | null;
  skills: string[];
  work_history: WorkExperience[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: string[];
  job_fit_evaluation: JobFitEvaluation | null;
  created_at: string | null;
}

export async function uploadResume(file: File): Promise<ParsedResume> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/resumes/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed (${res.status})`);
  }

  return res.json();
}

export async function evaluateJobFit(
  resumeId: string,
  jobDescription: string
): Promise<ParsedResume> {
  const res = await fetch(`${API_BASE}/api/resumes/${resumeId}/evaluate-fit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_description: jobDescription }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Evaluation failed (${res.status})`);
  }

  return res.json();
}

export async function getResume(resumeId: string): Promise<ParsedResume> {
  const res = await fetch(`${API_BASE}/api/resumes/${resumeId}`);
  if (!res.ok) throw new Error(`Resume not found (${res.status})`);
  return res.json();
}

export async function listResumes(): Promise<ParsedResume[]> {
  const res = await fetch(`${API_BASE}/api/resumes`);
  if (!res.ok) return [];
  return res.json();
}

export function getResumeFileUrl(resumeId: string): string {
  return `${API_BASE}/api/resumes/${resumeId}/file`;
}

export function getResumeDownloadUrl(resumeId: string): string {
  return `${API_BASE}/api/resumes/${resumeId}/download`;
}

// ── Job Description Matching Engine Interfaces & API ─────────────

export interface ParsedJobDescription {
  role_title: string | null;
  required_skills: string[];
  nice_to_have_skills: string[];
  experience_years_required: number | null;
  experience_level: string | null;
  domain_knowledge: string[];
  key_responsibilities: string[];
  education_requirements: string | null;
}

export interface ExperienceComparison {
  candidate_years: number;
  required_years: number;
  meets_requirement: boolean;
}

export interface JobMatchResponse {
  resume_id: string;
  candidate_name: string | null;
  match_percentage: number;
  qualification_score: number;
  verdict: string;
  fit_summary: string;
  parsed_jd: ParsedJobDescription;
  matched_skills: string[];
  unmatched_required_skills: string[];
  key_strengths: string[];
  skill_gaps: string[];
  missing_prerequisites: string[];
  experience_comparison: ExperienceComparison;
  recommendation: string;
}

export async function parseJobDescription(jobDescription: string): Promise<ParsedJobDescription> {
  const res = await fetch(`${API_BASE}/api/jobs/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_description: jobDescription }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Parsing job description failed (${res.status})`);
  }

  return res.json();
}

export async function matchCandidateToJob(
  resumeId: string,
  jobDescription: string
): Promise<JobMatchResponse> {
  const res = await fetch(`${API_BASE}/api/jobs/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Job matching evaluation failed (${res.status})`);
  }

  return res.json();
}



