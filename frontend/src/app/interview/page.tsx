"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  generateInterviewPlan,
  getInterviewPlan,
  InterviewPlanResponse,
  listResumes,
  ParsedResume,
  getEngineers,
  EngineerCard,
} from "@/lib/api";
import InterviewPlanView from "@/components/InterviewPlanView";
import {
  Sparkles,
  Search,
  UserCheck,
  FileText,
  HelpCircle,
  Loader2,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export default function InterviewPage() {
  const router = useRouter();
  const [usernameInput, setUsernameInput] = useState("");
  const [targetRole, setTargetRole] = useState("Senior Software Engineer");
  const [customTopicsInput, setCustomTopicsInput] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState("");

  const [activePlan, setActivePlan] = useState<InterviewPlanResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const [recentResumes, setRecentResumes] = useState<ParsedResume[]>([]);
  const [recentEngineers, setRecentEngineers] = useState<EngineerCard[]>([]);

  useEffect(() => {
    router.replace("/search");
  }, [router]);

  const handleGenerate = async (username?: string, resumeId?: string) => {
    const targetUser = username || usernameInput.trim();
    if (!targetUser && !resumeId) return;

    setIsGenerating(true);
    setError("");

    try {
      const topics = customTopicsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const plan = await generateInterviewPlan({
        github_username: targetUser || undefined,
        resume_id: resumeId || selectedResumeId || undefined,
        target_role: targetRole,
        custom_topics: topics,
      });

      setActivePlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate interview plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Main Newspaper Header */}
      <header
        style={{
          padding: "20px 48px 12px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          {/* Logo & Brand Link */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
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
                flexShrink: 0,
              }}
            >
              T
            </div>
            <div>
              <span className="font-headline" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                THE TALENT TIMES
              </span>
              <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                ENGINEER DIRECTORY & DOSSIER REGISTRY
              </div>
            </div>
          </Link>

          {/* Nav Links */}
          <nav
            style={{
              display: "flex",
              gap: "24px",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => router.push("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Courier Prime', monospace",
                fontSize: "18px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--text-primary)",
              }}
            >
              [ DASHBOARD ]
            </button>
            <button
              onClick={() => router.push("/search")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Courier Prime', monospace",
                fontSize: "18px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--text-primary)",
              }}
            >
              [ DIRECTORY ]
            </button>
            <button
              onClick={() => router.push("/resumes")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Courier Prime', monospace",
                fontSize: "18px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--text-primary)",
              }}
            >
              [ RESUME ]
            </button>
            <button
              onClick={() => router.push("/interview")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Courier Prime', monospace",
                fontSize: "18px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--stamp-red)",
                borderBottom: "2px solid var(--stamp-red)",
              }}
            >
              [ INTERVIEW ]
            </button>
          </nav>
        </div>

        {/* Double Rule Header Divider */}
        <div className="rule-double" />
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 24px 80px" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Generator Controls & Candidate Selection */}
          <div className="lg:col-span-4 space-y-6">
            {/* Interview Generator Form */}
            <div className="vintage-box p-6 bg-[#FAF3E6] border-2 border-[#151515]">
              <div className="pb-3 mb-4 border-b-2 border-[#151515] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8C241B]" />
                <h3 className="font-headline text-lg font-bold uppercase text-[#151515]">
                  Synthesize Questionnaire
                </h3>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 font-typewriter text-xs">
                <div>
                  <label className="block font-bold text-[#151515] mb-1">
                    GitHub Username or Candidate Name:
                  </label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. torvalds or johndoe"
                    className="w-full p-2.5 bg-[#FAF3E6] border border-[#151515] text-[#151515] focus:outline-none focus:border-[#8C241B]"
                  />
                </div>

                {recentResumes.length > 0 && (
                  <div>
                    <label className="block font-bold text-[#151515] mb-1">
                      Or Select Candidate Resume:
                    </label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => {
                        setSelectedResumeId(e.target.value);
                        const found = recentResumes.find((r) => r.id === e.target.value);
                        if (found) {
                          handleGenerate(found.github_username || found.candidate_name || "candidate", found.id);
                        }
                      }}
                      className="w-full p-2.5 bg-[#FAF3E6] border border-[#151515] text-[#151515]"
                    >
                      <option value="">-- Choose Archived Resume --</option>
                      {recentResumes.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.candidate_name || res.filename} ({res.file_format.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-[#151515] mb-1">Target Role:</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full p-2.5 bg-[#FAF3E6] border border-[#151515] text-[#151515]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#151515] mb-1">
                    Custom Focus Topics (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={customTopicsInput}
                    onChange={(e) => setCustomTopicsInput(e.target.value)}
                    placeholder="e.g. PostgreSQL, Distributed Locks, Concurrency"
                    className="w-full p-2.5 bg-[#FAF3E6] border border-[#151515] text-[#151515]"
                  />
                </div>

                {error && (
                  <p className="p-2 bg-[#8C241B]/10 border border-[#8C241B] text-[#8C241B] text-[11px]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 bg-[#8C241B] text-white border-2 border-[#151515] font-headline text-xs font-bold uppercase tracking-wider hover:bg-[#6D1B15] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Synthesizing Questionnaire...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Technical Questionnaire
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Candidate Directory Quick Select */}
            {recentEngineers.length > 0 && (
              <div className="vintage-box p-6 bg-[#FAF3E6] border-2 border-[#151515]">
                <h4 className="font-headline text-sm font-bold uppercase text-[#151515] pb-2 mb-3 border-b border-[#151515]">
                  Quick Pick Analyzed Engineers
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recentEngineers.map((eng) => (
                    <button
                      key={eng.id}
                      onClick={() => handleGenerate(eng.github_username)}
                      className="w-full text-left p-2.5 bg-[#FAF3E6] hover:bg-[#EADCBF] border border-[#151515]/40 hover:border-[#151515] flex items-center justify-between transition-all"
                    >
                      <div>
                        <p className="font-headline text-xs font-bold text-[#151515]">
                          {eng.name || eng.github_username}
                        </p>
                        <p className="font-typewriter text-[10px] text-[#787167]">
                          @{eng.github_username} • Score: {eng.talent_score ?? "N/A"}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8C241B]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Main Area: Interactive Interview Plan View */}
          <div className="lg:col-span-8">
            {isGenerating ? (
              <div className="vintage-box p-12 text-center bg-[#FAF3E6] border-2 border-[#151515] min-h-[420px] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-[#8C241B] animate-spin" />
                <h3 className="font-headline text-xl font-bold uppercase text-[#151515]">
                  Synthesizing Personalized Questionnaire...
                </h3>
                <p className="font-typewriter text-xs text-[#787167] max-w-sm">
                  Analyzing candidate repositories, framework trade-offs, code quality metrics, and resume project history to structure 5 category deep dives.
                </p>
              </div>
            ) : activePlan ? (
              <InterviewPlanView
                plan={activePlan}
                onUpdatePlan={(updated) => setActivePlan(updated)}
              />
            ) : (
              <div className="vintage-box p-12 text-center bg-[#FAF3E6] border-2 border-[#151515] min-h-[420px] flex flex-col items-center justify-center">
                <div className="rubber-stamp-circle border-[#8C241B] text-[#8C241B] mb-4" style={{ width: 84, height: 84 }}>
                  <span className="font-bold text-xs">INTERVIEW</span>
                  <span className="font-bold text-xs">GUIDE</span>
                </div>
                <h3 className="font-headline text-2xl font-bold uppercase text-[#151515] mb-2">
                  No Interview Plan Selected
                </h3>
                <p className="font-body text-sm text-[#4A453E] max-w-md leading-relaxed">
                  Enter a candidate GitHub handle or select an archived candidate resume on the left to synthesize a 5-category technical questionnaire.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
