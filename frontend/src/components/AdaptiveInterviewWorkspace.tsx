"use client";

import { useState } from "react";
import { evaluateAdaptiveInterview, type InterviewQuestionsData, type AdaptiveFollowupResponse } from "@/lib/api";
import {
  MessageSquareCode,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Layers,
  ChevronRight,
} from "lucide-react";

interface Props {
  questionsData: InterviewQuestionsData;
  candidateName: string;
}

export default function AdaptiveInterviewWorkspace({ questionsData, candidateName }: Props) {
  const [activeDifficulty, setActiveDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [candidateNotes, setCandidateNotes] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveFollowupResponse | null>(null);

  const questions = questionsData?.[activeDifficulty] || [];
  const currentQuestion = questions[selectedIndex] || questions[0];

  const handleEvaluate = async (rating: "correct" | "partially_correct" | "incorrect") => {
    if (!currentQuestion) return;
    setEvaluating(true);
    try {
      const res = await evaluateAdaptiveInterview({
        original_question: currentQuestion.question,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        repo_context: currentQuestion.repo_context,
        user_response_rating: rating,
        candidate_answer_notes: candidateNotes,
      });
      setAdaptiveResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="vintage-box" style={{ padding: "32px" }}>
      {/* Header */}
      <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "8px", marginBottom: "20px" }}>
        <span
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--stamp-red)",
          }}
        >
          ADAPTIVE INTERVIEW ASSISTANT • REPOSITORY-ANCHORED TECHNICAL SUITE
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 className="font-headline" style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
            Technical Interview Suite for {candidateName}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
            15 repository-anchored questions with real-time feedback evaluation and dynamic follow-up generation.
          </p>
        </div>

        {/* Difficulty Selector Tabs */}
        <div style={{ display: "flex", gap: "8px" }}>
          {(["easy", "medium", "hard"] as const).map((diff) => {
            const count = (questionsData?.[diff] || []).length;
            const isSelected = activeDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => {
                  setActiveDifficulty(diff);
                  setSelectedIndex(0);
                  setAdaptiveResult(null);
                  setCandidateNotes("");
                }}
                className={`btn-vintage ${isSelected ? "btn-vintage-primary" : ""}`}
                style={{
                  fontSize: "12px",
                  padding: "8px 16px",
                  textTransform: "uppercase",
                }}
              >
                [{diff}] ({count})
              </button>
            );
          })}
        </div>
      </div>

      {currentQuestion ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Question Selector List */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
            {questions.map((q, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={q.id || idx}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setAdaptiveResult(null);
                    setCandidateNotes("");
                  }}
                  style={{
                    padding: "8px 14px",
                    fontSize: "11px",
                    fontFamily: "'Courier Prime', monospace",
                    fontWeight: 700,
                    border: "2px solid var(--border-dark)",
                    background: isSelected ? "var(--stamp-red)" : "var(--bg-primary)",
                    color: isSelected ? "#fff" : "var(--text-primary)",
                    cursor: "pointer",
                    boxShadow: isSelected ? "2px 2px 0px var(--border-dark)" : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Q{idx + 1}: {q.category}
                </button>
              );
            })}
          </div>

          {/* Current Question Card */}
          <div
            style={{
              padding: "24px",
              background: "var(--bg-secondary)",
              border: "2px solid var(--border-dark)",
              boxShadow: "3px 3px 0px var(--border-dark)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: "var(--stamp-red)", textTransform: "uppercase" }}>
                {currentQuestion.repo_context || `Repository Context: ${candidateName}/core`}
              </span>
              <span className="tag-vintage" style={{ background: "#fff" }}>
                {currentQuestion.category} • {currentQuestion.difficulty}
              </span>
            </div>

            <h4 className="font-headline" style={{ fontSize: "20px", fontWeight: 800, margin: 0, lineHeight: 1.4 }}>
              "{currentQuestion.question}"
            </h4>

            {/* Ideal Answer Points */}
            <div style={{ background: "#fff", padding: "16px", border: "1px solid var(--border-dark)" }}>
              <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                EXPECTED IDEAL ANSWER POINTS:
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", fontFamily: "'Courier Prime', monospace", color: "var(--text-primary)", lineHeight: 1.6 }}>
                {(currentQuestion.ideal_answer_points || []).map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            <div style={{ fontSize: "12px", fontFamily: "'Courier Prime', monospace", color: "var(--text-muted)", fontStyle: "italic" }}>
              <strong>AI Rationale:</strong> {currentQuestion.rationale}
            </div>
          </div>

          {/* Candidate Response Notes */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase" }}>
              INTERVIEWER NOTES / CANDIDATE ANSWER (OPTIONAL):
            </label>
            <textarea
              className="vintage-input"
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
              placeholder="Record notes on candidate's answer here..."
              rows={2}
              style={{ width: "100%", padding: "10px", fontSize: "13px", fontFamily: "'Courier Prime', monospace" }}
            />
          </div>



          {/* Adaptive AI Result Card */}
          {adaptiveResult && (
            <div
              style={{
                padding: "24px",
                background: "#fff",
                border: "2px solid var(--border-dark)",
                boxShadow: "4px 4px 0px var(--border-dark)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ borderBottom: "2px solid var(--border-dark)", paddingBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "12px", fontWeight: 700, color: "var(--stamp-red)", textTransform: "uppercase" }}>
                  ⚡ ADAPTIVE AI RECOMMENDATION • RATING: {adaptiveResult.rating.toUpperCase()}
                </span>
                <span className="rubber-stamp" style={{ fontSize: "14px" }}>
                  EVALUATED
                </span>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>
                  RECOMMENDED DYNAMIC FOLLOW-UP QUESTION:
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, fontFamily: "'Newsreader', serif", color: "var(--stamp-red)", lineHeight: 1.4 }}>
                  "{adaptiveResult.follow_up_question}"
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "4px" }}>
                <div style={{ padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-dark)" }}>
                  <div style={{ fontSize: "10px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: "var(--stamp-red)", marginBottom: "4px" }}>
                    ALTERNATIVE SCENARIO PROBE:
                  </div>
                  <div style={{ fontSize: "13px", fontFamily: "'Newsreader', serif" }}>
                    {adaptiveResult.alternative_scenario}
                  </div>
                </div>

                <div style={{ padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-dark)" }}>
                  <div style={{ fontSize: "10px", fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: "var(--stamp-red)", marginBottom: "4px" }}>
                    DEEPER ARCHITECTURE PROBE:
                  </div>
                  <div style={{ fontSize: "13px", fontFamily: "'Newsreader', serif" }}>
                    {adaptiveResult.deeper_architecture_question}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "12px", fontFamily: "'Courier Prime', monospace", color: "var(--text-primary)", background: "var(--accent-light)", padding: "10px", border: "1px solid var(--border-dark)" }}>
                💡 <strong>INTERVIEWER GUIDANCE:</strong> {adaptiveResult.guidance_notes}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontFamily: "'Courier Prime', monospace" }}>
          No interview questions available for this difficulty level.
        </div>
      )}
    </div>
  );
}
