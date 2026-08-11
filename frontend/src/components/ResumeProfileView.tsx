"use client";

import React, { useState, useEffect, useRef } from "react";
import { ParsedResume, evaluateJobFit, getEngineerByUsername, analyzeEngineer, EngineerProfile, getResumeFileUrl, getResumeDownloadUrl } from "@/lib/api";

interface ResumeProfileViewProps {
  resume: ParsedResume;
  onUpdateResume?: (updated: ParsedResume) => void;
}

export default function ResumeProfileView({ resume, onUpdateResume }: ResumeProfileViewProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(true);

  // GitHub Candidate Profile State
  const [githubProfile, setGithubProfile] = useState<EngineerProfile | null>(null);
  const [isAnalyzingGithub, setIsAnalyzingGithub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Extract GitHub username if present in DB model or fallback regex from raw_text
  const githubUsername =
    resume.github_username ||
    (() => {
      const match = resume.raw_text?.match(/github\.com\/([a-zA-Z0-9_\-\.]+)/i);
      return match ? match[1].replace(/[\/\.]*$/, "") : null;
    })();

  // Work History Right-Side Vertical Slider & Scroll Refs
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeScrollStation, setActiveScrollStation] = useState(0);

  useEffect(() => {
    setActiveScrollStation(0);
    itemRefs.current = [];
  }, [resume.id]);

  const handleTimelineScroll = () => {
    if (!timelineScrollRef.current || !resume.work_history) return;
    const container = timelineScrollRef.current;
    const containerTop = container.scrollTop;
    let currentIdx = 0;
    for (let i = 0; i < resume.work_history.length; i++) {
      const el = itemRefs.current[i];
      if (el && el.offsetTop - container.offsetTop <= containerTop + 100) {
        currentIdx = i;
      }
    }
    setActiveScrollStation(currentIdx);
  };

  const scrollToStation = (index: number) => {
    setActiveScrollStation(index);
    if (timelineScrollRef.current && itemRefs.current[index]) {
      const container = timelineScrollRef.current;
      const item = itemRefs.current[index];
      container.scrollTo({
        top: item.offsetTop - container.offsetTop - 12,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (githubUsername) {
      loadGithubProfile(githubUsername);
    } else {
      setGithubProfile(null);
    }
  }, [resume.id, githubUsername]);

  const loadGithubProfile = async (username: string) => {
    try {
      setGithubError(null);
      const profile = await getEngineerByUsername(username);
      setGithubProfile(profile);
    } catch {
      // Not analyzed yet in DB, we can leave githubProfile null until user clicks "Run GitHub Analysis"
      setGithubProfile(null);
    }
  };

  const handleRunGithubAnalysis = async () => {
    if (!githubUsername) return;
    setIsAnalyzingGithub(true);
    setGithubError(null);
    try {
      const res = await analyzeEngineer(githubUsername);
      if (res.profile) {
        setGithubProfile(res.profile);
      }
    } catch (err: any) {
      setGithubError(err.message || "Failed to analyze GitHub profile");
    } finally {
      setIsAnalyzingGithub(false);
    }
  };

  const handleJobFitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsEvaluating(true);
    setEvalError(null);

    try {
      const updated = await evaluateJobFit(resume.id, jobDescription);
      if (onUpdateResume) {
        onUpdateResume(updated);
      }
    } catch (err: any) {
      setEvalError(err.message || "Failed to evaluate job fit");
    } finally {
      setIsEvaluating(false);
    }
  };

  const evalData = resume.job_fit_evaluation;

  return (
    <div className="space-y-10">
      {/* ── Candidate Masthead Banner ─────────────────────────────────── */}
      <div className="vintage-box p-8 sm:p-10 bg-[#FAF3E6] border-2 border-[#151515]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b-2 border-[#8C241B]" style={{ marginBottom: '20px' }}>
          <div className="space-y-3 flex-1 min-w-0">
            {/* Dossier Badge & Format in single line above candidate name */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="stamp-badge whitespace-nowrap mb-0">
                [ DOSSIER NO. {resume.id.substring(0, 8).toUpperCase()} ]
              </span>
              <span className="font-typewriter text-xs font-bold text-[#787167] whitespace-nowrap uppercase">
                FORMAT: {resume.file_format.toUpperCase()}
              </span>
            </div>

            {/* Candidate Name */}
            <h1 className="font-headline text-xl sm:text-2xl lg:text-3xl font-black uppercase text-[#151515] tracking-tight leading-tight mt-2 mb-2 break-words">
              {resume.candidate_name || "Unidentified Candidate"}
            </h1>

            <p className="font-typewriter text-xs text-[#4A453E] mt-2">
              Source File: <span className="underline">{resume.filename}</span>
            </p>
          </div>

          {/* Contact, Experience & GitHub Link Badges (Shifted to right-aligned column) */}
          <div className="flex flex-col items-start md:items-end gap-2.5 font-typewriter text-xs shrink-0">
            <div className="flex flex-wrap items-center md:justify-end gap-2.5">
              {resume.email && (
                <div className="tag-vintage">
                  ✉ {resume.email}
                </div>
              )}
              {resume.phone && (
                <div className="tag-vintage">
                  ☎ {resume.phone}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center md:justify-end gap-2.5">
              {githubUsername && (
                <a
                  href={`https://github.com/${githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tag-vintage border-2 border-[#151515] bg-[#EADCBF] hover:bg-[#FAF3E6] transition-colors font-bold text-[#151515] flex items-center space-x-1"
                >
                  <span>💻 github.com/{githubUsername} ↗</span>
                </a>
              )}
              <div className="tag-vintage font-bold border-2 border-[#8C241B] text-[#8C241B]">
                ⏱ {resume.experience_years ? `${resume.experience_years} YRS EXP.` : "EXPERIENCED"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between font-typewriter text-xs text-[#787167]">
          <span>RECORD CREATED: {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : "RECENT"}</span>
          <span>PARSED VIA: TALENT RADAR GAZETTE ENGINE</span>
        </div>
      </div>

      {/* ── Candidate PDF & Original Document Viewer ───────────────────────── */}
      <div className="vintage-box p-8 sm:p-10 bg-[#FAF3E6] border-2 border-[#151515] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-[#8C241B]" style={{ marginBottom: '40px' }}>
          <div>
            <span className="stamp-badge mb-3 block w-max">CANDIDATE DOCUMENT SOURCE</span>
            <h2 className="font-headline text-2xl font-bold uppercase text-[#151515]">
              Original Resume PDF & File Viewer
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-typewriter text-xs">
            <button
              onClick={() => setShowPdfPreview(!showPdfPreview)}
              className="btn-vintage text-xs py-2 px-4"
            >
              {showPdfPreview ? "[ HIDE PDF PREVIEW ▲ ]" : "[ VIEW PDF PREVIEW ▼ ]"}
            </button>
            <a
              href={resume.file_url || getResumeFileUrl(resume.id)}
              target="_blank"
              rel="noreferrer"
              className="btn-vintage text-xs py-2 px-4 inline-flex items-center gap-1"
              style={{ background: "#EADCBF", color: "#151515", textDecoration: "none" }}
            >
              <span>OPEN TAB ↗</span>
            </a>
            <a
              href={resume.file_url || getResumeDownloadUrl(resume.id)}
              download={resume.filename}
              className="btn-vintage text-xs py-2 px-4 inline-flex items-center gap-1"
              style={{ background: "#8C241B", color: "white", textDecoration: "none" }}
            >
              <span>DOWNLOAD 📥</span>
            </a>
          </div>
        </div>

        {showPdfPreview && (
          <div className="space-y-4 pt-1">
            <div className="border-2 border-[#151515] bg-[#2A2825] rounded-none overflow-hidden shadow-inner">
              {resume.file_url ? (
                <iframe
                  src={`${resume.file_url}#toolbar=0&navpanes=0`}
                  className="w-full h-[540px] border-none bg-white"
                  title={`Resume Document - ${resume.filename}`}
                />
              ) : (
                <iframe
                  src={`${getResumeFileUrl(resume.id)}#toolbar=0&navpanes=0`}
                  className="w-full h-[540px] border-none bg-white"
                  title={`Resume Document - ${resume.filename}`}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-xs font-typewriter text-[#787167]">
              <span>FILE: {resume.filename} ({resume.file_format.toUpperCase()})</span>
              <a
                href={resume.file_url || getResumeFileUrl(resume.id)}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#8C241B]"
              >
                Open document directly in new browser tab ↗
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── Candidate GitHub Intelligence Section (If Detected) ───── */}
      {githubUsername && (
        <div className="vintage-box p-8 sm:p-10 bg-[#FAF3E6] border-2 border-[#151515] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#151515]">
            <div>
              <span className="stamp-badge mb-3 block w-max">GITHUB PROFILING INTEGRATION</span>
              <h2 className="font-headline text-2xl font-bold uppercase text-[#151515]">
                Candidate GitHub Intelligence
              </h2>
            </div>
            <a
              href={`https://github.com/${githubUsername}`}
              target="_blank"
              rel="noreferrer"
              className="btn-vintage text-xs py-2 px-4"
            >
              OPEN GITHUB PROFILE ↗
            </a>
          </div>

          {githubProfile ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="classified-box flex items-center space-x-4">
                  <div className="rubber-stamp-circle border-[#8C241B] text-[#8C241B] flex-shrink-0" style={{ width: 72, height: 72 }}>
                    <span className="font-extrabold text-lg leading-none">{githubProfile.talent_score ?? 85}</span>
                    <span className="text-[8px] font-bold mt-0.5">RADAR SCORE</span>
                  </div>
                  <div>
                    <p className="font-typewriter text-xs font-bold uppercase text-[#787167]">Talent Rating</p>
                    <p className="font-headline text-base font-bold text-[#151515]">{githubProfile.archetype || "Software Engineer"}</p>
                  </div>
                </div>

                <div className="classified-box flex items-center space-x-4">
                  <div className="rubber-stamp-circle border-[#3A6335] text-[#3A6335] flex-shrink-0" style={{ width: 72, height: 72 }}>
                    <span className="font-extrabold text-lg leading-none">{githubProfile.public_repos}</span>
                    <span className="text-[8px] font-bold mt-0.5">PUBLIC REPOS</span>
                  </div>
                  <div>
                    <p className="font-typewriter text-xs font-bold uppercase text-[#787167]">Community</p>
                    <p className="font-headline text-base font-bold text-[#151515]">{githubProfile.followers} Followers</p>
                  </div>
                </div>

                <div className="classified-box">
                  <p className="font-typewriter text-xs font-bold uppercase text-[#787167] mb-1">GitHub Summary</p>
                  <p className="font-body text-xs text-[#151515] leading-relaxed line-clamp-3 italic">
                    {githubProfile.ai_summary || `Active engineer on GitHub (@${githubUsername}) with contributions across public repositories.`}
                  </p>
                </div>
              </div>

              {githubProfile.top_repos && githubProfile.top_repos.length > 0 && (
                <div>
                  <h4 className="font-typewriter text-xs font-bold uppercase text-[#787167] mb-3">
                    Top Public Repositories
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {githubProfile.top_repos.slice(0, 4).map((repo, idx) => (
                      <div key={idx} className="p-4 border-2 border-[#151515] bg-[#FAF3E6] flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <a
                            href={repo.repo_url || `https://github.com/${repo.repo_full_name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-headline text-sm font-bold text-[#151515] hover:underline"
                          >
                            📁 {repo.repo_full_name}
                          </a>
                          <span className="font-typewriter text-xs font-bold text-[#8C241B]">
                            ★ {repo.stars}
                          </span>
                        </div>

                        {(repo.readme_summary || repo.description) && (
                          <div className="bg-[#8C241B]/5 border-l-2 border-[#8C241B] p-2 text-xs font-body italic text-[#151515] leading-relaxed">
                            <span className="font-typewriter not-italic text-[10px] font-bold text-[#8C241B] block mb-0.5">
                              📜 README SUMMARY & BUILD:
                            </span>
                            {repo.readme_summary || repo.description}
                          </div>
                        )}

                        {repo.tech_stack && repo.tech_stack.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className="font-typewriter text-[10px] font-bold text-[#787167]">TECH:</span>
                            {repo.tech_stack.map((tech, tIdx) => (
                              <span key={tIdx} className="font-typewriter text-[10px] font-bold px-1.5 py-0.5 bg-[#EADCBF] border border-[#151515] text-[#1B5E55]">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-[#EADCBF] border-2 border-[#151515] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-headline text-base font-bold text-[#151515]">
                  Detected Candidate Handle: <span className="underline">@{githubUsername}</span>
                </p>
                <p className="font-body text-xs text-[#4A453E] mt-1 leading-relaxed">
                  Run Talent Radar code intelligence analysis to fetch live repository metrics, commit history, and radar score for this candidate.
                </p>
              </div>
              <button
                onClick={handleRunGithubAnalysis}
                disabled={isAnalyzingGithub}
                className="btn-vintage text-xs whitespace-nowrap"
              >
                {isAnalyzingGithub ? "[ ANALYZING GITHUB... ]" : "ANALYZE GITHUB PROFILE ⚡"}
              </button>
            </div>
          )}

          {githubError && (
            <p className="font-typewriter text-xs text-[#8C241B] font-bold">[ GITHUB ERROR ]: {githubError}</p>
          )}
        </div>
      )}



      {/* ── Extracted Skills Matrix ─────────────────────────────────── */}
      <div className="vintage-box p-8 sm:p-10 bg-[#FAF3E6] border-2 border-[#151515]">
        <div className="pb-5 border-b-2 border-[#8C241B]" style={{ marginBottom: '40px' }}>
          <span className="stamp-badge mb-3 block w-max">TECHNICAL CAPABILITIES</span>
          <h3 className="font-headline text-2xl font-bold uppercase text-[#151515]">
            Extracted Skills Inventory
          </h3>
        </div>

        <div className="flex flex-wrap gap-3">
          {resume.skills && resume.skills.length > 0 ? (
            resume.skills.map((skill, idx) => (
              <span key={idx} className="tag-vintage hover:bg-[#EADCBF] transition-colors py-1.5 px-3">
                {skill}
              </span>
            ))
          ) : (
            <p className="font-body text-sm text-[#787167] italic">No explicit technical skills extracted.</p>
          )}
        </div>
      </div>

      {/* ── Work Experience Timeline with Right-Side Vertical Slider ──────────────────────── */}
      <div className="vintage-box p-6 sm:p-8 bg-[#FAF3E6] border-2 border-[#151515] space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b-2 border-[#8C241B]" style={{ marginBottom: '40px' }}>
          <div>
            <span className="stamp-badge mb-2 block w-max">CAREER HISTORY</span>
            <h3 className="font-headline text-2xl font-bold uppercase text-[#151515]">
              Employment Timeline & Track Record
            </h3>
          </div>

        </div>

        {resume.work_history && resume.work_history.length > 0 ? (
          <div className="flex gap-4 items-stretch pt-2 relative">
            {/* Main Vertical Timeline Scroll Window */}
            <div
              ref={timelineScrollRef}
              onScroll={handleTimelineScroll}
              className="flex-1 max-h-[540px] overflow-y-auto space-y-6 pr-4 vintage-scrollbar"
              style={{ scrollBehavior: "smooth" }}
            >
              {resume.work_history.map((job, idx) => {
                let roleTitle = (job.role || "Software Engineer").trim();
                roleTitle = roleTitle.replace(/^(?:in|experience in|delivering|with|working as|responsible for|proven|expertise in)\s+/i, "");
                roleTitle = roleTitle.replace(/[,;:-]+$/, "").trim();
                if (roleTitle) {
                  roleTitle = roleTitle[0].toUpperCase() + roleTitle.slice(1);
                } else {
                  roleTitle = "Engineering Professional";
                }
                const isDuplicateCompany = !job.company || job.company.toLowerCase() === roleTitle.toLowerCase() || job.company.toLowerCase().startsWith("in ");

                return (
                  <div
                    key={idx}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    className={`border-l-2 border-[#151515] relative pb-6 space-y-2 transition-all duration-200 ${
                      activeScrollStation === idx ? "bg-[#EADCBF]/40 p-3 -ml-3 pl-9 border-l-4 border-[#8C241B]" : ""
                    }`}
                    style={{ paddingLeft: "32px", marginLeft: activeScrollStation === idx ? "-1px" : "8px" }}
                  >
                    {/* Diamond Marker */}
                    <div
                      className={`absolute border-2 border-[#151515] transform rotate-45 transition-colors ${
                        activeScrollStation === idx ? "bg-[#8C241B] scale-125" : "bg-[#8C241B]"
                      }`}
                      style={{ left: "-7px", top: "6px", width: "12px", height: "12px" }}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
                      <h4 className="font-headline text-lg sm:text-xl font-bold text-[#151515] leading-snug">
                        {roleTitle}
                      </h4>
                      <span className="font-typewriter text-xs font-bold text-[#8C241B] bg-[#EADCBF] px-2.5 py-1 border border-[#151515] whitespace-nowrap self-start sm:self-auto shrink-0">
                        [{job.duration || "DATES NOT SPECIFIED"}]
                      </span>
                    </div>

                    {!isDuplicateCompany && job.company && (
                      <p className="font-typewriter text-xs font-bold uppercase tracking-wider text-[#787167]">
                        🏢 {job.company}
                      </p>
                    )}

                    {job.description && (
                      <p className="font-body text-base text-[#151515] leading-relaxed pt-1">
                        {job.description}
                      </p>
                    )}

                    {job.highlights && job.highlights.length > 0 && (
                      <ul className="space-y-2 font-body text-sm text-[#4A453E] leading-relaxed pt-1">
                        {job.highlights.map((h, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-[#8C241B] font-bold mr-1">▪</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          <p className="font-body text-sm text-[#787167] italic">No employment history listed.</p>
        )}
      </div>

      {/* ── Key Projects & Education Grid ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Projects Card */}
        <div className="vintage-box p-8 sm:p-10 bg-[#FAF3E6] border-2 border-[#151515]">
          <div className="pb-5 border-b-2 border-[#8C241B]" style={{ marginBottom: '40px' }}>
            <span className="stamp-badge mb-3 block w-max">PROJECT EVIDENCE</span>
            <h3 className="font-headline text-xl font-bold uppercase text-[#151515]">
              Highlighted Engineering Projects
            </h3>
          </div>

          <div className="space-y-6">
            {resume.projects && resume.projects.length > 0 ? (
              resume.projects.map((proj, idx) => (
                <div key={idx} className="classified-box p-5 space-y-3">
                  <h4 className="font-headline text-lg font-bold text-[#151515]">{proj.title}</h4>
                  <p className="font-body text-sm text-[#4A453E] leading-relaxed">{proj.description}</p>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {proj.technologies.map((t, i) => (
                        <span key={i} className="tag-vintage text-[11px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="font-body text-sm text-[#787167] italic">No key projects recorded.</p>
            )}
          </div>
        </div>

        {/* Education & Certifications Card */}
        <div className="vintage-box p-8 sm:p-10 bg-[#FAF3E6] border-2 border-[#151515] space-y-10">
          <div>
            <div className="pb-5 border-b-2 border-[#8C241B]" style={{ marginBottom: '40px' }}>
              <span className="stamp-badge mb-3 block w-max">ACADEMICS</span>
              <h3 className="font-headline text-xl font-bold uppercase text-[#151515]">
                Education & Credentials
              </h3>
            </div>

            <div className="space-y-6">
              {resume.education && resume.education.length > 0 ? (
                resume.education.map((edu, idx) => (
                  <div key={idx} className="classified-box p-5 space-y-2">
                    <p className="font-headline text-lg font-bold text-[#151515]">{edu.degree}</p>
                    <p className="font-typewriter text-xs text-[#787167]">
                      {edu.institution} {edu.year && `• [ ${edu.year} ]`}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-body text-sm text-[#787167] italic">No education listed.</p>
              )}
            </div>
          </div>

          {resume.certifications && resume.certifications.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <div className="pb-5 border-b-2 border-[#8C241B]" style={{ marginBottom: '40px' }}>
                <h4 className="font-headline text-xl font-bold uppercase text-[#151515]">
                  Certifications & Diplomas
                </h4>
              </div>
              <div className="flex flex-wrap gap-4">
                {resume.certifications.map((cert, idx) => (
                  <span key={idx} className="tag-vintage border-[#8C241B] text-[#8C241B] whitespace-normal break-words max-w-full py-2.5 px-4">
                    📜 {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
