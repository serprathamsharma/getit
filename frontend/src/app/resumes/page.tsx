"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ResumeUpload from "@/components/ResumeUpload";
import ResumeProfileView from "@/components/ResumeProfileView";
import { ParsedResume, listResumes } from "@/lib/api";

export default function ResumesPage() {
  const router = useRouter();
  const [activeResume, setActiveResume] = useState<ParsedResume | null>(null);
  const [recentResumes, setRecentResumes] = useState<ParsedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentResumes();
  }, []);

  const loadRecentResumes = async () => {
    try {
      const data = await listResumes();
      setRecentResumes(data);
      if (data.length > 0 && !activeResume) {
        setActiveResume(data[0]);
      }
    } catch (err) {
      console.error("Failed to load recent resumes", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (newResume: ParsedResume) => {
    setActiveResume(newResume);
    setRecentResumes((prev) => [newResume, ...prev.filter((r) => r.id !== newResume.id)]);
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
              gap: "32px",
              fontSize: "16px",
              fontFamily: "'Courier Prime', monospace",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            <button
              onClick={() => router.push("/")}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "16px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-primary)" }}
            >
              [ DASHBOARD ]
            </button>
            <button
              onClick={() => router.push("/search")}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "16px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-primary)" }}
            >
              [ DIRECTORY ]
            </button>
            <button
              onClick={() => router.push("/resumes")}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "16px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-primary)", borderBottom: "2px solid var(--border-dark)" }}
            >
              [ RESUME ]
            </button>
          </nav>
        </div>

        {/* Double Rule Header Divider */}
        <div className="rule-double" />
      </header>

      {/* Main Newspaper Body Content */}
      <main style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 24px 80px" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload Box & Gazette Dossier Archives */}
          <div className="lg:col-span-4 space-y-8">
            <ResumeUpload onSuccess={handleUploadSuccess} />

            {/* Gazette Dossier Archives List */}
            <div className="vintage-box p-7 sm:p-8 bg-[#FAF3E6]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#151515]">
                <h3 className="font-headline text-lg font-bold uppercase text-[#151515]">
                  Dossier Archive
                </h3>
                <span className="font-typewriter text-xs text-[#787167]">
                  {recentResumes.length} RECORDS
                </span>
              </div>


              {isLoading ? (
                <div className="py-6 text-center font-typewriter text-xs text-[#787167]">
                  Loading candidate archive...
                </div>
              ) : recentResumes.length === 0 ? (
                <p className="font-body text-xs text-[#787167] text-center py-4 italic">
                  No candidate resumes recorded yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {recentResumes.map((res) => {
                    const isActive = activeResume?.id === res.id;
                    return (
                      <button
                        key={res.id}
                        onClick={() => setActiveResume(res)}
                        className={`w-full text-left p-3 border-2 transition-all ${
                          isActive
                            ? "bg-[#EADCBF] border-[#151515] shadow-sm"
                            : "bg-[#FAF3E6] border-[#151515]/30 hover:border-[#151515] hover:bg-[#FAF3E6]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-headline text-sm font-bold text-[#151515] truncate">
                            {res.candidate_name || res.filename}
                          </p>
                          <span className="font-typewriter text-[10px] font-bold text-[#8C241B] uppercase">
                            [{res.file_format}]
                          </span>
                        </div>

                        <p className="font-typewriter text-[11px] text-[#787167] mt-1 truncate">
                          {res.skills && res.skills.length > 0 ? res.skills.slice(0, 3).join(", ") : "Parsed Resume"}
                        </p>

                        {res.job_fit_evaluation && (
                          <div className="mt-2 flex items-center justify-between font-typewriter text-[10px] pt-1.5 border-t border-dashed border-[#B8AC98]">
                            <span className="text-[#3A6335] font-bold">
                              {res.job_fit_evaluation.match_percentage}% MATCH
                            </span>
                            <span className="text-[#787167] font-semibold">
                              {res.job_fit_evaluation.verdict.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Candidate Intelligence Dossier */}
          <div className="lg:col-span-8">
            {activeResume ? (
              <ResumeProfileView
                resume={activeResume}
                onUpdateResume={(updated) => {
                  setActiveResume(updated);
                  setRecentResumes((prev) =>
                    prev.map((r) => (r.id === updated.id ? updated : r))
                  );
                }}
              />
            ) : (
              <div className="vintage-box p-12 text-center bg-[#FAF3E6] min-h-[420px] flex flex-col items-center justify-center">
                <div className="rubber-stamp-circle border-[#8C241B] text-[#8C241B] mb-4" style={{ width: 84, height: 84 }}>
                  <span className="font-bold text-xs">TALENT</span>
                  <span className="font-bold text-xs">GAZETTE</span>
                </div>
                <h3 className="font-headline text-2xl font-bold uppercase text-[#151515] mb-2">
                  No Candidate Dossier Selected
                </h3>
                <p className="font-body text-sm text-[#4A453E] max-w-md leading-relaxed">
                  Select an archived resume from the left column or submit a new candidate CV to view the complete intelligence report.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
