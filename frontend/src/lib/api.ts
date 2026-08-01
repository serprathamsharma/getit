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
