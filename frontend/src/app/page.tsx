"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeEngineer, getEngineerByUsername } from "@/lib/api";
import {
  Search,
  Sparkles,
  Cpu,
  ShieldCheck,
  Code2,
  BarChart3,
  Layers,
  ArrowRight,
  UserCheck,
  Compass,
  Loader2,
  Newspaper,
  BookOpen,
  Award,
  TrendingUp,
  FileText,
  Bookmark,
  Send,
  Star,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = username.trim();
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
        // Not found, continue to analyze
      }

      const result = await analyzeEngineer(term);
      if (result.profile?.github_username) {
        router.push(`/profile/${result.profile.github_username}`);
      } else if (result.engineer_id) {
        router.push(`/profile/${term}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
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
        <span>EST. 2026 • VOLUME XCIX • NO. 365</span>
        <span style={{ fontWeight: 700 }}>THE DAILY TALENT GAZETTE</span>
        <span>PRICE: FIVE CENTS</span>
      </div>

      {/* Main Newspaper Masthead */}
      <header
        style={{
          padding: "28px 24px 16px",
          maxWidth: "1240px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Newspaper Title */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: "2px solid var(--border-dark)",
              background: "var(--stamp-red)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Playfair Display', serif",
              fontSize: "24px",
              fontWeight: 900,
              boxShadow: "2px 2px 0px var(--border-dark)",
            }}
          >
            T
          </div>
          <h1
            className="font-headline"
            style={{
              fontSize: "clamp(36px, 6vw, 68px)",
              fontWeight: 900,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              lineHeight: 0.95,
            }}
          >
            THE TALENT TIMES
          </h1>
        </div>

        {/* Edition Subhead */}
        <p
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: "12px",
            color: "var(--text-secondary)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginTop: "6px",
          }}
        >
          All The Code That&apos;s Fit To Score • Special Edition • Saturday, August 1, 2026
        </p>

        {/* Double Rule Header Divider */}
        <div className="rule-double" />

        {/* Newspaper Navigation Links */}
        <nav
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "32px",
            fontSize: "12px",
            fontFamily: "'Courier Prime', monospace",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            padding: "4px 0",
          }}
        >
          <a href="#" style={{ color: "var(--text-primary)", textDecoration: "none" }}>[ DASHBOARD ]</a>
          <button
            onClick={() => router.push("/search")}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)" }}
          >
            [ DIRECTORY ]
          </button>
          <button
            onClick={() => router.push("/resumes")}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)" }}
          >
            [ RESUME ]
          </button>

        </nav>

        {/* Double Rule Below Nav */}
        <div className="rule-double" />
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Hero Banner Section */}
        <section style={{ textAlign: "center", padding: "4px 0 36px" }}>
          {/* Star Ornament */}
          <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "6px" }}>
            — ★ —
          </div>

          <h2
            className="font-headline"
            style={{
              fontSize: "clamp(32px, 4.5vw, 54px)",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              marginBottom: "16px",
              lineHeight: 1.1,
            }}
          >
            DAILY OPERATIONS & CODE INTELLIGENCE REPORT
          </h2>

          <p
            className="font-body"
            style={{
              fontSize: "20px",
              fontStyle: "italic",
              color: "var(--text-secondary)",
              maxWidth: "760px",
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            Your comprehensive newspaper dashboard for discovering exceptional software engineers, tracking performance metrics, and managing technical intelligence dossiers.
          </p>

          {/* Search Box / Dispatch Form */}
          <div
            className="coupon-box"
            style={{
              maxWidth: "680px",
              margin: "0 auto 32px",
              boxShadow: "var(--shadow-offset)",
            }}
          >
            <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", textTransform: "uppercase", fontWeight: 700, color: "var(--stamp-red)", marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
              <span>TELEGRAM DISPATCH FORM</span>
              <span>CONFIDENTIAL</span>
            </div>

            <form onSubmit={handleAnalyze} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                className="input-vintage"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GitHub username (e.g. torvalds)..."
                disabled={analyzing}
                style={{ flex: 1, minWidth: "240px" }}
              />
              <button
                type="submit"
                className="btn-vintage"
                disabled={analyzing || !username.trim()}
                style={{ minWidth: "160px" }}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    DISPATCHING...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    SEARCH DOSSIER
                  </>
                )}
              </button>
            </form>

            {error && (
              <div style={{ color: "var(--stamp-red)", fontSize: "13px", fontFamily: "'Courier Prime', monospace", marginTop: "12px", textAlign: "left" }}>
                ⚠ ERROR: {error}
              </div>
            )}
          </div>

          {/* Quick Profile Shortcuts */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              fontSize: "12px",
              fontFamily: "'Courier Prime', monospace",
              color: "var(--text-muted)",
              flexWrap: "wrap",
            }}
          >
            <span>POPULAR DOSSIERS:</span>
            <HintBadge name="torvalds" onClick={setUsername} />
            <HintBadge name="gaearon" onClick={setUsername} />
            <HintBadge name="sindresorhus" onClick={setUsername} />
            <HintBadge name="tj" onClick={setUsername} />
          </div>

          {/* Star Ornament Divider */}
          <div style={{ fontSize: "16px", color: "var(--text-muted)", marginTop: "32px" }}>
            — ★ —
          </div>
        </section>

        {/* Section Rule */}
        <div className="rule-dashed" />

        {/* Performance Metrics Section (Matching Image Reference) */}
        <section style={{ marginBottom: "48px" }}>
          <h3
            className="font-headline"
            style={{
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "6px",
              textAlign: "center",
            }}
          >
            PERFORMANCE METRICS & INTELLIGENCE
          </h3>

          <div className="rule-single" />

          {/* Metrics Cards Grid (4 Boxes Matching Reference Image) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
              marginTop: "24px",
            }}
          >
            {/* Card 1 */}
            <div className="vintage-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                    TOTAL ENGINEERS
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "'Newsreader', serif", marginTop: "4px" }}>
                    5,240
                  </div>
                </div>
                <div className="postage-stamp-icon">
                  <BarChart3 size={18} />
                </div>
              </div>
              <div className="stamp-badge">
                ↑ 12.5% INCREASE
              </div>
            </div>

            {/* Card 2 */}
            <div className="vintage-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                    AVG TALENT SCORE
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "'Newsreader', serif", marginTop: "4px" }}>
                    68.4 <span style={{ fontSize: "18px", color: "var(--text-muted)" }}>/100</span>
                  </div>
                </div>
                <div className="postage-stamp-icon" style={{ background: "var(--stamp-brown)" }}>
                  <Award size={18} />
                </div>
              </div>
              <div className="stamp-badge" style={{ color: "var(--stamp-brown)", borderColor: "var(--stamp-brown)", background: "rgba(140, 90, 27, 0.05)" }}>
                ↑ 8.3% GROWTH
              </div>
            </div>

            {/* Card 3 */}
            <div className="vintage-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                    CONFIDENCE RATING
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "'Newsreader', serif", marginTop: "4px" }}>
                    4.8 <span style={{ fontSize: "18px", color: "var(--text-muted)" }}>/5.0</span>
                  </div>
                </div>
                <div className="postage-stamp-icon" style={{ background: "var(--stamp-gold)" }}>
                  <Star size={18} />
                </div>
              </div>
              <div className="stamp-badge" style={{ color: "var(--stamp-gold)", borderColor: "var(--stamp-gold)", background: "rgba(217, 119, 6, 0.05)" }}>
                ↑ 0.3 IMPROVED
              </div>
            </div>

            {/* Card 4 */}
            <div className="vintage-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                    REPOSITORIES INDEXED
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "'Newsreader', serif", marginTop: "4px" }}>
                    1,420
                  </div>
                </div>
                <div className="postage-stamp-icon" style={{ background: "var(--stamp-teal)" }}>
                  <Code2 size={18} />
                </div>
              </div>
              <div className="stamp-badge" style={{ color: "var(--stamp-teal)", borderColor: "var(--stamp-teal)", background: "rgba(27, 94, 85, 0.05)" }}>
                ↓ 2.1% STABLE
              </div>
            </div>
          </div>
        </section>

        {/* Main 3-Column Newspaper Article Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", alignItems: "start" }}>

          {/* Column 1: Feature Article */}
          <div>
            <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "16px" }}>
              <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stamp-red)" }}>
                FEATURE ARTICLE • FRONT PAGE
              </span>
            </div>

            <h4 className="font-headline" style={{ fontSize: "24px", fontWeight: 800, lineHeight: 1.25, marginBottom: "12px" }}>
              HOW MULTI-DIMENSIONAL CODE ANALYSIS REVOLUTIONIZES HIRING
            </h4>

            <p style={{ fontSize: "12px", fontFamily: "'Courier Prime', monospace", color: "var(--text-muted)", marginBottom: "16px" }}>
              BY CHIEF ANALYST • GAZETTE PRESS DISPATCH
            </p>

            <p className="drop-cap font-body" style={{ fontSize: "16px", lineHeight: 1.7, marginBottom: "16px", textAlign: "justify" }}>
              Traditional resume screening often fails to reveal an engineer&apos;s true technical craftsmanship. By evaluating over fifty signals directly from GitHub repositories, TalentRadar creates an authentic, evidence-based portrait of engineering depth, consistency, and collaboration.
            </p>

            <div style={{ borderLeft: "3px solid var(--stamp-red)", paddingLeft: "16px", margin: "20px 0", fontStyle: "italic", fontSize: "17px", color: "var(--text-primary)", lineHeight: 1.5 }}>
              &ldquo;Code never lies. True engineering craftsmanship is measured in commit history, testing rigor, and system architecture.&rdquo;
            </div>

            <p className="font-body" style={{ fontSize: "16px", lineHeight: 1.7, textAlign: "justify" }}>
              Each dossier combines automated metric calculation with high-precision synthesis to deliver objective hiring intelligence for technology leaders across the globe.
            </p>

            <div style={{ marginTop: "20px", textAlign: "right", fontFamily: "'Courier Prime', monospace", fontSize: "11px", color: "var(--stamp-red)", fontWeight: 700 }}>
              — Continued on Page 3 —
            </div>
          </div>

          {/* Column 2: Technical Methodology */}
          <div>
            <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", marginBottom: "16px" }}>
              <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                PIPELINE ARCHITECTURE
              </span>
            </div>

            <h4 className="font-headline" style={{ fontSize: "24px", fontWeight: 800, lineHeight: 1.25, marginBottom: "12px" }}>
              THE FOUR-STAGE INTEL EVALUATION MODEL
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <div className="vintage-box" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontFamily: "'Courier Prime', monospace", fontSize: "13px", color: "var(--stamp-red)", marginBottom: "4px" }}>
                  <Layers size={15} /> STAGE I: RAW EXTRACTION
                </div>
                <p style={{ fontSize: "14px", lineHeight: 1.5 }}>
                  Harvests commits, pull requests, issue participation, testing files, and CI/CD workflow configurations from GitHub repositories.
                </p>
              </div>

              <div className="vintage-box" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontFamily: "'Courier Prime', monospace", fontSize: "13px", color: "var(--stamp-brown)", marginBottom: "4px" }}>
                  <Cpu size={15} /> STAGE II: METRIC COMPUTE
                </div>
                <p style={{ fontSize: "14px", lineHeight: 1.5 }}>
                  Calculates language distribution ratios, original vs. fork work, star-to-fork consistency, and code complexity scores.
                </p>
              </div>

              <div className="vintage-box" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontFamily: "'Courier Prime', monospace", fontSize: "13px", color: "var(--stamp-teal)", marginBottom: "4px" }}>
                  <ShieldCheck size={15} /> STAGE III: FRAUD DETECTION
                </div>
                <p style={{ fontSize: "14px", lineHeight: 1.5 }}>
                  Detects commit spam, artificial star farming, fork-heavy deception, and suspicious commit size anomalies.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Rule */}
        <div className="rule-double" style={{ marginTop: "48px" }} />

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            fontFamily: "'Courier Prime', monospace",
            fontSize: "12px",
            color: "var(--text-secondary)",
            paddingTop: "16px",
          }}
        >
          <p>© 2026 THE TALENT GAZETTE • PRINTED ON VINTAGE PARCHMENT • ALL RIGHTS RESERVED</p>
        </footer>
      </main>
    </div>
  );
}

function HintBadge({ name, onClick }: { name: string; onClick: (v: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(name)}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-dark)",
        padding: "2px 8px",
        fontFamily: "'Courier Prime', monospace",
        fontSize: "11px",
        fontWeight: 700,
        color: "var(--stamp-red)",
        cursor: "pointer",
        boxShadow: "1px 1px 0px var(--border-dark)",
      }}
    >
      @{name}
    </button>
  );
}
