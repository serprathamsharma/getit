"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getEngineer, type EngineerProfile } from "@/lib/api";

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
        <div style={{ fontSize: "48px" }}>😵</div>
        <h2 style={{ fontSize: "20px" }}>Profile not found</h2>
        <p style={{ color: "var(--text-secondary)" }}>{error}</p>
        <button className="btn-primary" onClick={() => router.push("/")}>
          ← Back to Home
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
      {/* Header */}
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
          style={{ padding: "8px 16px" }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "15px", fontWeight: 600 }}>
            {profile.name || profile.github_username}
          </span>
          <span style={{ color: "var(--text-muted)", marginLeft: "8px", fontSize: "13px" }}>
            {profile.archetype}
          </span>
        </div>
        <a
          href={`https://github.com/${profile.github_username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
          style={{ padding: "8px 16px", fontSize: "13px", textDecoration: "none" }}
        >
          View on GitHub ↗
        </a>
      </header>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 48px",
        }}
      >
        {/* Profile Header */}
        <div
          className="glass-card animate-slide-up"
          style={{
            padding: "40px",
            marginBottom: "24px",
            display: "flex",
            gap: "40px",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* Avatar & Info */}
          <div style={{ display: "flex", gap: "24px", flex: "1 1 400px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                profile.avatar_url ||
                `https://ui-avatars.com/api/?name=${profile.github_username}&background=6366f1&color=fff&size=120`
              }
              alt={profile.github_username}
              width={96}
              height={96}
              style={{
                borderRadius: "var(--radius-lg)",
                border: "3px solid var(--border-subtle)",
              }}
            />
            <div>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: "4px",
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
                    marginBottom: "12px",
                    maxWidth: "400px",
                  }}
                >
                  {profile.bio}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  flexWrap: "wrap",
                }}
              >
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.company && <span>🏢 {profile.company}</span>}
                <span>👥 {profile.followers} followers</span>
                <span>📦 {profile.public_repos} repos</span>
              </div>
            </div>
          </div>

          {/* Talent Score */}
          <div
            style={{
              textAlign: "center",
              flex: "0 0 200px",
            }}
          >
            <div
              className="score-gradient"
              style={{
                fontSize: "64px",
                fontWeight: 900,
                lineHeight: 1,
                marginBottom: "8px",
              }}
            >
              {Math.round(score)}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "12px",
              }}
            >
              Talent Score
            </div>
            <div className="score-bar" style={{ marginBottom: "12px" }}>
              <div className="score-bar-fill" style={{ width: `${score}%` }} />
            </div>
            <span
              className={confidenceClass}
              style={{
                padding: "4px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {confidenceLabel} Confidence ({(confidence * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Gaming Warnings */}
        {profile.gaming_warnings && profile.gaming_warnings.length > 0 && (
          <div
            className="animate-fade-in stagger-1"
            style={{
              padding: "16px 24px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "var(--radius-md)",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--accent-warning)",
                marginBottom: "8px",
              }}
            >
              ⚠️ Quality Signals
            </div>
            {profile.gaming_warnings.map((w, i) => (
              <div
                key={i}
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  paddingLeft: "16px",
                  marginBottom: "4px",
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
            gridTemplateColumns: "1fr 340px",
            gap: "24px",
          }}
        >
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* AI Summary */}
            <div
              className="glass-card animate-fade-in stagger-1"
              style={{ padding: "32px" }}
            >
              <SectionTitle icon="🤖" title="AI Summary" />
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.8,
                  color: "var(--text-secondary)",
                }}
              >
                {profile.ai_summary || "No AI summary available."}
              </p>
            </div>

            {/* Strengths & Growth */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              <div
                className="glass-card animate-fade-in stagger-2"
                style={{ padding: "28px" }}
              >
                <SectionTitle icon="✅" title="Strengths" />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(profile.strengths || []).map((s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "13px",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                        paddingLeft: "16px",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "var(--accent-success)",
                        }}
                      >
                        ✓
                      </span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="glass-card animate-fade-in stagger-3"
                style={{ padding: "28px" }}
              >
                <SectionTitle icon="📈" title="Growth Areas" />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(profile.growth_areas || []).map((g, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "13px",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                        paddingLeft: "16px",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "var(--accent-warning)",
                        }}
                      >
                        △
                      </span>
                      {g}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Repos */}
            <div
              className="glass-card animate-fade-in stagger-4"
              style={{ padding: "32px" }}
            >
              <SectionTitle icon="📂" title={`Top Repositories (${profile.top_repos.length})`} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
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
                      padding: "16px",
                      background: "var(--bg-tertiary)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-accent)";
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
                          fontSize: "14px",
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                          marginBottom: "4px",
                        }}
                      >
                        {repo.repo_full_name}
                        {repo.is_fork && (
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--text-muted)",
                              marginLeft: "8px",
                              fontWeight: 400,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            (fork)
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            lineHeight: 1.5,
                          }}
                        >
                          {repo.description.length > 100
                            ? repo.description.slice(0, 100) + "..."
                            : repo.description}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {repo.language && <span className="tag">{repo.language}</span>}
                      <span>⭐ {repo.stars}</span>
                      <span>🍴 {repo.forks}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Score Breakdown */}
            {breakdown && (
              <div
                className="glass-card animate-fade-in stagger-2"
                style={{ padding: "28px" }}
              >
                <SectionTitle icon="📊" title="Score Breakdown" />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <ScoreRow
                    label="Technical Depth"
                    value={breakdown.technical_depth}
                    weight="30%"
                  />
                  <ScoreRow
                    label="Output Quality"
                    value={breakdown.output_quality}
                    weight="25%"
                  />
                  <ScoreRow
                    label="Consistency"
                    value={breakdown.consistency}
                    weight="20%"
                  />
                  <ScoreRow
                    label="Collaboration"
                    value={breakdown.collaboration}
                    weight="15%"
                  />
                  <ScoreRow
                    label="Specialization"
                    value={breakdown.specialization}
                    weight="10%"
                  />
                </div>
              </div>
            )}

            {/* Would Hire */}
            <div
              className="glass-card animate-fade-in stagger-3"
              style={{ padding: "28px", textAlign: "center" }}
            >
              <SectionTitle icon="🎯" title="Hire Recommendation" />
              <div className="star-rating" style={{ justifyContent: "center", marginBottom: "12px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={
                      s <= Math.round(profile.would_hire_score || 0)
                        ? "star-filled"
                        : "star-empty"
                    }
                    style={{ fontSize: "28px" }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {(profile.would_hire_score || 0) >= 4
                  ? "Strong Hire"
                  : (profile.would_hire_score || 0) >= 3
                    ? "Hire"
                    : (profile.would_hire_score || 0) >= 2
                      ? "Lean Hire"
                      : "More Data Needed"}
              </div>
            </div>

            {/* Languages */}
            {topLangs.length > 0 && (
              <div
                className="glass-card animate-fade-in stagger-3"
                style={{ padding: "28px" }}
              >
                <SectionTitle icon="💻" title="Languages" />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {topLangs.map(([lang, pct]) => (
                    <div key={lang}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{lang}</span>
                        <span style={{ color: "var(--text-muted)" }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="score-bar">
                        <div
                          className="score-bar-fill"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expertise & Frameworks */}
            <div
              className="glass-card animate-fade-in stagger-4"
              style={{ padding: "28px" }}
            >
              <SectionTitle icon="🧩" title="Expertise" />
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
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
                        fontWeight: 600,
                        marginBottom: "10px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Frameworks & Tools
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      {profile.frameworks.map((fw, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            background: "var(--bg-tertiary)",
                            color: "var(--text-secondary)",
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

            {/* Meta */}
            <div
              className="glass-card animate-fade-in stagger-5"
              style={{
                padding: "20px 28px",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              {profile.last_analyzed_at && (
                <div style={{ marginBottom: "4px" }}>
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
              <div>Profile ID: {profile.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h3
      style={{
        fontSize: "14px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-primary)",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span>{icon}</span> {title}
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
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span>
          <span className="score-gradient" style={{ fontWeight: 700 }}>
            {value.toFixed(1)}
          </span>
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
      <div
        className="skeleton"
        style={{ height: "48px", width: "200px", marginBottom: "32px" }}
      />
      <div
        className="skeleton"
        style={{ height: "200px", marginBottom: "24px" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        <div>
          <div className="skeleton" style={{ height: "160px", marginBottom: "24px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div className="skeleton" style={{ height: "200px" }} />
            <div className="skeleton" style={{ height: "200px" }} />
          </div>
        </div>
        <div>
          <div className="skeleton" style={{ height: "240px", marginBottom: "24px" }} />
          <div className="skeleton" style={{ height: "160px", marginBottom: "24px" }} />
          <div className="skeleton" style={{ height: "200px" }} />
        </div>
      </div>
    </div>
  );
}
