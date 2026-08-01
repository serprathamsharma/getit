"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getEngineer, type EngineerProfile } from "@/lib/api";
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FolderGit2,
  BarChart3,
  Award,
  Star,
  MapPin,
  Building2,
  Users,
  Code2,
  Check,
  Zap,
  Clock,
  ShieldAlert,
  Layers,
  ChevronRight,
  GitFork,
} from "lucide-react";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<EngineerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getEngineer(id);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (error || !profile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          background: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-danger)",
          }}
        >
          <AlertTriangle size={32} />
        </div>
        <h2 className="font-serif-claude" style={{ fontSize: "32px", color: "var(--text-primary)" }}>
          Profile Not Found
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>{error}</p>
        <button className="btn-primary" onClick={() => router.push("/")} style={{ gap: "8px" }}>
          <ArrowLeft size={16} />
          Back to Home
        </button>
      </div>
    );
  }

  const score = profile.talent_score ?? 0;
  const confidence = profile.profile_confidence ?? 0;
  const breakdown = profile.score_breakdown;

  const confidenceLabel =
    confidence >= 0.8
      ? "High"
      : confidence >= 0.5
        ? "Medium"
        : "Low";
  const confidenceClass =
    confidence >= 0.8
      ? "confidence-high"
      : confidence >= 0.5
        ? "confidence-medium"
        : "confidence-low";

  const topLangs = profile.primary_languages
    ? Object.entries(profile.primary_languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Top Header Navigation */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "16px 48px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => router.back()}
          className="btn-ghost"
          style={{ padding: "8px 16px", gap: "6px" }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            {profile.name || profile.github_username}
          </span>
          {profile.archetype && (
            <span style={{ color: "var(--text-muted)", marginLeft: "10px", fontSize: "13px" }}>
              • {profile.archetype}
            </span>
          )}
        </div>
        <a
          href={`https://github.com/${profile.github_username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
          style={{ padding: "8px 16px", fontSize: "13px", textDecoration: "none", gap: "6px" }}
        >
          View on GitHub <ExternalLink size={14} />
        </a>
      </header>

      <div
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "40px 48px",
        }}
      >
        {/* Profile Header Banner */}
        <div
          className="glass-card animate-slide-up"
          style={{
            padding: "36px 40px",
            marginBottom: "28px",
            display: "flex",
            gap: "40px",
            alignItems: "flex-start",
            flexWrap: "wrap",
            background: "var(--bg-card)",
          }}
        >
          {/* Avatar & Info */}
          <div style={{ display: "flex", gap: "24px", flex: "1 1 400px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                profile.avatar_url ||
                `https://ui-avatars.com/api/?name=${profile.github_username}&background=DA6747&color=fff&size=120`
              }
              alt={profile.github_username}
              width={96}
              height={96}
              style={{
                borderRadius: "var(--radius-lg)",
                border: "3px solid var(--border-subtle)",
                boxShadow: "var(--shadow-md)",
              }}
            />
            <div>
              <h1
                className="font-serif-claude"
                style={{
                  fontSize: "36px",
                  fontWeight: 400,
                  color: "var(--text-primary)",
                  marginBottom: "4px",
                  lineHeight: 1.1,
                }}
              >
                {profile.name || profile.github_username}
              </h1>
              <p
                style={{
                  fontSize: "15px",
                  color: "var(--text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: "12px",
                }}
              >
                @{profile.github_username}
              </p>
              {profile.bio && (
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: "14px",
                    maxWidth: "520px",
                  }}
                >
                  {profile.bio}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "18px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  flexWrap: "wrap",
                }}
              >
                {profile.location && (
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <MapPin size={14} color="var(--accent-primary)" /> {profile.location}
                  </span>
                )}
                {profile.company && (
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Building2 size={14} color="var(--accent-primary)" /> {profile.company}
                  </span>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Users size={14} color="var(--accent-primary)" /> {profile.followers} followers
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <FolderGit2 size={14} color="var(--accent-primary)" /> {profile.public_repos} repos
                </span>
              </div>
            </div>
          </div>

          {/* Talent Score Container */}
          <div
            style={{
              textAlign: "center",
              flex: "0 0 210px",
              background: "var(--bg-accent-soft)",
              padding: "24px 20px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(218, 103, 71, 0.2)",
            }}
          >
            <div
              className="font-serif-claude"
              style={{
                fontSize: "64px",
                fontWeight: 400,
                lineHeight: 1,
                marginBottom: "4px",
                color: "var(--accent-primary)",
              }}
            >
              {Math.round(score)}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Talent Score
            </div>
            <div className="score-bar" style={{ marginBottom: "14px" }}>
              <div className="score-bar-fill" style={{ width: `${score}%` }} />
            </div>
            <span
              className={confidenceClass}
              style={{
                padding: "5px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                display: "inline-block",
              }}
            >
              {confidenceLabel} Confidence ({(confidence * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Quality Signals / Warnings */}
        {profile.gaming_warnings && profile.gaming_warnings.length > 0 && (
          <div
            className="animate-fade-in stagger-1"
            style={{
              padding: "18px 24px",
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: "var(--radius-md)",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--accent-warning)",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShieldAlert size={16} /> Quality & Fraud Signals
            </div>
            {profile.gaming_warnings.map((w, i) => (
              <div
                key={i}
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  paddingLeft: "24px",
                  marginBottom: "4px",
                  lineHeight: 1.5,
                }}
              >
                • {w}
              </div>
            ))}
          </div>
        )}

        {/* Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 350px",
            gap: "28px",
          }}
        >
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* AI Summary */}
            <div className="glass-card animate-fade-in stagger-1" style={{ padding: "32px" }}>
              <SectionTitle icon={<Sparkles size={18} color="var(--accent-primary)" />} title="AI Profile Synthesis" />
              <p
                style={{
                  fontSize: "16px",
                  lineHeight: 1.8,
                  color: "var(--text-primary)",
                  fontWeight: 400,
                }}
              >
                {profile.ai_summary || "No AI summary available for this profile."}
              </p>
            </div>

            {/* Strengths & Growth Areas */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              <div className="glass-card animate-fade-in stagger-2" style={{ padding: "28px" }}>
                <SectionTitle icon={<CheckCircle2 size={18} color="var(--accent-success)" />} title="Verified Strengths" />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(profile.strengths || []).map((s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                        paddingLeft: "24px",
                        position: "relative",
                      }}
                    >
                      <span style={{ position: "absolute", left: 0, top: "2px" }}>
                        <Check size={16} color="var(--accent-success)" />
                      </span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card animate-fade-in stagger-3" style={{ padding: "28px" }}>
                <SectionTitle icon={<TrendingUp size={18} color="var(--accent-amber)" />} title="Growth Areas" />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(profile.growth_areas || []).map((g, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                        paddingLeft: "24px",
                        position: "relative",
                      }}
                    >
                      <span style={{ position: "absolute", left: 0, top: "2px", color: "var(--accent-amber)" }}>
                        △
                      </span>
                      {g}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Repositories */}
            <div className="glass-card animate-fade-in stagger-4" style={{ padding: "32px" }}>
              <SectionTitle
                icon={<FolderGit2 size={18} color="var(--accent-primary)" />}
                title={`Top Repositories (${profile.top_repos.length})`}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {profile.top_repos.slice(0, 8).map((repo, i) => (
                  <a
                    key={i}
                    href={repo.repo_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px 20px",
                      background: "var(--bg-primary)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-primary)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-subtle)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          marginBottom: "4px",
                          color: "var(--accent-primary)",
                        }}
                      >
                        {repo.repo_full_name}
                        {repo.is_fork && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                              marginLeft: "8px",
                              fontWeight: 400,
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                          >
                            (fork)
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            lineHeight: 1.5,
                          }}
                        >
                          {repo.description.length > 110
                            ? repo.description.slice(0, 110) + "..."
                            : repo.description}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {repo.language && <span className="tag">{repo.language}</span>}
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Star size={14} color="var(--accent-amber)" fill="var(--accent-amber)" /> {repo.stars}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <GitFork size={14} /> {repo.forks}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Score Breakdown */}
            {breakdown && (
              <div className="glass-card animate-fade-in stagger-2" style={{ padding: "28px" }}>
                <SectionTitle icon={<BarChart3 size={18} color="var(--accent-primary)" />} title="Score Breakdown" />
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <ScoreRow label="Technical Depth" value={breakdown.technical_depth} weight="30%" />
                  <ScoreRow label="Output Quality" value={breakdown.output_quality} weight="25%" />
                  <ScoreRow label="Consistency" value={breakdown.consistency} weight="20%" />
                  <ScoreRow label="Collaboration" value={breakdown.collaboration} weight="15%" />
                  <ScoreRow label="Specialization" value={breakdown.specialization} weight="10%" />
                </div>
              </div>
            )}

            {/* Would Hire Recommendation */}
            <div className="glass-card animate-fade-in stagger-3" style={{ padding: "28px", textAlign: "center" }}>
              <SectionTitle icon={<Award size={18} color="var(--accent-primary)" />} title="Hire Match Recommendation" />
              <div className="star-rating" style={{ justifyContent: "center", marginBottom: "14px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={28}
                    fill={s <= Math.round(profile.would_hire_score || 0) ? "var(--accent-amber)" : "none"}
                    color={s <= Math.round(profile.would_hire_score || 0) ? "var(--accent-amber)" : "var(--border-default)"}
                  />
                ))}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                {(profile.would_hire_score || 0) >= 4
                  ? "Strong Hire Recommendation"
                  : (profile.would_hire_score || 0) >= 3
                    ? "Hire Recommendation"
                    : (profile.would_hire_score || 0) >= 2
                      ? "Lean Hire"
                      : "Needs Further Assessment"}
              </div>
            </div>

            {/* Language Breakdown */}
            {topLangs.length > 0 && (
              <div className="glass-card animate-fade-in stagger-3" style={{ padding: "28px" }}>
                <SectionTitle icon={<Code2 size={18} color="var(--accent-primary)" />} title="Language Breakdown" />
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {topLangs.map(([lang, pct]) => (
                    <div key={lang}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{lang}</span>
                        <span style={{ color: "var(--text-muted)" }}>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="score-bar">
                        <div className="score-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expertise & Frameworks */}
            <div className="glass-card animate-fade-in stagger-4" style={{ padding: "28px" }}>
              <SectionTitle icon={<Zap size={18} color="var(--accent-primary)" />} title="Expertise & Tools" />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                {(profile.expertise_areas || []).map((area, i) => (
                  <span key={i} className="tag">
                    {area}
                  </span>
                ))}
              </div>

              {profile.frameworks &&
                profile.frameworks.length > 0 &&
                profile.frameworks[0] !== "Not detected" && (
                  <>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        marginBottom: "10px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Frameworks & Stack
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {profile.frameworks.map((fw, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            background: "var(--bg-tertiary)",
                            color: "var(--text-primary)",
                            fontWeight: 500,
                          }}
                        >
                          {fw}
                        </span>
                      ))}
                    </div>
                  </>
                )}
            </div>

            {/* Metadata Footer Card */}
            <div
              className="glass-card animate-fade-in stagger-5"
              style={{
                padding: "20px 24px",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              {profile.last_analyzed_at && (
                <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={13} />
                  Analyzed:{" "}
                  {new Date(profile.last_analyzed_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
              <div>ID: {profile.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3
      style={{
        fontSize: "14px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--text-primary)",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {icon} {title}
    </h3>
  );
}

function ScoreRow({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}) {
  const pct = (value / 10) * 100;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          fontSize: "13px",
        }}
      >
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
        <span>
          <span style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{value.toFixed(1)}</span>
          <span style={{ color: "var(--text-muted)", marginLeft: "6px", fontSize: "11px" }}>
            ({weight})
          </span>
        </span>
      </div>
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "40px 48px",
      }}
    >
      <div className="skeleton" style={{ height: "44px", width: "180px", marginBottom: "32px" }} />
      <div className="skeleton" style={{ height: "200px", marginBottom: "28px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "28px" }}>
        <div>
          <div className="skeleton" style={{ height: "160px", marginBottom: "28px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div className="skeleton" style={{ height: "220px" }} />
            <div className="skeleton" style={{ height: "220px" }} />
          </div>
        </div>
        <div>
          <div className="skeleton" style={{ height: "260px", marginBottom: "28px" }} />
          <div className="skeleton" style={{ height: "180px", marginBottom: "28px" }} />
        </div>
      </div>
    </div>
  );
}
