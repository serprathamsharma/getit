"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeEngineer, getEngineerByUsername } from "@/lib/api";

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
      // Check if user is already analyzed
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
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Background Effects */}
      <div className="hero-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Navigation */}
      <nav
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            ◎
          </div>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Talent<span className="gradient-text">Radar</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn-ghost"
            onClick={() => router.push("/search")}
          >
            Browse Engineers
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 100px)",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <div
          className="animate-fade-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.15)",
            borderRadius: "30px",
            fontSize: "13px",
            color: "var(--text-accent)",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent-success)",
              display: "inline-block",
            }}
          />
          AI-Powered Talent Intelligence
        </div>

        {/* Title */}
        <h1
          className="animate-slide-up"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: "800px",
            marginBottom: "24px",
          }}
        >
          Discover{" "}
          <span className="gradient-text">exceptional</span>{" "}
          engineers through code
        </h1>

        {/* Subtitle */}
        <p
          className="animate-slide-up stagger-1"
          style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            maxWidth: "580px",
            lineHeight: 1.7,
            marginBottom: "48px",
          }}
        >
          Deep GitHub analysis powered by AI. Evidence-based profiles,
          multi-dimensional scoring, and actionable hiring intelligence.
        </p>

        {/* Search Form */}
        <form
          onSubmit={handleAnalyze}
          className="animate-slide-up stagger-2"
          style={{
            display: "flex",
            gap: "12px",
            width: "100%",
            maxWidth: "560px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: "18px",
              }}
            >
              @
            </span>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username..."
              disabled={analyzing}
              style={{
                paddingLeft: "40px",
                height: "56px",
                fontSize: "16px",
              }}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={analyzing || !username.trim()}
            style={{
              height: "56px",
              minWidth: "160px",
              fontSize: "15px",
            }}
          >
            {analyzing ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Analyzing...
              </>
            ) : (
              <>🔍 Analyze</>
            )}
          </button>
        </form>

        {error && (
          <div
            style={{
              color: "var(--accent-danger)",
              fontSize: "14px",
              marginBottom: "16px",
              padding: "8px 16px",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            {error}
          </div>
        )}

        {/* Hint */}
        <p
          className="animate-fade-in stagger-3"
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            marginBottom: "64px",
          }}
        >
          Try: <HintButton name="torvalds" onClick={setUsername} />,{" "}
          <HintButton name="gaearon" onClick={setUsername} />,{" "}
          <HintButton name="sindresorhus" onClick={setUsername} />,{" "}
          <HintButton name="tj" onClick={setUsername} />
        </p>

        {/* Stats Grid */}
        <div
          className="animate-slide-up stagger-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            width: "100%",
            maxWidth: "700px",
          }}
        >
          <StatCard icon="🧠" value="50+" label="Analysis Signals" />
          <StatCard icon="⚡" value="4-Layer" label="Deep Pipeline" />
          <StatCard icon="🛡️" value="Anti-Gaming" label="Fraud Detection" />
        </div>

        {/* Feature Cards */}
        <div
          className="animate-slide-up stagger-5"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            width: "100%",
            maxWidth: "900px",
            marginTop: "64px",
            paddingBottom: "80px",
          }}
        >
          <FeatureCard
            icon="📊"
            title="Multi-Dimensional Scoring"
            description="Technical depth, output quality, consistency, collaboration, and specialization — weighted composite scoring."
          />
          <FeatureCard
            icon="🤖"
            title="AI-Powered Insights"
            description="Three-stage LLM pipeline generates specific, evidence-based hiring intelligence — not generic summaries."
          />
          <FeatureCard
            icon="🔬"
            title="Code Intelligence"
            description="Analyzes repos, commits, PRs, languages, testing patterns, CI/CD configs, and architecture decisions."
          />
        </div>
      </main>

      {/* Spinner animation */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function HintButton({
  name,
  onClick,
}: {
  name: string;
  onClick: (v: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(name)}
      style={{
        background: "none",
        border: "none",
        color: "var(--text-accent)",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "13px",
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        textUnderlineOffset: "3px",
      }}
    >
      {name}
    </button>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div
        className="gradient-text"
        style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}
      >
        {value}
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "32px 28px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-md)",
          background: "rgba(99, 102, 241, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          marginBottom: "20px",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 600,
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  );
}
