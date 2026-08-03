"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getEngineer, type EngineerProfile } from "@/lib/api";
import GitHubDashboard from "@/components/GitHubDashboard";
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
  GitFork,
  FileText,
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
  const [activeTab, setActiveTab] = useState<"dossier" | "github">("dossier");

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
          padding: "40px",
        }}
      >
        <div className="rubber-stamp-circle" style={{ width: "90px", height: "90px" }}>
          MISSING
        </div>
        <h2 className="font-headline" style={{ fontSize: "32px", fontWeight: 800 }}>
          DOSSIER NOT FOUND IN GAZETTE ARCHIVE
        </h2>
        <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: "14px", color: "var(--text-secondary)" }}>{error}</p>
        <button className="btn-vintage" onClick={() => router.push("/")}>
          ← RETURN TO FRONT PAGE
        </button>
      </div>
    );
  }

  const score = profile.talent_score ?? 0;
  const confidence = profile.profile_confidence ?? 0;
  const breakdown = profile.score_breakdown;

  const confidenceLabel =
    confidence >= 0.8
      ? "High Confidence"
      : confidence >= 0.5
        ? "Medium Confidence"
        : "Low Confidence";

  const topLangs = profile.primary_languages
    ? Object.entries(profile.primary_languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header / Masthead Nav */}
      <header
        style={{
          padding: "16px 48px",
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => router.back()}
          className="btn-vintage-outline"
          style={{ fontSize: "12px", padding: "6px 14px" }}
        >
          ← RETURN
        </button>
        <div style={{ textAlign: "center" }}>
          <span className="font-headline" style={{ fontSize: "20px", fontWeight: 800, textTransform: "uppercase" }}>
            {profile.name || profile.github_username}
          </span>
          {profile.archetype && (
            <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "12px", color: "var(--stamp-red)", marginLeft: "10px", fontWeight: 700 }}>
              [{profile.archetype}]
            </span>
          )}
        </div>
        <a
          href={`https://github.com/${profile.github_username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-vintage"
          style={{ fontSize: "11px", textDecoration: "none", padding: "6px 14px" }}
        >
          VIEW GITHUB ↗
        </a>
      </header>

      <div className="rule-double" style={{ maxWidth: "1280px", margin: "0 auto 0" }} />

      {/* Tab Navigation */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 48px",
          display: "flex",
          gap: "0",
          borderBottom: "2px solid var(--border-dark)",
          marginBottom: "32px",
        }}
      >
        {([
          { id: "dossier", label: "◉ DOSSIER FILE" },
          { id: "github", label: "◈ GITHUB ANALYSIS" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 28px",
              fontFamily: "'Courier Prime', monospace",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid var(--stamp-red)" : "3px solid transparent",
              background: "transparent",
              color: activeTab === tab.id ? "var(--stamp-red)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
              marginBottom: "-2px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 48px 80px" }}>

        {/* Dossier Banner / Hero Box */}
        <div
          className="vintage-box"
          style={{
            marginBottom: "32px",
            background: "var(--bg-card)",
            padding: "36px",
            display: "flex",
            gap: "36px",
            alignItems: "flex-start",
            flexWrap: "wrap",
            boxShadow: "var(--shadow-offset)",
          }}
        >
          {/* Avatar & Profile Identity */}
          <div style={{ display: "flex", gap: "24px", flex: "1 1 400px", alignItems: "flex-start" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                profile.avatar_url ||
                `https://ui-avatars.com/api/?name=${profile.github_username}&background=8C241B&color=fff&size=120`
              }
              alt={profile.github_username}
              width={96}
              height={96}
              style={{
                border: "3px solid var(--border-dark)",
                boxShadow: "3px 3px 0px var(--border-dark)",
              }}
            />
            <div>
              <div className="stamp-badge" style={{ marginBottom: "8px" }}>
                OFFICIAL DOSSIER FILE
              </div>

              <h1
                className="font-headline"
                style={{
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  marginBottom: "4px",
                  lineHeight: 1.1,
                }}
              >
                {profile.name || profile.github_username}
              </h1>

              <p
                style={{
                  fontSize: "14px",
                  color: "var(--stamp-red)",
                  fontFamily: "'Courier Prime', monospace",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                @{profile.github_username}
              </p>

              {profile.bio && (
                <p
                  className="font-body"
                  style={{
                    fontSize: "16px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: "14px",
                    maxWidth: "540px",
                  }}
                >
                  {profile.bio}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "18px",
                  fontSize: "12px",
                  fontFamily: "'Courier Prime', monospace",
                  color: "var(--text-secondary)",
                  flexWrap: "wrap",
                }}
              >
                {profile.location && (
                  <span>📍 {profile.location}</span>
                )}
                {profile.company && (
                  <span>🏢 {profile.company}</span>
                )}
                <span>👥 {profile.followers} FOLLOWERS</span>
                <span>📦 {profile.public_repos} REPOSITORIES</span>
              </div>
            </div>
          </div>

          {/* Certificate Rating Box */}
          <div
            style={{
              textAlign: "center",
              flex: "0 0 220px",
              background: "var(--bg-secondary)",
              padding: "24px 20px",
              border: "2px solid var(--border-dark)",
              boxShadow: "var(--shadow-offset)",
            }}
          >
            <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "4px" }}>
              COMPOSITE SCORE
            </div>

            <div
              className="font-headline"
              style={{
                fontSize: "64px",
                fontWeight: 900,
                lineHeight: 1,
                marginBottom: "4px",
                color: "var(--text-primary)",
              }}
            >
              {Math.round(score)}
            </div>

            <div className="score-bar-vintage" style={{ marginBottom: "12px" }}>
              <div className="score-bar-vintage-fill" style={{ width: `${score}%` }} />
            </div>

            <span
              className="stamp-badge"
              style={{
                borderColor: "var(--border-dark)",
                color: "var(--text-primary)",
                background: "var(--bg-card)",
              }}
            >
              {confidenceLabel} ({(confidence * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Quality Signals / Warnings Banner */}
        {profile.gaming_warnings && profile.gaming_warnings.length > 0 && (
          <div
            className="classified-box"
            style={{
              marginBottom: "32px",
              background: "rgba(140, 36, 27, 0.05)",
              border: "2px dashed var(--stamp-red)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "'Courier Prime', monospace",
                color: "var(--stamp-red)",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              ⚠ QUALITY & FRAUD SIGNALS DETECTED
            </div>
            {profile.gaming_warnings.map((w, i) => (
              <div
                key={i}
                style={{
                  fontSize: "13px",
                  fontFamily: "'Courier Prime', monospace",
                  color: "var(--text-primary)",
                  paddingLeft: "16px",
                  marginBottom: "4px",
                }}
              >
                • {w}
              </div>
            ))}
          </div>
        )}

        {/* Tab content switcher */}
        {activeTab === "github" && (
          <GitHubDashboard username={profile.github_username} />
        )}

        {activeTab === "dossier" && (
        <>
        {/* Main 2-Column Newspaper Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "32px", alignItems: "start" }}>

          {/* Left Column: Dossier Report & Repos */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* AI Summary Report */}
            <div className="vintage-box" style={{ padding: "32px" }}>
              <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "16px" }}>
                <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stamp-red)" }}>
                  REPORT SUMMARY • INTELLIGENCE EVALUATION
                </span>
              </div>

              <h3 className="font-headline" style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>
                ANALYSIS OF ENGINEERING CAPABILITIES
              </h3>

              <p className="drop-cap font-body" style={{ fontSize: "18px", lineHeight: 1.7, textAlign: "justify" }}>
                {profile.ai_summary || "No AI summary report compiled for this engineer."}
              </p>
            </div>

            {/* Strengths & Growth Areas Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Strengths */}
              <div className="vintage-box" style={{ padding: "24px" }}>
                <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "14px" }}>
                  <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--stamp-green)" }}>
                    ✓ VERIFIED STRENGTHS
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(profile.strengths || []).map((s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.5,
                        fontFamily: "'Newsreader', serif",
                        paddingLeft: "18px",
                        position: "relative",
                      }}
                    >
                      <span style={{ position: "absolute", left: 0, color: "var(--stamp-green)", fontWeight: 700 }}>✓</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Areas */}
              <div className="vintage-box" style={{ padding: "24px" }}>
                <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "14px" }}>
                  <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--stamp-gold)" }}>
                    △ AREAS FOR GROWTH
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(profile.growth_areas || []).map((g, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.5,
                        fontFamily: "'Newsreader', serif",
                        paddingLeft: "18px",
                        position: "relative",
                      }}
                    >
                      <span style={{ position: "absolute", left: 0, color: "var(--stamp-gold)", fontWeight: 700 }}>△</span>
                      {g}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Repositories */}
            <div className="vintage-box" style={{ padding: "32px" }}>
              <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "20px" }}>
                <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  REPOSITORY MANIFEST ({profile.top_repos.length} ANALYZED)
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                      background: "var(--bg-primary)",
                      border: "2px solid var(--border-dark)",
                      textDecoration: "none",
                      color: "inherit",
                      boxShadow: "2px 2px 0px var(--border-dark)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          fontFamily: "'Courier Prime', monospace",
                          color: "var(--stamp-red)",
                          marginBottom: "4px",
                        }}
                      >
                        {repo.repo_full_name}
                        {repo.is_fork && (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px", fontWeight: 400 }}>
                            (fork)
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
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
                        gap: "12px",
                        fontSize: "12px",
                        fontFamily: "'Courier Prime', monospace",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {repo.language && <span className="tag-vintage">{repo.language}</span>}
                      <span>★ {repo.stars}</span>
                      <span>🍴 {repo.forks}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Score Breakdown & Official Hire Recommendation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* Score Breakdown Box */}
            {breakdown && (
              <div className="vintage-box" style={{ padding: "28px" }}>
                <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "18px" }}>
                  <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    SCORE BREAKDOWN MATRIX
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <ScoreRow label="TECHNICAL DEPTH" value={breakdown.technical_depth} weight="30%" />
                  <ScoreRow label="OUTPUT QUALITY" value={breakdown.output_quality} weight="25%" />
                  <ScoreRow label="CONSISTENCY" value={breakdown.consistency} weight="20%" />
                  <ScoreRow label="COLLABORATION" value={breakdown.collaboration} weight="15%" />
                  <ScoreRow label="SPECIALIZATION" value={breakdown.specialization} weight="10%" />
                </div>
              </div>
            )}

            {/* Official Hire Recommendation Coupon */}
            <div className="coupon-box" style={{ textAlign: "center", padding: "28px" }}>
              <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, textTransform: "uppercase", color: "var(--stamp-red)", marginBottom: "8px" }}>
                ★ OFFICIAL RECOMMENDATION ★
              </div>
              <div className="star-rating" style={{ justifyContent: "center", marginBottom: "14px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: "26px",
                      color: s <= Math.round(profile.would_hire_score || 0) ? "var(--stamp-gold)" : "var(--border-muted)",
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <h4 className="font-headline" style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>
                {(profile.would_hire_score || 0) >= 4
                  ? "STRONG HIRE RECOMMENDATION"
                  : (profile.would_hire_score || 0) >= 3
                    ? "HIRE RECOMMENDATION"
                    : (profile.would_hire_score || 0) >= 2
                      ? "LEAN HIRE RECOMMENDATION"
                      : "FURTHER DATA REQUIRED"}
              </h4>
            </div>

            {/* Languages Breakdown */}
            {topLangs.length > 0 && (
              <div className="vintage-box" style={{ padding: "28px" }}>
                <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "16px" }}>
                  <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    LANGUAGE RATIO DISTRIBUTION
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {topLangs.map(([lang, pct]) => (
                    <div key={lang}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                          fontFamily: "'Courier Prime', monospace",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        <span>{lang}</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="score-bar-vintage">
                        <div className="score-bar-vintage-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialization Tags */}
            <div className="vintage-box" style={{ padding: "28px" }}>
              <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "16px" }}>
                <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  DOMAINS & SPECIALIZATIONS
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                {(profile.expertise_areas || []).map((area, i) => (
                  <span key={i} className="tag-vintage">
                    {area}
                  </span>
                ))}
              </div>

              {profile.frameworks &&
                profile.frameworks.length > 0 &&
                profile.frameworks[0] !== "Not detected" && (
                  <>
                    <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, marginBottom: "8px" }}>
                      FRAMEWORKS DETECTED:
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {profile.frameworks.map((fw, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "2px 8px",
                            border: "1px solid var(--border-dark)",
                            fontSize: "11px",
                            fontFamily: "'Courier Prime', monospace",
                            background: "var(--bg-secondary)",
                          }}
                        >
                          {fw}
                        </span>
                      ))}
                    </div>
                  </>
                )}
            </div>

            {/* Stamp Meta File Box */}
            <div
              className="vintage-box"
              style={{
                padding: "16px 20px",
                fontSize: "11px",
                fontFamily: "'Courier Prime', monospace",
                color: "var(--text-muted)",
              }}
            >
              {profile.last_analyzed_at && (
                <div style={{ marginBottom: "4px" }}>
                  DATE ANALYZED:{" "}
                  {new Date(profile.last_analyzed_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
              <div>FILE ID: {profile.id}</div>
            </div>

          </div>
        </div>

        <div className="rule-double" style={{ marginTop: "60px" }} />
        </>
        )}
      </div>
    </div>
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
          fontFamily: "'Courier Prime', monospace",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        <span>{label}</span>
        <span>
          <span style={{ color: "var(--stamp-red)", fontWeight: 700 }}>{value.toFixed(1)}</span>
          <span style={{ color: "var(--text-muted)", marginLeft: "4px", fontSize: "10px" }}>
            ({weight})
          </span>
        </span>
      </div>
      <div className="score-bar-vintage">
        <div className="score-bar-vintage-fill" style={{ width: `${pct}%` }} />
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
      <div className="skeleton" style={{ height: "40px", width: "160px", marginBottom: "32px", border: "2px solid var(--border-dark)" }} />
      <div className="skeleton" style={{ height: "200px", marginBottom: "28px", border: "2px solid var(--border-dark)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "32px" }}>
        <div className="skeleton" style={{ height: "300px", border: "2px solid var(--border-dark)" }} />
        <div className="skeleton" style={{ height: "300px", border: "2px solid var(--border-dark)" }} />
      </div>
    </div>
  );
}
