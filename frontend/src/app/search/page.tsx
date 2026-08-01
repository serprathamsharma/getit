"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getEngineers, analyzeEngineer, getEngineerByUsername, type EngineerCard } from "@/lib/api";
import {
  Search,
  Sparkles,
  ArrowLeft,
  Users,
  Award,
  Star,
  GitFork,
  ChevronRight,
  Loader2,
  PlusCircle,
  SlidersHorizontal,
  FolderGit2,
  CheckCircle2,
  Building2,
  MapPin,
} from "lucide-react";

export default function SearchPage() {
  const router = useRouter();
  const [engineers, setEngineers] = useState<EngineerCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("talent_score");

  const fetchEngineers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEngineers({
        query: query || undefined,
        sort_by: sortBy,
        sort_order: "desc",
        page,
        page_size: 12,
      });
      setEngineers(result.engineers);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch {
      setEngineers([]);
    } finally {
      setLoading(false);
    }
  }, [query, sortBy, page]);

  useEffect(() => {
    fetchEngineers();
  }, [fetchEngineers]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchInput.trim();
    if (!term) return;

    // Try exact match first
    try {
      const existing = await getEngineerByUsername(term);
      if (existing && existing.github_username) {
        router.push(`/profile/${existing.github_username}`);
        return;
      }
    } catch {
      // Not an exact username match, proceed with normal search
    }

    setQuery(term);
    setPage(1);
  };

  const handleAnalyze = async () => {
    const term = searchInput.trim();
    if (!term) return;
    
    setAnalyzing(true);
    setError("");
    
    try {
      try {
        const existing = await getEngineerByUsername(term);
        if (existing && existing.github_username) {
          router.push(`/profile/${existing.github_username}`);
          return;
        }
      } catch {
        // Continue to analyze
      }

      const result = await analyzeEngineer(term);
      if (result.profile?.github_username) {
        router.push(`/profile/${result.profile.github_username}`);
      } else if (result.engineer_id) {
        router.push(`/profile/${term}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "18px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-primary)",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Sparkles size={18} />
          </div>
          <span style={{ fontSize: "20px", fontWeight: 800 }}>
            Talent<span style={{ color: "var(--accent-primary)" }}>Radar</span>
          </span>
        </button>

        {/* Quick Stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--text-secondary)",
            background: "var(--bg-card)",
            padding: "6px 16px",
            borderRadius: "20px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Users size={15} color="var(--accent-primary)" />
          <span>
            <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{total}</strong> engineers indexed
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: "40px 48px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Search & Controls */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "32px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{ flex: 1, minWidth: "320px", display: "flex", gap: "10px" }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <span
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              >
                <Search size={18} />
              </span>
              <input
                type="text"
                className="input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, username, or archetype..."
                style={{ height: "50px", paddingLeft: "46px" }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ height: "50px" }}>
              Search
            </button>
          </form>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !searchInput.trim()}
            className="btn-ghost"
            style={{ height: "50px", gap: "8px" }}
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <PlusCircle size={16} color="var(--accent-primary)" />
                Analyze New User
              </>
            )}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SlidersHorizontal size={16} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
              style={{ width: "210px", height: "50px", cursor: "pointer" }}
            >
              <option value="talent_score">Sort: Talent Score</option>
              <option value="profile_confidence">Sort: Confidence</option>
              <option value="updated_at">Sort: Recently Updated</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: "var(--accent-danger)",
              padding: "14px 18px",
              background: "#FEE2E2",
              borderRadius: "var(--radius-sm)",
              border: "1px solid #FCA5A5",
              marginBottom: "24px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "24px",
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: "260px", borderRadius: "var(--radius-lg)" }}
              />
            ))}
          </div>
        ) : engineers.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "90px 20px",
              color: "var(--text-secondary)",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--bg-accent-soft)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
                marginBottom: "20px",
              }}
            >
              <Search size={30} />
            </div>
            <h3
              className="font-serif-claude"
              style={{ fontSize: "28px", marginBottom: "8px", color: "var(--text-primary)" }}
            >
              No engineers found
            </h3>
            <p style={{ fontSize: "15px", maxWidth: "460px", margin: "0 auto 24px" }}>
              Enter a GitHub username above and click &quot;Analyze New User&quot; to fetch and score their profile live.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "24px",
              }}
            >
              {engineers.map((eng, i) => (
                <Link href={`/profile/${eng.github_username}`} key={eng.id} style={{ textDecoration: "none", color: "inherit" }}>
                  <EngineerCardComponent engineer={eng} index={i} />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "48px",
                }}
              >
                <button
                  className="btn-ghost"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Previous
                </button>
                <span
                  style={{
                    padding: "8px 16px",
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn-ghost"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EngineerCardComponent({
  engineer,
  index,
}: {
  engineer: EngineerCard;
  index: number;
}) {
  const score = engineer.talent_score ?? 0;
  const confidence = engineer.profile_confidence ?? 0;
  const topLangs = engineer.primary_languages
    ? Object.entries(engineer.primary_languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
    : [];

  const confidenceClass =
    confidence >= 0.7
      ? "confidence-high"
      : confidence >= 0.4
        ? "confidence-medium"
        : "confidence-low";

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: "28px",
        cursor: "pointer",
        animationDelay: `${index * 0.04}s`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
      }}
    >
      <div>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={engineer.avatar_url || `https://ui-avatars.com/api/?name=${engineer.github_username}&background=DA6747&color=fff`}
            alt={engineer.github_username}
            width={54}
            height={54}
            style={{
              borderRadius: "var(--radius-md)",
              border: "2px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: "17px",
                fontWeight: 700,
                marginBottom: "2px",
                lineHeight: 1.3,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {engineer.name || engineer.github_username}
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              @{engineer.github_username}
            </p>
          </div>

          {/* Score Badge */}
          <div
            style={{
              textAlign: "center",
              background: "var(--bg-accent-soft)",
              padding: "8px 12px",
              borderRadius: "14px",
              border: "1px solid rgba(218, 103, 71, 0.2)",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                lineHeight: 1,
                color: "var(--accent-primary)",
                fontFamily: "'Instrument Serif', serif",
              }}
            >
              {Math.round(score)}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginTop: "2px",
                fontWeight: 600,
              }}
            >
              Score
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="score-bar" style={{ marginBottom: "16px" }}>
          <div className="score-bar-fill" style={{ width: `${score}%` }} />
        </div>

        {/* Archetype & Confidence */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {engineer.archetype ? (
            <span className="tag">
              <Award size={13} />
              {engineer.archetype}
            </span>
          ) : (
            <span />
          )}
          <span
            className={confidenceClass}
            style={{
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {(confidence * 100).toFixed(0)}% confident
          </span>
        </div>

        {/* Languages */}
        {topLangs.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
            {topLangs.map(([lang, pct]) => (
              <span
                key={lang}
                style={{
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 500,
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
              >
                {lang}{" "}
                <span style={{ color: "var(--text-muted)" }}>
                  {pct.toFixed(0)}%
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Star Recommendation */}
      {engineer.would_hire_score !== null && (
        <div
          style={{
            paddingTop: "14px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
            Hire Match:
          </span>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                fill={s <= Math.round(engineer.would_hire_score || 0) ? "var(--accent-amber)" : "none"}
                color={s <= Math.round(engineer.would_hire_score || 0) ? "var(--accent-amber)" : "var(--border-default)"}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
