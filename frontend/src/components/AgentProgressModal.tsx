"use client";

import { useEffect, useState } from "react";
import { Bot, CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";

export interface AgentStep {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AGENT_STEPS: AgentStep[] = [
  { id: "resume", name: "Resume Agent", description: "Parsing candidate background & skill matrix", icon: "📄" },
  { id: "github", name: "GitHub Agent", description: "Analyzing repositories, commit velocity & code churn", icon: "🐙" },
  { id: "authenticity", name: "Authenticity Agent", description: "Evaluating engineering evidence & timeline evolution", icon: "🔍" },
  { id: "skills", name: "Engineering Skills Agent", description: "Scoring 10 technical domains with evidence", icon: "⚙️" },
  { id: "interview", name: "Interview Agent", description: "Generating repository-anchored interview questions", icon: "💬" },
  { id: "hiring", name: "Hiring Agent", description: "Synthesizing verdict, maturity & risk report", icon: "🏆" },
];

interface AgentProgressModalProps {
  username: string;
  isOpen: boolean;
}

export default function AgentProgressModal({ username, isOpen }: AgentProgressModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < AGENT_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

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
          maxWidth: "540px",
          background: "var(--bg-card, #faf8f5)",
          border: "2px solid var(--border-dark, #1a1a1a)",
          boxShadow: "6px 6px 0px var(--border-dark, #1a1a1a)",
          padding: "28px",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              border: "1px solid var(--border-dark)",
              background: "var(--bg-secondary)",
              fontSize: "11px",
              fontFamily: "'Courier Prime', monospace",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            <Sparkles size={14} style={{ color: "var(--stamp-red, #c92a2a)" }} />
            MULTI-AGENT DISPATCH IN PROGRESS
          </div>
          <h3
            className="font-headline"
            style={{
              fontSize: "22px",
              fontWeight: 800,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            Analyzing Candidate: @{username}
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              fontFamily: "'Courier Prime', monospace",
              marginTop: "4px",
            }}
          >
            Deploying 6 specialized AI agents to analyze engineering evidence
          </p>
        </div>

        <div className="rule-single" style={{ margin: "16px 0" }} />

        {/* Agent Step List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {AGENT_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  border: isCurrent
                    ? "2px solid var(--border-dark)"
                    : "1px solid var(--border-light, #e0dcd5)",
                  background: isCurrent
                    ? "var(--accent-light, #fff9db)"
                    : isCompleted
                    ? "rgba(43, 138, 62, 0.06)"
                    : "var(--bg-primary)",
                  boxShadow: isCurrent ? "2px 2px 0px var(--border-dark)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>{step.icon}</span>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "13px",
                        fontFamily: "'Courier Prime', monospace",
                        color: isCurrent ? "var(--stamp-red)" : "var(--text-primary)",
                      }}
                    >
                      {step.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {step.description}
                    </div>
                  </div>
                </div>

                <div>
                  {isCompleted && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#2b8a3e",
                        fontFamily: "'Courier Prime', monospace",
                      }}
                    >
                      <CheckCircle2 size={15} /> Complete
                    </span>
                  )}
                  {isCurrent && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--stamp-red)",
                        fontFamily: "'Courier Prime', monospace",
                      }}
                    >
                      <Loader2 size={15} className="animate-spin" /> Active...
                    </span>
                  )}
                  {isPending && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        fontFamily: "'Courier Prime', monospace",
                      }}
                    >
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              height: "8px",
              width: "100%",
              background: "var(--border-light, #e0dcd5)",
              border: "1px solid var(--border-dark)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "var(--stamp-red, #c92a2a)",
                width: `${((currentStepIndex + 1) / AGENT_STEPS.length) * 100}%`,
                transition: "width 0.4s ease-in-out",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              fontFamily: "'Courier Prime', monospace",
              marginTop: "6px",
              color: "var(--text-secondary)",
            }}
          >
            <span>PROGRESS: {Math.round(((currentStepIndex + 1) / AGENT_STEPS.length) * 100)}%</span>
            <span>SYNTHESIZING CO-PILOT REPORT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
