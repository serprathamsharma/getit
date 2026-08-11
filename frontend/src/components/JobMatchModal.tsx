"use client";

import { useState } from "react";
import { matchJobDescription, JDMatchResponse } from "@/lib/api";
import { Target, CheckCircle, AlertTriangle, Lightbulb, Loader2, X, Sparkles } from "lucide-react";

interface JobMatchModalProps {
  engineerId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobMatchModal({
  engineerId,
  candidateName,
  isOpen,
  onClose,
}: JobMatchModalProps) {
  const [jobTitle, setJobTitle] = useState("Senior Full-Stack Engineer");
  const [jobDescription, setJobDescription] = useState(
    `We are seeking a Senior Engineer proficient in React, TypeScript, Python, FastAPI, and Docker. Experience with PostgreSQL, microservices architecture, automated testing, and CI/CD pipelines is required. The ideal candidate has 3+ years of experience building scalable web applications.`
  );
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JDMatchResponse | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setLoading(true);
    setError("");

    try {
      const result = await matchJobDescription(engineerId, jobDescription, jobTitle);
      setMatchResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 10, 10, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="card-classic"
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bg-card, #faf8f5)",
          border: "2px solid var(--border-dark, #1a1a1a)",
          boxShadow: "6px 6px 0px var(--border-dark, #1a1a1a)",
          padding: "28px",
          position: "relative",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "1px solid var(--border-dark)",
            cursor: "pointer",
            padding: "4px 8px",
            fontFamily: "'Courier Prime', monospace",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          [ ESC/CLOSE ]
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              fontFamily: "'Courier Prime', monospace",
              fontWeight: 700,
              color: "var(--stamp-red)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            <Target size={15} /> RECRUITER AI TOOLKIT • JOB MATCHING ENGINE
          </div>
          <h2 className="font-headline" style={{ fontSize: "24px", fontWeight: 900, margin: 0 }}>
            Match Candidate: {candidateName}
          </h2>
        </div>

        <div className="rule-double" style={{ margin: "16px 0" }} />

        {/* Input Form */}
        <form onSubmit={handleMatch}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontFamily: "'Courier Prime', monospace",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Target Job Title:
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "2px solid var(--border-dark)",
                fontFamily: "inherit",
                fontSize: "14px",
                background: "var(--bg-primary)",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontFamily: "'Courier Prime', monospace",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Paste Job Description (JD):
            </label>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste full Job Description requirements here..."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid var(--border-dark)",
                fontFamily: "inherit",
                fontSize: "13px",
                background: "var(--bg-primary)",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: "var(--border-dark)",
              color: "white",
              border: "none",
              fontFamily: "'Courier Prime', monospace",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> ANALYZING FIT REASONING...
              </>
            ) : (
              <>
                <Sparkles size={16} /> GENERATE MATCH REPORT
              </>
            )}
          </button>
        </form>

        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              background: "#fff0f0",
              border: "1px solid var(--stamp-red)",
              color: "var(--stamp-red)",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* Results View */}
        {matchResult && (
          <div style={{ marginTop: "28px" }}>
            <div className="rule-single" style={{ marginBottom: "20px" }} />

            {/* Score Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                border: "2px solid var(--border-dark)",
                background: "var(--accent-light, #fff9db)",
                boxShadow: "3px 3px 0px var(--border-dark)",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "'Courier Prime', monospace",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  OVERALL MATCH SCORE
                </div>
                <div
                  className="font-headline"
                  style={{ fontSize: "36px", fontWeight: 900, color: "var(--stamp-red)" }}
                >
                  {matchResult.match_percentage}%
                </div>
              </div>

              <div style={{ textAlign: "right", maxWidth: "340px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "'Courier Prime', monospace",
                    textTransform: "uppercase",
                    padding: "4px 8px",
                    background: "var(--border-dark)",
                    color: "white",
                  }}
                >
                  {matchResult.candidate_fit.split(":")[0]}
                </span>
                <p style={{ fontSize: "12px", marginTop: "6px", color: "var(--text-secondary)" }}>
                  {matchResult.candidate_fit.split(":")[1]}
                </p>
              </div>
            </div>

            {/* Skill Alignment Lists */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div
                style={{
                  padding: "14px",
                  border: "1px solid var(--border-dark)",
                  background: "rgba(43, 138, 62, 0.05)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "'Courier Prime', monospace",
                    color: "#2b8a3e",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  <CheckCircle size={15} /> MATCHING SKILLS ({matchResult.matching_skills.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {matchResult.matching_skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "#e6fcf5",
                        border: "1px solid #099268",
                        color: "#087f5b",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: "14px",
                  border: "1px solid var(--border-dark)",
                  background: "rgba(201, 42, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "'Courier Prime', monospace",
                    color: "var(--stamp-red)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  <AlertTriangle size={15} /> MISSING / GAP SKILLS ({matchResult.missing_skills.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {matchResult.missing_skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "#fff5f5",
                        border: "1px solid #f03e3e",
                        color: "#c92a2a",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Fit Reasoning & Improvement Suggestions */}
            <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  fontSize: "13px",
                  fontFamily: "'Courier Prime', monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                EXPLAINABLE MATCH REASONING:
              </h4>
              <ul
                style={{
                  fontSize: "13px",
                  lineHeight: "1.6",
                  paddingLeft: "20px",
                  margin: 0,
                }}
              >
                {Object.entries(matchResult.reasoning || {}).map(([key, val]) => (
                  <li key={key} style={{ marginBottom: "6px" }}>
                    <strong style={{ textTransform: "capitalize" }}>{key.replace("_", " ")}:</strong> {val}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4
                style={{
                  fontSize: "13px",
                  fontFamily: "'Courier Prime', monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Lightbulb size={15} style={{ color: "#f59f00" }} /> IMPROVEMENT SUGGESTIONS FOR INTERVIEW:
              </h4>
              <ul
                style={{
                  fontSize: "13px",
                  lineHeight: "1.6",
                  paddingLeft: "20px",
                  margin: 0,
                }}
              >
                {matchResult.improvement_suggestions.map((sugg, idx) => (
                  <li key={idx} style={{ marginBottom: "4px" }}>
                    {sugg}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
