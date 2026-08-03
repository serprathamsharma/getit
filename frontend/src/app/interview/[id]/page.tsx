"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getInterviewPlan, InterviewPlanResponse } from "@/lib/api";
import InterviewPlanView from "@/components/InterviewPlanView";
import { Loader2 } from "lucide-react";

export default function InterviewPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [plan, setPlan] = useState<InterviewPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getInterviewPlan(id);
        setPlan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load interview plan");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header style={{ padding: "20px 48px 12px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
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

          <nav style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "18px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-primary)" }}>
              [ DASHBOARD ]
            </button>
            <button onClick={() => router.push("/search")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "18px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-primary)" }}>
              [ DIRECTORY ]
            </button>
            <button onClick={() => router.push("/resumes")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "18px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-primary)" }}>
              [ RESUME ]
            </button>
            <button onClick={() => router.push("/interview")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "18px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--stamp-red)", borderBottom: "2px solid var(--stamp-red)" }}>
              [ INTERVIEW ]
            </button>
          </nav>
        </div>
        <div className="rule-double" />
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 24px 80px" }}>
        {loading ? (
          <div className="vintage-box p-12 text-center bg-[#FAF3E6] border-2 border-[#151515] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#8C241B] animate-spin" />
            <p className="font-typewriter text-xs text-[#787167]">Loading interview questionnaire...</p>
          </div>
        ) : error || !plan ? (
          <div className="vintage-box p-12 text-center bg-[#FAF3E6] border-2 border-[#151515] space-y-4">
            <h3 className="font-headline text-xl font-bold uppercase text-[#8C241B]">
              Questionnaire Not Found
            </h3>
            <p className="font-typewriter text-xs text-[#787167]">{error}</p>
            <button className="btn-vintage" onClick={() => router.push("/interview")}>
              ← RETURN TO INTERVIEW GENERATOR
            </button>
          </div>
        ) : (
          <InterviewPlanView plan={plan} onUpdatePlan={(updated) => setPlan(updated)} />
        )}
      </main>
    </div>
  );
}
