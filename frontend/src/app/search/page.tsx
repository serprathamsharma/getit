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
  FileText,
  Bookmark,
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

    try {
      const existing = await getEngineerByUsername(term);
      if (existing && existing.github_username) {
        router.push(`/profile/${existing.github_username}`);
        return;
      }
    } catch {
      // Continue to search query
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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Top Utility Bar */}
      <div
        style={{
          borderBottom: "1px solid var(--border-dark)",
          padding: "6px 24px",
          fontSize: "11px",
          fontFamily: "'Courier Prime', monospace",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-secondary)",
          letterSpacing: "0.05em",
        }}
      >
        <span>CLASSIFIED DIRECTORY GAZETTE</span>
        <span style={{ fontWeight: 700 }}>THE TALENT TIMES</span>
        <span>PAGE B-12</span>
      </div>

      {/* Header / Masthead */}
      <header
        style={{
          padding: "20px 48px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                width: 38,
                height: 38,
                border: "2px solid var(--border-dark)",
                background: "var(--stamp-red)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontSize: "20px",
                fontWeight: 900,
                boxShadow: "2px 2px 0px var(--border-dark)",
              }}
            >
              T
            </div>
            <div>
              <span className="font-headline" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "0.02em" }}>
                THE TALENT TIMES
              </span>
              <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", color: "var(--text-secondary)" }}>
                ENGINEER DIRECTORY & DOSSIER REGISTRY
              </div>
            </div>
          </button>

          {/* Quick Stats Stamp */}
          <div className="stamp-badge">
            <Users size={14} />
            {total} ENGINEERS INDEXED
          </div>
        </div>

        <div className="rule-double" />
      </header>

      {/* Main Content Container */}
      <div style={{ padding: "0 48px 80px", maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Search & Filters Toolbar */}
        <div
          className="vintage-box"
          style={{
            marginBottom: "32px",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", textTransform: "uppercase", fontWeight: 700, color: "var(--stamp-red)", marginBottom: "10px" }}>
            SEARCH DIRECTORY REGISTRY & DOSSIERS
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <form onSubmit={handleSearch} style={{ flex: 1, minWidth: "300px", display: "flex", gap: "10px" }}>
              <input
                type="text"
                className="input-vintage"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, username, or archetype (e.g. torvalds)..."
                style={{ height: "46px" }}
              />
              <button type="submit" className="btn-vintage" style={{ height: "46px" }}>
                SEARCH
              </button>
            </form>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !searchInput.trim()}
              className="btn-vintage-outline"
              style={{ height: "46px", whiteSpace: "nowrap" }}
            >
              {analyzing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  + ANALYZE NEW USER
                </>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-vintage"
              style={{ width: "210px", height: "46px", cursor: "pointer" }}
            >
              <option value="talent_score">SORT: TALENT SCORE</option>
              <option value="profile_confidence">SORT: CONFIDENCE</option>
              <option value="updated_at">SORT: RECENTLY UPDATED</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: "var(--stamp-red)",
              padding: "12px 18px",
              background: "rgba(140, 36, 27, 0.08)",
              border: "2px solid var(--stamp-red)",
              fontFamily: "'Courier Prime', monospace",
              marginBottom: "24px",
              fontSize: "13px",
            }}
          >
            ⚠ ERROR: {error}
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
                style={{ height: "260px", border: "2px solid var(--border-dark)" }}
              />
            ))}
          </div>
        ) : engineers.length === 0 ? (
          <div
            className="vintage-box"
            style={{
              textAlign: "center",
              padding: "80px 20px",
            }}
          >
            <div className="rubber-stamp-circle" style={{ margin: "0 auto 16px", width: "90px", height: "90px" }}>
              NOT FOUND
            </div>
            <h3 className="font-headline" style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
              NO DOSSIERS MATCHING INQUIRY
            </h3>
            <p className="font-body" style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 24px" }}>
              No engineer dossiers were found. Enter a GitHub username in the search field above and click &quot;+ ANALYZE NEW USER&quot; to compile their data live.
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
                  <EngineerNewspaperCard engineer={eng} index={i} />
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
                  gap: "16px",
                  marginTop: "48px",
                  fontFamily: "'Courier Prime', monospace",
                }}
              >
                <button
                  className="btn-vintage-outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← PREVIOUS
                </button>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>
                  PAGE {page} OF {totalPages}
                </span>
                <button
                  className="btn-vintage-outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  NEXT →
                </button>
              </div>
            )}
          </>
        )}

        <div className="rule-double" style={{ marginTop: "60px" }} />
      </div>
    </div>
  );
}

function EngineerNewspaperCard({
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
      ? "confidence-high-vintage"
      : confidence >= 0.4
        ? "confidence-medium-vintage"
        : "confidence-low-vintage";

  return (
    <div className="vintage-card" style={{ padding: "24px" }}>
      {/* Header / Avatar & Score */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={engineer.avatar_url || `https://ui-avatars.com/api/?name=${engineer.github_username}&background=8C241B&color=fff`}
            alt={engineer.github_username}
            width={52}
            height={52}
            style={{
              border: "2px solid var(--border-dark)",
              boxShadow: "2px 2px 0px var(--border-dark)",
            }}
          />
          <div>
            <h3 className="font-headline" style={{ fontSize: "19px", fontWeight: 800, lineHeight: 1.2 }}>
              {engineer.name || engineer.github_username}
            </h3>
            <div style={{ fontSize: "12px", fontFamily: "'Courier Prime', monospace", color: "var(--stamp-red)", fontWeight: 700 }}>
              @{engineer.github_username}
            </div>
          </div>
        </div>

        {/* Vintage Score Box */}
        <div
          style={{
            border: "2px solid var(--border-dark)",
            background: "var(--bg-secondary)",
            padding: "4px 10px",
            textAlign: "center",
            boxShadow: "2px 2px 0px var(--border-dark)",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            {Math.round(score)}
          </div>
          <div style={{ fontSize: "9px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            SCORE
          </div>
        </div>
      </div>

      {/* Score Bar */}
      <div className="score-bar-vintage" style={{ marginBottom: "14px" }}>
        <div className="score-bar-vintage-fill" style={{ width: `${score}%` }} />
      </div>

      {/* Archetype & Confidence */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "6px" }}>
        {engineer.archetype ? (
          <span className="tag-vintage">
            ★ {engineer.archetype}
          </span>
        ) : (
          <span />
        )}

        <span
          className={confidenceClass}
          style={{
            padding: "2px 8px",
            fontSize: "10px",
            fontFamily: "'Courier Prime', monospace",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {(confidence * 100).toFixed(0)}% CONFIDENT
        </span>
      </div>

      {/* Languages */}
      {topLangs.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          {topLangs.map(([lang, pct]) => (
            <span
              key={lang}
              style={{
                fontSize: "11px",
                fontFamily: "'Courier Prime', monospace",
                border: "1px solid var(--border-dark)",
                padding: "2px 6px",
                background: "var(--bg-primary)",
              }}
            >
              {lang} {pct.toFixed(0)}%
            </span>
          ))}
        </div>
      )}

      {/* Recommendation Bottom Bar */}
      {engineer.would_hire_score !== null && (
        <div
          style={{
            paddingTop: "12px",
            borderTop: "1px dashed var(--border-dark)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: "var(--text-secondary)" }}>
            DOSSIER RATING:
          </span>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                style={{
                  fontSize: "14px",
                  color: s <= Math.round(engineer.would_hire_score || 0) ? "var(--stamp-gold)" : "var(--border-muted)",
                }}
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
