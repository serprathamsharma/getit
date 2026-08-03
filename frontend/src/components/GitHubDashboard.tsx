"use client";

import { useState, useEffect, useRef } from "react";
import {
  getGitHubDashboard,
  type GitHubDashboardData,
  type RepoQualityMetrics,
  type CommitWeek,
} from "@/lib/api";

// ── Color palette for languages ──────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  PHP: "#4F5D95",
  Shell: "#89e051",
  CSS: "#563d7c",
  HTML: "#e34c26",
  "Jupyter Notebook": "#DA5B0B",
  Vue: "#41b883",
  Scala: "#c22d40",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Clojure: "#db5855",
};

function getLangColor(lang: string, idx: number): string {
  if (LANG_COLORS[lang]) return LANG_COLORS[lang];
  const fallbacks = [
    "#8B7355", "#A0856C", "#6B5B45", "#C4A882", "#7A6548",
    "#957B5C", "#B09070", "#796050",
  ];
  return fallbacks[idx % fallbacks.length];
}

// ── Language Donut Chart ─────────────────────────────────────────
function LanguageDonut({ distribution }: { distribution: Record<string, number> }) {
  const entries = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

  let cumulativePct = 0;
  const slices = entries.map(([lang, pct], i) => {
    const startPct = cumulativePct;
    cumulativePct += pct / total;
    return { lang, pct, startPct, endPct: cumulativePct, color: getLangColor(lang, i) };
  });

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const innerR = 48;

  function polarToXY(pct: number, radius: number) {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  function slicePath(startPct: number, endPct: number, outerR: number, innerRad: number) {
    if (endPct - startPct >= 1) endPct = 0.9999;
    const s1 = polarToXY(startPct, outerR);
    const e1 = polarToXY(endPct, outerR);
    const s2 = polarToXY(endPct, innerRad);
    const e2 = polarToXY(startPct, innerRad);
    const large = endPct - startPct > 0.5 ? 1 : 0;
    return `M ${s1.x} ${s1.y} A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${innerRad} ${innerRad} 0 ${large} 0 ${e2.x} ${e2.y} Z`;
  }

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", gap: "32px", alignItems: "center", flexWrap: "wrap" }}>
      <svg
        width={size}
        height={size}
        style={{ flexShrink: 0, filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.4))" }}
      >
        {slices.map((sl) => (
          <path
            key={sl.lang}
            d={slicePath(sl.startPct, sl.endPct, r, innerR)}
            fill={sl.color}
            stroke="var(--bg-primary)"
            strokeWidth={hovered === sl.lang ? 0 : 2}
            opacity={hovered && hovered !== sl.lang ? 0.5 : 1}
            style={{ cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered(sl.lang)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {/* Center label */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontFamily="'Courier Prime', monospace"
          fontSize="11"
          fontWeight="700"
          fill="var(--text-muted)"
        >
          {hovered || "TOTAL"}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontFamily="'Courier Prime', monospace"
          fontSize="14"
          fontWeight="700"
          fill="var(--text-primary)"
        >
          {hovered
            ? `${((distribution[hovered] / total) * 100).toFixed(1)}%`
            : `${entries.length} LANGS`}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {slices.map((sl) => (
          <div
            key={sl.lang}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              opacity: hovered && hovered !== sl.lang ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={() => setHovered(sl.lang)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                background: sl.color,
                border: "2px solid var(--border-dark)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {sl.lang}
            </span>
            <span
              style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginLeft: "auto",
                paddingLeft: "12px",
              }}
            >
              {((sl.pct / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Commit Heatmap ───────────────────────────────────────────────
function CommitHeatmap({ activity }: { activity: CommitWeek[] }) {
  const maxCount = Math.max(...activity.map((w) => w.commit_count), 1);

  function getHeatColor(count: number): string {
    if (count === 0) return "var(--bg-secondary)";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "#8B6914";
    if (intensity < 0.5) return "#A07820";
    if (intensity < 0.75) return "#C49030";
    return "#E8B84B";
  }

  // Group into columns of 7 weeks (approximate months)
  const columns: CommitWeek[][] = [];
  for (let i = 0; i < activity.length; i += 4) {
    columns.push(activity.slice(i, i + 4));
  }

  const [tooltip, setTooltip] = useState<{ week: string; count: number; x: number; y: number } | null>(null);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          gap: "3px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}
      >
        {activity.map((week, i) => (
          <div
            key={week.week_label}
            style={{
              width: "14px",
              height: "14px",
              background: getHeatColor(week.commit_count),
              border: "1px solid rgba(0,0,0,0.3)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setTooltip({ week: week.week_label, count: week.commit_count, x: i, y: 0 });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: `${tooltip.x * 17}px`,
            background: "var(--bg-card)",
            border: "2px solid var(--border-dark)",
            padding: "6px 10px",
            fontFamily: "'Courier Prime', monospace",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            zIndex: 10,
            boxShadow: "2px 2px 0 var(--border-dark)",
            pointerEvents: "none",
          }}
        >
          {tooltip.week}: {tooltip.count} commits
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "10px",
          fontFamily: "'Courier Prime', monospace",
          fontSize: "10px",
          color: "var(--text-muted)",
        }}
      >
        <span>LESS</span>
        {[0, 0.2, 0.5, 0.75, 1].map((intensity, i) => (
          <div
            key={i}
            style={{
              width: "12px",
              height: "12px",
              background: intensity === 0 ? "var(--bg-secondary)" : getHeatColor(intensity * maxCount),
              border: "1px solid rgba(0,0,0,0.3)",
            }}
          />
        ))}
        <span>MORE</span>
      </div>
    </div>
  );
}

// ── Repository Quality Matrix ────────────────────────────────────
function RepoQualityMatrix({ repos }: { repos: RepoQualityMetrics[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const displayed = repos.slice(0, 10);

  const complexityColor = { low: "var(--stamp-green)", medium: "var(--stamp-gold)", high: "var(--stamp-red)" };
  const complexityLabel = { low: "SIMPLE", medium: "MODERATE", high: "COMPLEX" };

  function QualityBadge({ active, label }: { active: boolean; label: string }) {
    return (
      <span
        style={{
          padding: "2px 7px",
          border: `1px solid ${active ? "var(--stamp-green)" : "var(--border-muted)"}`,
          color: active ? "var(--stamp-green)" : "var(--text-muted)",
          fontFamily: "'Courier Prime', monospace",
          fontSize: "10px",
          fontWeight: 700,
          background: active ? "rgba(80,150,80,0.08)" : "transparent",
        }}
      >
        {active ? "✓" : "✗"} {label}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {displayed.map((repo) => {
        const isExpanded = expanded === repo.repo_full_name;
        const repoName = repo.repo_full_name.split("/")[1] || repo.repo_full_name;
        const langEntries = Object.entries(repo.languages || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4);
        const totalLangBytes = langEntries.reduce((s, [, v]) => s + v, 0) || 1;

        return (
          <div
            key={repo.repo_full_name}
            style={{
              border: "2px solid var(--border-dark)",
              background: "var(--bg-primary)",
              boxShadow: "2px 2px 0 var(--border-dark)",
            }}
          >
            {/* Row header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "14px 16px",
                cursor: "pointer",
              }}
              onClick={() => setExpanded(isExpanded ? null : repo.repo_full_name)}
            >
              {/* Quality score circle */}
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  border: "3px solid var(--border-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: "var(--bg-secondary)",
                  boxShadow: "2px 2px 0 var(--border-dark)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "14px",
                    fontWeight: 900,
                    color: repo.quality_score >= 60 ? "var(--stamp-green)" : repo.quality_score >= 30 ? "var(--stamp-gold)" : "var(--stamp-red)",
                  }}
                >
                  {repo.quality_score}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Courier Prime', monospace",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--stamp-red)",
                    }}
                  >
                    {repoName}
                  </span>
                  {repo.is_fork && (
                    <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "10px", color: "var(--text-muted)" }}>
                      FORK
                    </span>
                  )}
                  {repo.language && (
                    <span
                      style={{
                        padding: "1px 7px",
                        border: "1px solid var(--border-dark)",
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: "10px",
                        background: "var(--bg-card)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {repo.language}
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: "'Courier Prime', monospace",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: complexityColor[repo.complexity],
                    }}
                  >
                    {complexityLabel[repo.complexity]}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <QualityBadge active={repo.has_tests} label="TESTS" />
                  <QualityBadge active={repo.has_ci} label="CI/CD" />
                  <QualityBadge active={repo.has_readme} label="README" />
                  <QualityBadge active={repo.has_docs} label="DOCS" />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                <span>★ {repo.stars}</span>
                <span>⚡ {repo.commit_count} commits</span>
                <span style={{ color: "var(--stamp-red)", fontSize: "14px" }}>
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div
                style={{
                  borderTop: "1px solid var(--border-dark)",
                  padding: "14px 16px",
                  background: "var(--bg-secondary)",
                }}
              >
                {repo.description && (
                  <p
                    style={{
                      fontFamily: "'Newsreader', serif",
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      marginBottom: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    {repo.description}
                  </p>
                )}

                {langEntries.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                      }}
                    >
                      LANGUAGE BREAKDOWN
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {langEntries.map(([lang, bytes], idx) => {
                        const pct = (bytes / totalLangBytes) * 100;
                        return (
                          <div key={lang}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontFamily: "'Courier Prime', monospace",
                                fontSize: "10px",
                                fontWeight: 700,
                                marginBottom: "2px",
                              }}
                            >
                              <span>{lang}</span>
                              <span>{pct.toFixed(1)}%</span>
                            </div>
                            <div
                              style={{
                                height: "6px",
                                background: "var(--border-muted)",
                                border: "1px solid var(--border-dark)",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${pct}%`,
                                  background: getLangColor(lang, idx),
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <a
                  href={repo.repo_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "12px",
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--stamp-red)",
                    textDecoration: "none",
                    borderBottom: "1px solid var(--stamp-red)",
                  }}
                >
                  VIEW ON GITHUB ↗
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Architecture Signals Panel ───────────────────────────────────
function ArchitecturePanel({ arch }: { arch: GitHubDashboardData["architecture"] }) {
  function Signal({
    active,
    label,
    detail,
    icon,
  }: {
    active: boolean;
    label: string;
    detail: string;
    icon: string;
  }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          padding: "14px",
          background: active ? "rgba(80,150,80,0.06)" : "var(--bg-primary)",
          border: `2px solid ${active ? "var(--stamp-green)" : "var(--border-dark)"}`,
          boxShadow: "2px 2px 0 var(--border-dark)",
        }}
      >
        <span style={{ fontSize: "22px", lineHeight: 1 }}>{icon}</span>
        <div>
          <div
            style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: "11px",
              fontWeight: 700,
              color: active ? "var(--stamp-green)" : "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: "2px",
            }}
          >
            {active ? "✓" : "✗"} {label}
          </div>
          <div
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.4,
            }}
          >
            {detail}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <Signal
        active={arch.has_ci_cd}
        label="CI/CD PIPELINES"
        detail={arch.has_ci_cd ? "Automated workflows detected (GitHub Actions, Travis, etc.)" : "No continuous integration detected"}
        icon="⚙️"
      />
      <Signal
        active={arch.has_containerization}
        label="CONTAINERIZATION"
        detail={arch.has_containerization ? "Docker/container configuration found" : "No container configuration detected"}
        icon="📦"
      />
      <Signal
        active={arch.has_documentation}
        label="DOCUMENTATION"
        detail={arch.has_documentation ? "Dedicated docs directories present" : "No structured documentation found"}
        icon="📄"
      />
      <Signal
        active={arch.test_coverage_ratio > 0.3}
        label="TEST SUITES"
        detail={`${(arch.test_coverage_ratio * 100).toFixed(0)}% of repositories have test directories`}
        icon="🧪"
      />

      {/* Numeric metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginTop: "4px",
        }}
      >
        {[
          { label: "AVG COMMITS / REPO", value: arch.avg_commits_per_repo.toFixed(1) },
          { label: "ORIGINAL REPO RATIO", value: `${(arch.original_repo_ratio * 100).toFixed(0)}%` },
          { label: "ACCOUNT AGE", value: `${arch.account_age_years}y` },
          { label: "TOTAL STARS", value: arch.total_stars.toString() },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "12px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-dark)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "22px",
                fontWeight: 900,
                color: "var(--text-primary)",
                lineHeight: 1,
                marginBottom: "4px",
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {arch.detected_frameworks.length > 0 && (
        <div
          style={{
            padding: "12px 14px",
            border: "1px solid var(--border-dark)",
            background: "var(--bg-secondary)",
          }}
        >
          <div
            style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-muted)",
              marginBottom: "8px",
            }}
          >
            DETECTED FRAMEWORKS & ECOSYSTEMS
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {arch.detected_frameworks.map((fw) => (
              <span
                key={fw}
                style={{
                  padding: "3px 9px",
                  border: "1px solid var(--border-dark)",
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                }}
              >
                {fw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function GitHubDashboard({ username }: { username: string }) {
  const [data, setData] = useState<GitHubDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const d = await getGitHubDashboard(username);
        setData(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load GitHub dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {[300, 200, 400].map((h, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: `${h}px`, border: "2px solid var(--border-dark)" }}
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          border: "2px dashed var(--border-dark)",
          fontFamily: "'Courier Prime', monospace",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠</div>
        <div style={{ fontWeight: 700, marginBottom: "6px" }}>GITHUB ANALYSIS UNAVAILABLE</div>
        <div style={{ fontSize: "12px" }}>{error}</div>
      </div>
    );
  }

  const totalCommits = data.commit_activity.reduce((s, w) => s + w.commit_count, 0);
  const peakWeek = data.commit_activity.reduce(
    (best, w) => (w.commit_count > best.commit_count ? w : best),
    { week_label: "-", commit_count: 0 }
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* Summary stat row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
        }}
      >
        {[
          { label: "REPOSITORIES", value: data.public_repos },
          { label: "FOLLOWERS", value: data.followers },
          { label: "SAMPLED COMMITS", value: data.architecture.total_commits_sampled },
          { label: "TOTAL STARS", value: data.architecture.total_stars },
          { label: "ACCOUNT AGE", value: `${data.account_age_years}y` },
          { label: "LANGUAGES", value: Object.keys(data.language_distribution).length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="vintage-box"
            style={{ padding: "16px", textAlign: "center" }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "28px",
                fontWeight: 900,
                color: "var(--text-primary)",
                lineHeight: 1,
                marginBottom: "6px",
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Language Distribution */}
      <div className="vintage-box" style={{ padding: "28px" }}>
        <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "20px" }}>
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            ◈ LANGUAGE DISTRIBUTION ANALYSIS
          </span>
        </div>
        {Object.keys(data.language_distribution).length > 0 ? (
          <LanguageDonut distribution={data.language_distribution} />
        ) : (
          <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: "12px", color: "var(--text-muted)" }}>
            No language data available.
          </p>
        )}
      </div>

      {/* Commit Activity Heatmap */}
      <div className="vintage-box" style={{ padding: "28px" }}>
        <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            ◈ COMMIT ACTIVITY HEATMAP — LAST 52 WEEKS
          </span>
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "10px", color: "var(--text-muted)" }}>
            PEAK: {peakWeek.week_label} ({peakWeek.commit_count} commits)
          </span>
        </div>
        <CommitHeatmap activity={data.commit_activity} />
        <div
          style={{
            marginTop: "14px",
            fontFamily: "'Courier Prime', monospace",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          {totalCommits} TOTAL SAMPLED COMMITS ACROSS {data.commit_activity.filter(w => w.commit_count > 0).length} ACTIVE WEEKS
        </div>
      </div>

      {/* 2-column: repo quality + architecture */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "28px", alignItems: "start" }}>

        {/* Repository Quality Matrix */}
        <div className="vintage-box" style={{ padding: "28px" }}>
          <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "20px" }}>
            <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              ◈ REPOSITORY QUALITY MATRIX ({data.repo_quality.length} REPOS)
            </span>
          </div>
          <RepoQualityMatrix repos={data.repo_quality} />
        </div>

        {/* Architecture Signals */}
        <div className="vintage-box" style={{ padding: "28px" }}>
          <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "20px" }}>
            <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              ◈ ARCHITECTURE SIGNALS
            </span>
          </div>
          <ArchitecturePanel arch={data.architecture} />
        </div>

      </div>

      {/* Footer stamp */}
      <div
        style={{
          padding: "12px 16px",
          border: "1px solid var(--border-dark)",
          fontFamily: "'Courier Prime', monospace",
          fontSize: "10px",
          color: "var(--text-muted)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>GITHUB ANALYSIS REPORT • @{data.github_username}</span>
        {data.last_analyzed_at && (
          <span>
            LAST ANALYZED:{" "}
            {new Date(data.last_analyzed_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
