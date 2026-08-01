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
  Check,
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
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "var(--bg-primary)" }}>
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
          padding: "24px 64px",
          maxWidth: "1350px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 4px 12px rgba(218, 103, 71, 0.3)",
            }}
          >
            <Sparkles size={22} />
          </div>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Talent<span style={{ color: "var(--accent-primary)" }}>Radar</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn-ghost"
            onClick={() => router.push("/search")}
            style={{ gap: "8px" }}
          >
            <Compass size={16} />
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
          minHeight: "calc(100vh - 120px)",
          padding: "20px 24px",
          textAlign: "center",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        {/* Badge */}
        <div
          className="animate-fade-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            background: "var(--bg-accent-soft)",
            border: "1px solid rgba(218, 103, 71, 0.25)",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--accent-primary)",
            marginBottom: "28px",
            boxShadow: "0 2px 8px rgba(218, 103, 71, 0.08)",
          }}
        >
          <Sparkles size={14} />
          <span>Claude-Powered Talent Intelligence</span>
        </div>

        {/* Title */}
        <h1
          className="animate-slide-up font-serif-claude"
          style={{
            fontSize: "clamp(46px, 6vw, 76px)",
            fontWeight: 400,
            lineHeight: 1.05,
            color: "var(--text-primary)",
            marginBottom: "24px",
            letterSpacing: "-0.01em",
          }}
        >
          Discover <span style={{ color: "var(--accent-primary)", fontStyle: "italic" }}>exceptional</span> engineers through deep code analysis
        </h1>

        {/* Subtitle */}
        <p
          className="animate-slide-up stagger-1"
          style={{
            fontSize: "19px",
            color: "var(--text-secondary)",
            maxWidth: "640px",
            lineHeight: 1.65,
            marginBottom: "44px",
            fontWeight: 400,
          }}
        >
          Evidence-based GitHub profiles, multi-dimensional scoring, and actionable hiring synthesis tailored for engineering leaders.
        </p>

        {/* Search Form */}
        <form
          onSubmit={handleAnalyze}
          className="animate-slide-up stagger-2"
          style={{
            display: "flex",
            gap: "12px",
            width: "100%",
            maxWidth: "580px",
            marginBottom: "18px",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "20px",
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username (e.g. torvalds)..."
              disabled={analyzing}
              style={{
                paddingLeft: "50px",
                height: "58px",
                fontSize: "16px",
              }}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={analyzing || !username.trim()}
            style={{
              height: "58px",
              minWidth: "170px",
              fontSize: "15px",
              gap: "10px",
            }}
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze User
              </>
            )}
          </button>
        </form>

        {error && (
          <div
            style={{
              color: "var(--accent-danger)",
              fontSize: "14px",
              marginBottom: "16px",
              padding: "10px 18px",
              background: "#FEE2E2",
              borderRadius: "var(--radius-sm)",
              border: "1px solid #FCA5A5",
            }}
          >
            {error}
          </div>
        )}

        {/* Hints */}
        <div
          className="animate-fade-in stagger-3"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--text-muted)",
            marginBottom: "72px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span>Popular profiles:</span>
          <HintButton name="torvalds" onClick={setUsername} />
          <span>•</span>
          <HintButton name="gaearon" onClick={setUsername} />
          <span>•</span>
          <HintButton name="sindresorhus" onClick={setUsername} />
          <span>•</span>
          <HintButton name="tj" onClick={setUsername} />
        </div>

        {/* Stats Grid */}
        <div
          className="animate-slide-up stagger-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            width: "100%",
            maxWidth: "760px",
          }}
        >
          <StatCard icon={<Cpu size={24} color="var(--accent-primary)" />} value="50+" label="Analysis Signals" />
          <StatCard icon={<Layers size={24} color="var(--accent-primary)" />} value="4-Layer" label="Deep Pipeline" />
          <StatCard icon={<ShieldCheck size={24} color="var(--accent-primary)" />} value="Anti-Gaming" label="Fraud Detection" />
        </div>

        {/* Feature Cards */}
        <div
          className="animate-slide-up stagger-5"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
            gap: "24px",
            width: "100%",
            maxWidth: "960px",
            marginTop: "64px",
            paddingBottom: "90px",
          }}
        >
          <FeatureCard
            icon={<BarChart3 size={24} color="var(--accent-primary)" />}
            title="Multi-Dimensional Scoring"
            description="Evaluates technical depth, output quality, consistency, collaboration, and specialization with evidence-weighted composite scoring."
          />
          <FeatureCard
            icon={<Sparkles size={24} color="var(--accent-primary)" />}
            title="AI Profile Synthesis"
            description="Generates concrete, specific hiring intelligence and candidate summaries — highlighting genuine strengths and growth areas."
          />
          <FeatureCard
            icon={<Code2 size={24} color="var(--accent-primary)" />}
            title="Repository Intelligence"
            description="Analyzes commits, languages, test suites, CI/CD pipeline configs, documentation clarity, and architectural complexity."
          />
        </div>
      </main>
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
        color: "var(--accent-primary)",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "13px",
        fontWeight: 600,
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        textUnderlineOffset: "4px",
      }}
    >
      @{name}
    </button>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ marginBottom: "10px" }}>{icon}</div>
      <div
        style={{
          fontSize: "26px",
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: "4px",
          fontFamily: "'Instrument Serif', serif",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
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
  icon: React.ReactNode;
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
          background: "var(--bg-accent-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          border: "1px solid rgba(218, 103, 71, 0.15)",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "17px",
          fontWeight: 700,
          marginBottom: "10px",
          color: "var(--text-primary)",
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
