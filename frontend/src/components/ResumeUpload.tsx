"use client";

import React, { useState, useRef } from "react";
import { ParsedResume, uploadResume } from "@/lib/api";

interface ResumeUploadProps {
  onSuccess: (resume: ParsedResume) => void;
}

export default function ResumeUpload({ onSuccess }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    setIsUploading(true);

    try {
      const result = await uploadResume(file);
      onSuccess(result);
    } catch (err: any) {
      setError(err.message || "Failed to parse resume document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="vintage-box p-7 sm:p-8 shadow-md hover:shadow-lg transition-shadow">
      {/* Box Header */}
      <div className="flex items-start justify-between pb-4 mb-5 border-b-2 border-[#151515]">
        <div>
          <div className="stamp-badge mb-3 block w-max">SECTION B • INTELLIGENCE</div>
          <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-[#151515] leading-snug">
            Submit Candidate Resume
          </h2>
        </div>
        <div className="postage-stamp-icon text-xs font-bold font-typewriter flex-shrink-0 ml-3 mt-1">
          TR
        </div>
      </div>

      <p className="font-body text-base text-[#4A453E] mb-6 leading-relaxed">
        Upload candidate curriculum vitae or dossier (PDF, DOCX, or TXT). The AI Gazette Engine will extract structured skills, work history, and job fit metrics.
      </p>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`coupon-box cursor-pointer text-center transition-all duration-150 ${
          isDragging
            ? "bg-[#EADCBF] border-solid"
            : "hover:bg-[#FAF3E6] bg-[#E9DDC5]"
        }`}
        style={{ padding: "44px 24px" }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-3">
            <div className="w-10 h-10 border-4 border-[#8C241B] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-typewriter text-xs font-bold uppercase tracking-wider text-[#8C241B]">
              [ EXTRACTING DOSSIER TEXT & AI SKILLS... ]
            </p>
            <p className="font-typewriter text-xs text-[#787167]">
              File: {selectedFile?.name}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-full border-2 border-[#151515] bg-[#FAF3E6] flex items-center justify-center text-[#151515] shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="font-typewriter font-bold text-sm text-[#151515] uppercase tracking-wider">
                Click or Drop Resume File Here
              </p>
              <p className="font-typewriter text-xs text-[#787167] mt-2">
                Accepted Formats: PDF • DOCX • TXT (Max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-5 p-3.5 bg-[#8C241B]/10 border-2 border-[#8C241B] text-[#8C241B] font-typewriter text-xs flex items-center space-x-2">
          <span className="font-bold">[ ERROR ]:</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

