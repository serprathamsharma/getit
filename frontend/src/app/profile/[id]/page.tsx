"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getEngineer, parseResumeText, type EngineerProfile } from "@/lib/api";
import AdaptiveInterviewWorkspace from "@/components/AdaptiveInterviewWorkspace";
import JobMatchModal from "@/components/JobMatchModal";
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
  const [activeTab, setActiveTab] = useState<"overview" | "interview">("overview");
  const [isJobMatchOpen, setIsJobMatchOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedPdfText, setExtractedPdfText] = useState("");
  const [parsingResume, setParsingResume] = useState(false);

  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      alert("Invalid file format. Only PDF files (.pdf) are allowed.");
      return;
    }

    setPdfFile(file);
    setParsingResume(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = "";
      try {
        const decoder = new TextDecoder("utf-8");
        const raw = decoder.decode(arrayBuffer);
        extractedText = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ");
      } catch {
        extractedText = `PDF Resume Document: ${file.name}`;
      }

      if (!extractedText || extractedText.length < 25) {
        extractedText = `PDF Resume Document: ${file.name} - Technical Software Engineer Profile`;
      }

      setExtractedPdfText(extractedText);
    } catch {
      alert("Failed to read PDF file content.");
    } finally {
      setParsingResume(false);
    }
  };

  const handleAnalyzePdf = async () => {
    if (!extractedPdfText || !profile) return;
    setParsingResume(true);
    try {
      const updatedResumeData = await parseResumeText(extractedPdfText, profile.id);

      const resumeScore100 = updatedResumeData.resume_score * 10;
      const oldTalentScore = profile.talent_score || 80.0;
      const newTalentScore = Math.min(99.5, Math.max(40.0, Math.round((oldTalentScore * 0.7 + resumeScore100 * 0.3) * 10) / 10));
      const newHireScore = Math.min(5.0, Math.max(1.0, Math.round((newTalentScore / 20) * 10) / 10));

      const updatedProfile: EngineerProfile = {
        ...profile,
        talent_score: newTalentScore,
        would_hire_score: newHireScore,
        resume_data: updatedResumeData,
        score_breakdown: profile.score_breakdown ? {
          ...profile.score_breakdown,
          technical_depth: Math.min(10.0, Math.round(((profile.score_breakdown.technical_depth * 0.7) + (updatedResumeData.resume_score * 0.3)) * 10) / 10),
          specialization: Math.min(10.0, Math.round(((profile.score_breakdown.specialization * 0.7) + (updatedResumeData.resume_score * 0.3)) * 10) / 10),
        } : null,
      };

      setProfile(updatedProfile);
      alert(`Resume parsed successfully! Resume Score: ${updatedResumeData.resume_score}/10. Overall Talent Score updated to ${newTalentScore}/100.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to parse PDF resume");
    } finally {
      setParsingResume(false);
    }
  };

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
        <span>OFFICIAL DOSSIER FILE NO. #{profile.id.slice(0, 8).toUpperCase()}</span>
        <span style={{ fontWeight: 700 }}>THE TALENT TIMES • INTELLIGENCE REPORT</span>
        <span>CONFIDENTIAL</span>
      </div>

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

      <div className="rule-double" style={{ maxWidth: "1280px", margin: "0 auto 32px" }} />

      {/* Main Dossier Container */}
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

        {/* Primary Dossier Sub-Navigation Tabs */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px", borderBottom: "2px solid var(--border-dark)", paddingBottom: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`btn-vintage ${activeTab === "overview" ? "btn-vintage-primary" : ""}`}
            style={{ fontSize: "13px", padding: "10px 20px" }}
          >
            📊 OVERVIEW & SUMMARY
          </button>
          <button
            onClick={() => setActiveTab("interview")}
            className={`btn-vintage ${activeTab === "interview" ? "btn-vintage-primary" : ""}`}
            style={{ fontSize: "13px", padding: "10px 20px" }}
          >
            🎯 TECHNICAL INTERVIEW SUITE (15 QUESTIONS)
          </button>
        </div>

        {/* Tab 2: Technical Interview Suite (Dedicated Page View) */}
        {activeTab === "interview" && (
          <div style={{ marginBottom: "32px" }}>
            <AdaptiveInterviewWorkspace
              questionsData={profile.interview_questions || {
                easy: [
                  { id: "e1", question: `In your top repository, how did you structure the error handling flow across API calls?`, difficulty: "Easy", category: "Debugging", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["Centralized error handler", "HTTP status code mapping"], rationale: "Assesses error recovery knowledge." },
                  { id: "e2", question: `Walk me through the choice of primary framework and key libraries in your codebase. What were the drivers?`, difficulty: "Easy", category: "Engineering Decisions", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["Ecosystem & type safety benefits", "Prototyping speed"], rationale: "Verifies technical stack decision rationale." },
                  { id: "e3", question: `How did you organize file structures and module boundaries to keep code maintainable?`, difficulty: "Easy", category: "Architecture", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["Layered architecture", "Separation of concerns"], rationale: "Evaluates fundamental software organization." },
                  { id: "e4", question: `What testing tools or unit test patterns did you use to verify correctness?`, difficulty: "Easy", category: "Testing", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["Jest/pytest test runner", "Mocking API dependencies"], rationale: "Tests practical testing discipline." },
                  { id: "e5", question: `How do you handle environment configuration variables safely?`, difficulty: "Easy", category: "Security", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: [".env file usage", "Enforcing gitignore for secrets"], rationale: "Probes basic application security hygiene." }
                ],
                medium: [
                  { id: "m1", question: `If concurrent user traffic increased by 50x, where would bottlenecks occur and how would you refactor it?`, difficulty: "Medium", category: "Scalability", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["DB connection pooling", "Redis caching"], rationale: "Evaluates system bottleneck analysis." },
                  { id: "m2", question: `How do you handle state synchronization between core services and external dependencies?`, difficulty: "Medium", category: "Architecture", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["Idempotency keys", "Exponential backoff retries"], rationale: "Tests architectural consistency models." },
                  { id: "m3", question: `How would you design an automated CI/CD pipeline to build, test, and deploy safely?`, difficulty: "Medium", category: "Performance", repo_context: `Repository: ${profile.github_username}/secondary`, ideal_answer_points: ["GitHub Actions workflow", "Zero-downtime rolling deployment"], rationale: "Assesses DevOps integration capability." },
                  { id: "m4", question: `Describe a complex bug or race condition you encountered and your debugging methodology.`, difficulty: "Medium", category: "Debugging", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["Log stack trace analysis", "Isolated regression test creation"], rationale: "Verifies analytical problem solving." },
                  { id: "m5", question: `How would you optimize database queries or memory consumption when handling large datasets?`, difficulty: "Medium", category: "Engineering Decisions", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["Cursor pagination", "Eliminating N+1 queries"], rationale: "Examines database query optimization." }
                ],
                hard: [
                  { id: "h1", question: `Evaluate the trade-offs between synchronous API calls and an event-driven CQRS pattern.`, difficulty: "Hard", category: "Trade-offs", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["Eventual consistency vs ACID", "Operational complexity"], rationale: "Examines architectural trade-off reasoning." },
                  { id: "h2", question: `Suppose a zero-day vulnerability is found in a core package. Describe your mitigation strategy.`, difficulty: "Hard", category: "Security", repo_context: `Repository: ${profile.github_username}/secondary`, ideal_answer_points: ["Dependency auditing", "WAF / virtual patching"], rationale: "Probes security incident response under pressure." },
                  { id: "h3", question: `How would you re-architect your codebase for multi-region active-active database replication?`, difficulty: "Hard", category: "Scalability", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["GeoDNS & Edge CDN", "Multi-master DB conflict resolution"], rationale: "Tests staff-level system architecture vision." },
                  { id: "h4", question: `If your service experienced an unexpected 99.9th percentile tail latency spike of 4000ms, how would you profile it?`, difficulty: "Hard", category: "Performance", repo_context: `Repository: ${profile.github_username}/secondary`, ideal_answer_points: ["Distributed tracing (OpenTelemetry)", "CPU flamegraphs & DB lock profiling"], rationale: "Probes deep performance diagnostics." },
                  { id: "h5", question: `Describe your strategy for executing zero-downtime database schema migrations during peak traffic.`, difficulty: "Hard", category: "Architecture", repo_context: `Repository: ${profile.github_username}/core`, ideal_answer_points: ["Expand-contract migration pattern", "Dual-writing & async backfill"], rationale: "Evaluates zero-downtime database maintenance." }
                ]
              }}
              candidateName={profile.name || profile.github_username}
            />
          </div>
        )}

        {/* Tab 1: Overview & Summary Page */}
        {activeTab === "overview" && (
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

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {profile.top_repos.slice(0, 8).map((repo, i) => (
                  <a
                    key={i}
                    href={repo.repo_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      padding: "18px",
                      background: "var(--bg-primary)",
                      border: "2px solid var(--border-dark)",
                      textDecoration: "none",
                      color: "inherit",
                      boxShadow: "2px 2px 0px var(--border-dark)",
                    }}
                  >
                    {/* Header: Repo Name & Stats */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          fontFamily: "'Courier Prime', monospace",
                          color: "var(--stamp-red)",
                        }}
                      >
                        📁 {repo.repo_full_name}
                        {repo.is_fork && (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px", fontWeight: 400 }}>
                            (fork)
                          </span>
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
                    </div>

                    {/* README Summary (What the candidate is building) */}
                    {(repo.readme_summary || repo.description) && (
                      <div
                        style={{
                          background: "rgba(140, 36, 27, 0.04)",
                          borderLeft: "3px solid var(--stamp-red)",
                          padding: "10px 14px",
                          fontSize: "13px",
                          color: "var(--text-primary)",
                          lineHeight: 1.55,
                          fontFamily: "'Newsreader', serif",
                          fontStyle: "italic",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            fontStyle: "normal",
                            color: "var(--stamp-red)",
                            fontSize: "11px",
                            fontFamily: "'Courier Prime', monospace",
                            display: "block",
                            marginBottom: "4px",
                            letterSpacing: "0.05em",
                          }}
                        >
                          📜 README SUMMARY & PROJECT BUILD:
                        </span>
                        {repo.readme_summary || repo.description}
                      </div>
                    )}

                    {/* Tech Stack Badges */}
                    {repo.tech_stack && repo.tech_stack.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                        <span style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", color: "var(--text-secondary)", fontWeight: 800 }}>
                          TECH STACK:
                        </span>
                        {repo.tech_stack.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            style={{
                              fontSize: "11px",
                              fontFamily: "'Courier Prime', monospace",
                              fontWeight: 700,
                              padding: "2px 8px",
                              background: "var(--bg-secondary)",
                              border: "1px solid var(--border-dark)",
                              color: "var(--stamp-teal)",
                              boxShadow: "1px 1px 0px var(--border-dark)",
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
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
      )}

        <div className="rule-double" style={{ marginTop: "60px" }} />
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
