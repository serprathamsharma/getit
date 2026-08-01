"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getEngineers, analyzeEngineer, getEngineerByUsername, type EngineerCard } from "@/lib/api";

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
      // Don't re-analyze if already exists
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
          padding: "20px 48px",
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
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            ◎
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700 }}>
            Talent<span className="gradient-text">Radar</span>
          </span>
        </button>

        {/* Quick Stats */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          <span>
            <strong style={{ color: "var(--text-primary)" }}>{total}</strong>{" "}
            engineers indexed
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: "32px 48px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Search & Controls */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "32px",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{ flex: 1, minWidth: "300px", display: "flex", gap: "10px" }}
          >
            <input
              type="text"
              className="input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, username, or archetype..."
              style={{ height: "48px" }}
            />
            <button type="submit" className="btn-primary" style={{ height: "48px" }}>
              Search
            </button>
          </form>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !searchInput.trim()}
            className="btn-ghost"
            style={{ height: "48px", whiteSpace: "nowrap" }}
          >
            {analyzing ? "Analyzing..." : "➕ Analyze New User"}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
            style={{ width: "200px", height: "48px", cursor: "pointer" }}
          >
            <option value="talent_score">Sort: Talent Score</option>
            <option value="profile_confidence">Sort: Confidence</option>
            <option value="updated_at">Sort: Recently Updated</option>
          </select>
        </div>

        {error && (
          <div
            style={{
              color: "var(--accent-danger)",
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
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
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: "240px", borderRadius: "var(--radius-lg)" }}
              />
            ))}
          </div>
        ) : engineers.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ fontSize: "20px", marginBottom: "8px", color: "var(--text-primary)" }}>
              No engineers found
            </h3>
            <p style={{ fontSize: "14px", marginBottom: "24px" }}>
              Analyze a GitHub user to get started. Enter a username above and
              click &quot;Analyze New User&quot;.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {engineers.map((eng, i) => (
                <Link href={`/profile/${eng.github_username}`} key={eng.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <EngineerCardComponent
                    engineer={eng}
                    index={i}
                  />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "40px",
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
                    padding: "10px 20px",
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
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
        animationDelay: `${index * 0.05}s`,
        opacity: 0,
      }}
    >
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
          src={engineer.avatar_url || `https://ui-avatars.com/api/?name=${engineer.github_username}&background=6366f1&color=fff`}
          alt={engineer.github_username}
          width={52}
          height={52}
          style={{
            borderRadius: "var(--radius-md)",
            border: "2px solid var(--border-subtle)",
          }}
        />
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "2px",
              lineHeight: 1.3,
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
        {/* Score */}
        <div style={{ textAlign: "right" }}>
          <div
            className="score-gradient"
            style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1 }}
          >
            {Math.round(score)}
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
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
        }}
      >
        {engineer.archetype && (
          <span className="tag">{engineer.archetype}</span>
        )}
        <span
          className={confidenceClass}
          style={{
            padding: "3px 10px",
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
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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

      {/* Stars */}
      {engineer.would_hire_score !== null && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Would Hire:
          </span>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={
                  s <= Math.round(engineer.would_hire_score || 0)
                    ? "star-filled"
                    : "star-empty"
                }
                style={{ fontSize: "14px" }}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
