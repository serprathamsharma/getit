"use client";

import React, { useState } from "react";
import {
  InterviewPlanResponse,
  InterviewQuestion,
  addInterviewQuestion,
  updateInterviewQuestion,
  deleteInterviewQuestion,
  getInterviewExportUrl,
} from "@/lib/api";
import {
  CheckCircle2,
  Circle,
  Star,
  Download,
  Printer,
  Plus,
  Trash2,
  AlertTriangle,
  Lightbulb,
  Clock,
  FileText,
  X,
  ShieldCheck,
  ChevronRight,
  Check,
  ChevronDown,
  Bookmark,
  Compass,
  FileSpreadsheet,
} from "lucide-react";

interface InterviewPlanViewProps {
  plan: InterviewPlanResponse;
  onUpdatePlan?: (updated: InterviewPlanResponse) => void;
}

const CATEGORIES = [
  "All",
  "Conceptual",
  "Code Deep-Dive",
  "System Design",
  "Trade-off Rationale",
  "Problem Solving",
];

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

export default function InterviewPlanView({
  plan,
  onUpdatePlan,
}: InterviewPlanViewProps) {
  const [currentPlan, setCurrentPlan] = useState<InterviewPlanResponse>(plan);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeDifficulty, setActiveDifficulty] = useState<string>("All");
  const [showUnaskedOnly, setShowUnaskedOnly] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"focus" | "list">("focus");

  // Notes state
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});

  // Add Question Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("Code Deep-Dive");
  const [newQuestion, setNewQuestion] = useState("");
  const [newContext, setNewContext] = useState("");
  const [newIdealAnswer, setNewIdealAnswer] = useState("");
  const [newRedFlags, setNewRedFlags] = useState("");
  const [newProbingHints, setNewProbingHints] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [newTimeMins, setNewTimeMins] = useState(10);
  const [isAdding, setIsAdding] = useState(false);

  // Toggle Is Asked
  const handleToggleAsked = async (q: InterviewQuestion) => {
    try {
      const updated = await updateInterviewQuestion(currentPlan.id, q.id, {
        is_asked: !q.is_asked,
      });
      setCurrentPlan(updated);
      if (onUpdatePlan) onUpdatePlan(updated);
    } catch (err) {
      console.error("Failed to toggle asked state", err);
    }
  };

  // Set Rating (1-5)
  const handleRateQuestion = async (q: InterviewQuestion, rating: number) => {
    const newRating = q.rating === rating ? null : rating;
    try {
      const updated = await updateInterviewQuestion(currentPlan.id, q.id, {
        rating: newRating,
      });
      setCurrentPlan(updated);
      if (onUpdatePlan) onUpdatePlan(updated);
    } catch (err) {
      console.error("Failed to set rating", err);
    }
  };

  // Save Notes
  const handleSaveNotes = async (q: InterviewQuestion) => {
    const notes = notesState[q.id] !== undefined ? notesState[q.id] : q.user_notes;
    setSavingNotes((prev) => ({ ...prev, [q.id]: true }));
    try {
      const updated = await updateInterviewQuestion(currentPlan.id, q.id, {
        user_notes: notes,
      });
      setCurrentPlan(updated);
      if (onUpdatePlan) onUpdatePlan(updated);
    } catch (err) {
      console.error("Failed to save notes", err);
    } finally {
      setSavingNotes((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to remove this question from the questionnaire?")) return;
    try {
      const updated = await deleteInterviewQuestion(currentPlan.id, questionId);
      setCurrentPlan(updated);
      if (onUpdatePlan) onUpdatePlan(updated);
    } catch (err) {
      console.error("Failed to delete question", err);
    }
  };

  // Add Question Submit
  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newIdealAnswer.trim()) return;

    setIsAdding(true);
    try {
      const redFlagsList = newRedFlags
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const hintsList = newProbingHints
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await addInterviewQuestion(currentPlan.id, {
        category: newCategory,
        question: newQuestion.trim(),
        context_reference: newContext.trim() || undefined,
        ideal_answer: newIdealAnswer.trim(),
        red_flags: redFlagsList,
        probing_hints: hintsList,
        difficulty: newDifficulty,
        estimated_time_mins: newTimeMins,
      });

      setCurrentPlan(updated);
      if (onUpdatePlan) onUpdatePlan(updated);
      setIsAddModalOpen(false);

      // Reset form
      setNewQuestion("");
      setNewContext("");
      setNewIdealAnswer("");
      setNewRedFlags("");
      setNewProbingHints("");
    } catch (err) {
      console.error("Failed to add question", err);
    } finally {
      setIsAdding(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Filter Questions
  const filteredQuestions = currentPlan.questions.filter((q) => {
    if (activeCategory !== "All" && q.category !== activeCategory) return false;
    if (activeDifficulty !== "All" && q.difficulty !== activeDifficulty) return false;
    if (showUnaskedOnly && q.is_asked) return false;
    return true;
  });

  const askedCount = currentPlan.questions.filter((q) => q.is_asked).length;
  const totalMins = currentPlan.questions.reduce((acc, q) => acc + (q.estimated_time_mins || 10), 0);

  const activeQuestion = filteredQuestions[activeQuestionIndex] || filteredQuestions[0];
  const progressPercent = currentPlan.questions.length
    ? Math.round((askedCount / currentPlan.questions.length) * 100)
    : 0;

  const handleNextQuestion = () => {
    if (activeQuestionIndex < filteredQuestions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex((prev) => prev - 1);
    }
  };

  // Difficulty badge color helper
  const difficultyColor = (diff: string) => {
    if (diff === "Hard") return { border: "#8C241B", text: "#8C241B", bg: "rgba(140,36,27,0.06)" };
    if (diff === "Medium") return { border: "#8C5A1B", text: "#8C5A1B", bg: "rgba(140,90,27,0.06)" };
    return { border: "#3A6335", text: "#3A6335", bg: "rgba(58,99,53,0.06)" };
  };

  return (
    <div className="space-y-10">

      {/* ── TWO-COLUMN LAYOUT ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
        <aside className="lg:col-span-3 space-y-8">

          {/* Sidebar Brand Header */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 flex items-center justify-center shrink-0"
              style={{
                border: "2px solid #151515",
                background: "var(--bg-secondary)",
                boxShadow: "2px 2px 0 #151515",
              }}
            >
              <FileSpreadsheet className="w-5 h-5" style={{ color: "var(--stamp-green)" }} />
            </div>
            <div>
              <h1 className="font-headline text-xl font-black uppercase text-[#151515] tracking-tight leading-tight">
                Questionnaire
              </h1>
              <p className="font-typewriter text-xs text-[#787167]">
                Technical Interview
              </p>
            </div>
          </div>

          {/* Progress Card */}
          <div
            className="vintage-box p-6"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-typewriter text-xs font-bold text-[#151515] uppercase tracking-wider">
                  Progress
                </h3>
                <p className="font-typewriter text-[11px] text-[#787167] mt-1">
                  {askedCount} of {currentPlan.questions.length} questions
                </p>
              </div>
              <span className="font-headline text-lg font-bold" style={{ color: "var(--stamp-green)" }}>
                {progressPercent}%
              </span>
            </div>
            <div
              className="w-full h-3 overflow-hidden"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-muted)",
              }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  background: "var(--stamp-green)",
                }}
              />
            </div>
          </div>

          {/* Filter & Options Card */}
          <div
            className="vintage-box p-6 space-y-6"
            style={{ background: "var(--bg-card)" }}
          >

            {/* Category Pills */}
            <div>
              <label className="font-typewriter text-[10px] font-bold text-[#787167] uppercase tracking-widest block mb-3">
                Filter Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setActiveQuestionIndex(0);
                      }}
                      className="font-typewriter text-[11px] font-bold uppercase cursor-pointer transition-all"
                      style={{
                        padding: "4px 10px",
                        border: isActive ? "2px solid var(--stamp-green)" : "2px solid var(--border-muted)",
                        color: isActive ? "#fff" : "var(--text-secondary)",
                        background: isActive ? "var(--stamp-green)" : "var(--bg-card)",
                        boxShadow: isActive ? "2px 2px 0 #151515" : "none",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Dropdown */}
            <div>
              <label className="font-typewriter text-[10px] font-bold text-[#787167] uppercase tracking-widest block mb-2">
                Difficulty
              </label>
              <div className="relative">
                <select
                  value={activeDifficulty}
                  onChange={(e) => {
                    setActiveDifficulty(e.target.value);
                    setActiveQuestionIndex(0);
                  }}
                  className="w-full px-4 py-2.5 font-typewriter text-xs font-bold text-[#151515] outline-none appearance-none cursor-pointer pr-10"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "2px solid var(--border-dark)",
                  }}
                >
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#787167] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Unasked Only Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer font-typewriter text-xs text-[#151515] font-bold select-none">
              <input
                type="checkbox"
                checked={showUnaskedOnly}
                onChange={(e) => {
                  setShowUnaskedOnly(e.target.checked);
                  setActiveQuestionIndex(0);
                }}
                className="w-4 h-4 accent-[#3A6335] cursor-pointer"
                style={{ border: "2px solid var(--border-dark)" }}
              />
              <span>Unasked Only</span>
            </label>

          </div>

          {/* Sidebar Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-3 px-4 font-typewriter font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{
                background: "var(--stamp-green)",
                color: "#fff",
                border: "2px solid #151515",
                boxShadow: "var(--shadow-offset-sm)",
              }}
            >
              <Plus className="w-4 h-4" />
              Add Custom Question
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrint}
                className="w-full py-2.5 px-3 font-typewriter font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "2px solid var(--border-dark)",
                  boxShadow: "var(--shadow-offset-sm)",
                }}
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <a
                href={getInterviewExportUrl(currentPlan.id)}
                download
                className="w-full py-2.5 px-3 font-typewriter font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all no-underline"
                style={{
                  background: "rgba(140,36,27,0.06)",
                  color: "var(--stamp-red)",
                  border: "2px solid var(--stamp-red)",
                  boxShadow: "var(--shadow-offset-sm)",
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </a>
            </div>
          </div>

          {/* Bottom Sidebar Footnote */}
          <div className="font-typewriter text-[11px] text-[#787167] flex items-center gap-2 pt-2">
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "var(--stamp-green)" }} />
            <span>Responses saved automatically</span>
          </div>

        </aside>

        {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
        <main className="lg:col-span-9 space-y-8">

          {/* Top Header Row */}
          <div
            className="vintage-box p-8 sm:p-10"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6" style={{ borderBottom: "2px solid var(--stamp-red)", marginBottom: "20px" }}>
              <div className="space-y-2">
                <span className="stamp-badge mb-0">[ INTERVIEW GUIDE ]</span>
                <h2 className="font-headline text-2xl sm:text-3xl font-black uppercase text-[#151515] tracking-tight leading-tight">
                  {currentPlan.target_role || "Senior Software Engineer"}
                </h2>
                <p className="font-typewriter text-xs text-[#4A453E] mt-2">
                  Candidate: <span className="font-bold text-[#151515]">{currentPlan.candidate_name || currentPlan.github_username}</span>
                  {" "}• Duration: <span className="font-bold" style={{ color: "var(--stamp-green)" }}>{currentPlan.recommended_duration_mins || totalMins} Mins</span>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 font-typewriter text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "2px solid var(--border-dark)",
                    boxShadow: "var(--shadow-offset-sm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>

                {/* View Mode Switcher */}
                <div
                  className="flex items-center font-typewriter text-xs font-bold overflow-hidden"
                  style={{ border: "2px solid var(--border-dark)" }}
                >
                  <button
                    onClick={() => setViewMode("focus")}
                    className="px-4 py-2 cursor-pointer transition-all"
                    style={{
                      background: viewMode === "focus" ? "var(--stamp-green)" : "var(--bg-card)",
                      color: viewMode === "focus" ? "#fff" : "var(--text-primary)",
                      borderRight: "2px solid var(--border-dark)",
                    }}
                  >
                    FOCUS
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className="px-4 py-2 cursor-pointer transition-all"
                    style={{
                      background: viewMode === "list" ? "var(--stamp-green)" : "var(--bg-card)",
                      color: viewMode === "list" ? "#fff" : "var(--text-primary)",
                    }}
                  >
                    LIST
                  </button>
                </div>
              </div>
            </div>

            <div className="font-typewriter text-xs text-[#787167] flex items-center justify-between">
              <span>QUESTIONS: {currentPlan.questions.length} TOTAL • {askedCount} ASKED</span>
              <span>EST. TIME: {totalMins} MINS</span>
            </div>
          </div>

          {/* ── MODE 1: FOCUS VIEW ───────────────────────────────────────── */}
          {viewMode === "focus" && (
            <>
              {!activeQuestion ? (
                <div
                  className="vintage-box p-12 text-center"
                  style={{ background: "var(--bg-card)" }}
                >
                  <p className="font-typewriter text-sm font-bold text-[#787167]">No questions match current category or difficulty filter.</p>
                </div>
              ) : (
                <div className="space-y-8">

                  {/* MAIN QUESTION DISPLAY CARD */}
                  <div
                    className="vintage-box p-8 sm:p-10 space-y-8"
                    style={{ background: "var(--bg-card)" }}
                  >

                    {/* Top Badges & Metadata Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Question Number Badge */}
                        <span
                          className="font-typewriter text-[11px] font-bold uppercase px-3 py-1"
                          style={{
                            border: "2px solid var(--stamp-green)",
                            color: "var(--stamp-green)",
                            background: "rgba(58,99,53,0.06)",
                          }}
                        >
                          Q{activeQuestionIndex + 1} of {filteredQuestions.length}
                        </span>

                        {/* Category Badge */}
                        <span
                          className="font-typewriter text-[11px] font-bold uppercase px-3 py-1"
                          style={{
                            border: "2px solid var(--border-dark)",
                            color: "var(--text-primary)",
                            background: "var(--bg-secondary)",
                          }}
                        >
                          {activeQuestion.category}
                        </span>

                        {/* Difficulty Badge */}
                        {(() => {
                          const dc = difficultyColor(activeQuestion.difficulty || "Medium");
                          return (
                            <span
                              className="font-typewriter text-[11px] font-bold uppercase px-3 py-1"
                              style={{
                                border: `2px solid ${dc.border}`,
                                color: dc.text,
                                background: dc.bg,
                              }}
                            >
                              {activeQuestion.difficulty || "Medium"}
                            </span>
                          );
                        })()}

                        {/* Time Badge */}
                        <span className="font-typewriter text-[11px] font-bold text-[#787167] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {activeQuestion.estimated_time_mins || 10} MINS
                        </span>

                        {/* Context Reference */}
                        {activeQuestion.context_reference && (
                          <span className="font-typewriter text-[11px] text-[#4A453E]">
                            • {activeQuestion.context_reference}
                          </span>
                        )}
                      </div>

                      {/* Rating Stars & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="font-typewriter text-[10px] text-[#787167] font-bold uppercase mr-1">Rating</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRateQuestion(activeQuestion, star)}
                              className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  activeQuestion.rating && activeQuestion.rating >= star
                                    ? "fill-[#8C5A1B] text-[#8C5A1B]"
                                    : "text-[#B8AC98]"
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => handleToggleAsked(activeQuestion)}
                          className="p-1 cursor-pointer transition-colors"
                          title="Toggle Asked"
                          style={{ color: activeQuestion.is_asked ? "var(--stamp-green)" : "var(--text-muted)" }}
                        >
                          <Bookmark className={`w-4.5 h-4.5 ${activeQuestion.is_asked ? "fill-current" : ""}`} />
                        </button>

                        <button
                          onClick={() => handleDeleteQuestion(activeQuestion.id)}
                          className="p-1 cursor-pointer transition-colors"
                          title="Delete Question"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--stamp-red)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="rule-double" style={{ margin: "0" }} />

                    {/* Prominent Question Text */}
                    <div className="py-4">
                      <h3 className="font-headline text-xl sm:text-2xl font-bold text-[#151515] leading-snug tracking-tight">
                        &ldquo;{activeQuestion.question}&rdquo;
                      </h3>
                    </div>

                    {/* What We're Looking For Section */}
                    <div
                      className="p-6 space-y-3"
                      style={{
                        background: "var(--bg-secondary)",
                        border: "2px solid var(--stamp-green)",
                      }}
                    >
                      <h4 className="font-typewriter text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--stamp-green)" }}>
                        <Compass className="w-4 h-4" />
                        What We&apos;re Looking For &amp; Ideal Answer Key
                      </h4>
                      <p className="font-body text-sm text-[#4A453E] leading-relaxed">
                        {activeQuestion.ideal_answer}
                      </p>
                    </div>

                    {/* Side-by-Side Cards (Red Flags vs Follow-up Probing Hints) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">

                      {/* Red Flags Card */}
                      <div
                        className="p-6 space-y-4"
                        style={{
                          background: "rgba(140,36,27,0.04)",
                          border: "2px solid var(--stamp-red)",
                        }}
                      >
                        <h5 className="font-typewriter text-[11px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--stamp-red)" }}>
                          <AlertTriangle className="w-4 h-4" />
                          Red Flags to Watch For
                        </h5>
                        <ul className="space-y-3 font-body text-sm text-[#151515]">
                          {(activeQuestion.red_flags || [
                            "Vague answers ignoring language-specific concurrency models",
                            "Confusing async/await primitives with multi-process execution",
                            "Inability to explain memory retention or cleanup strategies"
                          ]).map((rf, i) => (
                            <li key={i} className="flex items-start gap-3 leading-relaxed">
                              <span className="font-bold mt-0.5" style={{ color: "var(--stamp-red)" }}>•</span>
                              <span>{rf}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Follow-up Probing Hints Card */}
                      <div
                        className="p-6 space-y-4"
                        style={{
                          background: "rgba(58,99,53,0.04)",
                          border: "2px solid var(--stamp-green)",
                        }}
                      >
                        <h5 className="font-typewriter text-[11px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--stamp-green)" }}>
                          <Lightbulb className="w-4 h-4" />
                          Follow-up Probing Hints
                        </h5>
                        <ul className="space-y-3 font-body text-sm text-[#151515]">
                          {(activeQuestion.probing_hints || [
                            "Ask how they profile high memory consumption in production",
                            "Probe on event-loop blocking or deadlock scenarios"
                          ]).map((hint, i) => (
                            <li key={i} className="flex items-start gap-3 leading-relaxed">
                              <span className="font-bold mt-0.5" style={{ color: "var(--stamp-green)" }}>•</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                  </div>

                  {/* YOUR NOTES CARD */}
                  <div
                    className="vintage-box p-8 space-y-4"
                    style={{ background: "var(--bg-card)" }}
                  >
                    <div className="flex items-center justify-between">
                      <label className="font-typewriter text-xs font-bold text-[#151515] uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" style={{ color: "var(--stamp-red)" }} />
                        Interviewer Observations
                      </label>
                      <button
                        onClick={() => handleSaveNotes(activeQuestion)}
                        disabled={savingNotes[activeQuestion.id]}
                        className="font-typewriter text-xs font-bold underline cursor-pointer"
                        style={{ color: "var(--stamp-green)" }}
                      >
                        {savingNotes[activeQuestion.id] ? "Saving..." : "Save Notes"}
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      value={notesState[activeQuestion.id] !== undefined ? notesState[activeQuestion.id] : activeQuestion.user_notes || ""}
                      onChange={(e) =>
                        setNotesState((prev) => ({ ...prev, [activeQuestion.id]: e.target.value }))
                      }
                      placeholder="Write your observations, notes, or follow-up questions here..."
                      className="w-full p-4 font-typewriter text-sm text-[#151515] outline-none transition-all min-h-[130px]"
                      style={{
                        background: "var(--bg-secondary)",
                        border: "2px solid var(--border-muted)",
                        color: "var(--text-primary)",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--stamp-green)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-muted)")}
                    />
                  </div>

                  {/* BOTTOM NAVIGATION BAR */}
                  <div className="flex items-center justify-between pt-4">
                    <button
                      onClick={handlePrevQuestion}
                      disabled={activeQuestionIndex === 0}
                      className="font-typewriter text-xs font-bold uppercase cursor-pointer transition-all"
                      style={{
                        padding: "10px 20px",
                        background: activeQuestionIndex === 0 ? "var(--bg-tertiary)" : "var(--bg-secondary)",
                        color: activeQuestionIndex === 0 ? "var(--text-muted)" : "var(--text-primary)",
                        border: "2px solid var(--border-dark)",
                        opacity: activeQuestionIndex === 0 ? 0.5 : 1,
                        boxShadow: activeQuestionIndex === 0 ? "none" : "var(--shadow-offset-sm)",
                        cursor: activeQuestionIndex === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      ← Previous
                    </button>

                    {/* Question Index Buttons */}
                    <div className="flex items-center gap-2">
                      {filteredQuestions.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveQuestionIndex(idx)}
                          className="font-typewriter text-[11px] font-bold cursor-pointer transition-all"
                          style={{
                            width: "30px",
                            height: "30px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid var(--border-dark)",
                            background: activeQuestionIndex === idx ? "var(--stamp-green)" : "var(--bg-card)",
                            color: activeQuestionIndex === idx ? "#fff" : "var(--text-primary)",
                            boxShadow: activeQuestionIndex === idx ? "var(--shadow-offset-sm)" : "none",
                          }}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      disabled={activeQuestionIndex >= filteredQuestions.length - 1}
                      className="font-typewriter text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all"
                      style={{
                        padding: "10px 24px",
                        background: activeQuestionIndex >= filteredQuestions.length - 1 ? "var(--bg-tertiary)" : "var(--stamp-green)",
                        color: activeQuestionIndex >= filteredQuestions.length - 1 ? "var(--text-muted)" : "#fff",
                        border: "2px solid #151515",
                        boxShadow: activeQuestionIndex >= filteredQuestions.length - 1 ? "none" : "var(--shadow-offset-sm)",
                        opacity: activeQuestionIndex >= filteredQuestions.length - 1 ? 0.5 : 1,
                        cursor: activeQuestionIndex >= filteredQuestions.length - 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}
            </>
          )}

          {/* ── MODE 2: LIST VIEW ────────────────────────────────────────── */}
          {viewMode === "list" && (
            <div className="space-y-6">
              {filteredQuestions.length === 0 ? (
                <div
                  className="vintage-box p-12 text-center"
                  style={{ background: "var(--bg-card)" }}
                >
                  <p className="font-typewriter text-sm font-bold text-[#787167]">No questions match current filters.</p>
                </div>
              ) : (
                filteredQuestions.map((q, index) => (
                  <div
                    key={q.id}
                    className="vintage-box p-6 sm:p-8 space-y-5"
                    style={{
                      background: q.is_asked ? "var(--bg-secondary)" : "var(--bg-card)",
                      opacity: q.is_asked ? 0.8 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="font-typewriter text-[11px] font-bold uppercase px-3 py-1"
                          style={{
                            border: "2px solid var(--stamp-green)",
                            color: "var(--stamp-green)",
                            background: "rgba(58,99,53,0.06)",
                          }}
                        >
                          Q{index + 1}
                        </span>
                        <span
                          className="font-typewriter text-[11px] font-bold uppercase px-3 py-1"
                          style={{
                            border: "2px solid var(--border-dark)",
                            color: "var(--text-primary)",
                            background: "var(--bg-secondary)",
                          }}
                        >
                          {q.category}
                        </span>
                        {(() => {
                          const dc = difficultyColor(q.difficulty || "Medium");
                          return (
                            <span
                              className="font-typewriter text-[11px] font-bold uppercase px-3 py-1"
                              style={{
                                border: `2px solid ${dc.border}`,
                                color: dc.text,
                                background: dc.bg,
                              }}
                            >
                              {q.difficulty || "Medium"}
                            </span>
                          );
                        })()}
                      </div>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 cursor-pointer transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--stamp-red)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-headline text-lg font-bold text-[#151515] leading-snug">
                      &ldquo;{q.question}&rdquo;
                    </h3>

                    <div className="rule-single" style={{ margin: "0" }} />

                    <div className="space-y-2">
                      <span className="font-typewriter text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--stamp-green)" }}>
                        What We&apos;re Looking For
                      </span>
                      <p className="font-body text-sm text-[#4A453E] leading-relaxed">{q.ideal_answer}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </main>
      </div>

      {/* ── ADD CUSTOM QUESTION MODAL ────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="vintage-box p-6 sm:p-8 max-w-xl w-full space-y-5 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: "2px solid var(--stamp-red)" }}>
              <h3 className="font-headline text-lg font-bold uppercase text-[#151515]">
                Add Custom Question
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 cursor-pointer"
                style={{ color: "var(--text-primary)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-5 font-typewriter text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#787167] uppercase mb-2 tracking-wider">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-3 font-typewriter text-xs font-bold text-[#151515]"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "2px solid var(--border-dark)",
                    }}
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#787167] uppercase mb-2 tracking-wider">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full p-3 font-typewriter text-xs font-bold text-[#151515]"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "2px solid var(--border-dark)",
                    }}
                  >
                    {DIFFICULTIES.filter((d) => d !== "All").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#787167] uppercase mb-2 tracking-wider">Question Text *</label>
                <textarea
                  rows={3}
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. In your experience with TypeScript, how do you manage memory lifecycle..."
                  className="w-full p-4 font-typewriter text-xs text-[#151515] leading-relaxed outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "2px solid var(--border-dark)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--stamp-green)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-dark)")}
                />
              </div>

              <div>
                <label className="block font-bold text-[#787167] uppercase mb-2 tracking-wider">Context Reference</label>
                <input
                  type="text"
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  placeholder="e.g. Language: TypeScript • Primary Stack"
                  className="w-full p-3 font-typewriter text-xs text-[#151515] outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "2px solid var(--border-dark)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--stamp-green)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-dark)")}
                />
              </div>

              <div>
                <label className="block font-bold text-[#787167] uppercase mb-2 tracking-wider">Ideal Answer Key *</label>
                <textarea
                  rows={3}
                  required
                  value={newIdealAnswer}
                  onChange={(e) => setNewIdealAnswer(e.target.value)}
                  placeholder="We want to understand how you think about TypeScript's runtime behavior..."
                  className="w-full p-4 font-typewriter text-xs text-[#151515] leading-relaxed outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "2px solid var(--border-dark)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--stamp-green)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-dark)")}
                />
              </div>

              <div>
                <label className="block font-bold text-[#787167] uppercase mb-2 tracking-wider">Red Flags (One per line)</label>
                <textarea
                  rows={2}
                  value={newRedFlags}
                  onChange={(e) => setNewRedFlags(e.target.value)}
                  placeholder="e.g. Vague answers ignoring language-specific concurrency models"
                  className="w-full p-3 font-typewriter text-xs text-[#151515] outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "2px solid var(--border-dark)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--stamp-red)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-dark)")}
                />
              </div>

              <div>
                <label className="block font-bold text-[#787167] uppercase mb-2 tracking-wider">Probing Hints (One per line)</label>
                <textarea
                  rows={2}
                  value={newProbingHints}
                  onChange={(e) => setNewProbingHints(e.target.value)}
                  placeholder="e.g. Ask how they profile high memory consumption in production"
                  className="w-full p-3 font-typewriter text-xs text-[#151515] outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "2px solid var(--border-dark)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--stamp-green)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-dark)")}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: "2px solid var(--border-muted)" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 font-typewriter text-xs font-bold uppercase cursor-pointer"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "2px solid var(--border-dark)",
                    color: "var(--text-primary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2.5 font-typewriter text-xs font-bold uppercase cursor-pointer"
                  style={{
                    background: "var(--stamp-green)",
                    border: "2px solid #151515",
                    color: "#fff",
                    boxShadow: "var(--shadow-offset-sm)",
                  }}
                >
                  {isAdding ? "Adding..." : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
