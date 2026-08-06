# GetIt

> **AI-Powered Technical Talent Intelligence Platform**  
> Deep candidate profiling, GitHub engineering analysis, job fit evaluation, and tailored interview synthesis — wrapped in a Refined Vintage Gazette design.

---

## Overview

**GetIt** is an AI-driven technical hiring and engineering intelligence platform built to eliminate guess-work in technical recruiting. By combining structured resume parsing, deep GitHub static code analysis, custom job requirement matching, and intelligent technical interview plan generation, GetIt gives engineering leaders and interviewers actionable insights into candidates' true skills and code quality.

---

## Current Features

### 1. AI Resume Intelligence (`Completed`)
- **Multi-Format Ingestion**: Supports PDF, DOCX, and plain text resume uploads with automated text cleaning pipelines.
- **LLM Entity Extraction**: Automatically extracts candidate skills, experience timeline, education, key projects, and certifications into structured JSON.
- **Visual Dossiers**: Renders clean, vintage newspaper-styled candidate profiles with interactive skill tag clouds and timeline controls.

### 2. Job Description Matching (`Completed`)
- **Role Requirement Parsing**: Parses job descriptions into mandatory skills, nice-to-haves, domain prerequisites, and experience targets.
- **Matching Engine**: Calculates precise overall Match Percentage scores, highlighting candidate strengths vs. critical skill gaps.
- **Interactive Match Matrix**: Side-by-side comparison of candidate experience against job requirements.

### 3. GitHub Engineering Analysis (`Completed`)
- **GitHub API Integration**: Analyzes public repositories, commit history, language distribution, pull requests, and activity heatmaps.
- **Static Code Quality Metrics**: Evaluates modularity, test suite presence, linting configs, CI/CD setups, and architectural complexity.
- **Repo Quality Scoring**: Computes overall quality scores (0–100) per repository with breakdown badges.

### 4. Personalized Interview Generator (`Completed`)
- **Tailored Question Synthesis**: Generates targeted technical interview questions based on candidate's actual codebase, resume experience, and technology stack.
- **Categorization**: Groups questions by **Conceptual**, **Code Deep-Dive**, **System Design**, **Trade-off Rationale**, and **Problem Solving**.
- **Interactive Questionnaire UI**: Focus and List views, live rating controls, interviewer notes textarea, category/difficulty filtering, and print/export (.MD) capabilities.

---

## Roadmap / Upcoming Features

### 5. Project Authenticity Score (`In Progress / Planned`)
- **Commit Provenance & Evolution**: Detect single massive initial commits vs. authentic iterative history.
- **Originality Auditing**: Detect starter template clones vs. genuine custom development.
- **Authenticity Scoring Engine**: Algorithmic scoring with detailed risk audit logs.

### 6. Engineering Skills Radar (`Planned`)
- **8-Domain Evaluation Framework**: Automated scoring across Backend, Frontend, AI/ML, DevOps, System Design, Security, Database, and Scalability.
- **Interactive Radar Chart**: Visual spider matrix detailing domain proficiencies backed by repository evidence.

### 7. Real-Time Adaptive Interview Assistant (`Planned`)
- **Live Response Ingestion**: Real-time transcript ingestion (text/audio) during interview sessions.
- **Dynamic Follow-Up Generation**: Synthesizes live follow-up questions and adjusts difficulty on-the-fly based on candidate responses.
- **Interviewer Assistant Dashboard**: Real-time panel with suggested probing hints and key points to verify.

### 8. AI Executive Hiring Recommendation (`Planned`)
- **Synthesized Hiring Verdict**: Unified recommendation (Strong Hire, Hire, Neutral, No Hire) with confidence score meters.
- **Executive Hiring Report**: Exportable summary featuring candidate risk matrix, key strengths, and explainable hiring rationale.

---

## Tech Stack & Architecture

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS (v4), Lucide Icons, Custom Vintage Gazette Design System
- **Backend**: FastAPI (Python 3.11+), Async SQLAlchemy / SQLite (or PostgreSQL), Pydantic v2, Uvicorn
- **AI / LLM Integration**: Anthropic Claude API / OpenAI / Mock LLM fallback for local dev
- **Data Integration**: GitHub REST API v3

---

## Project Structure

```
GetIt/
├── backend/                  # FastAPI Backend API
│   ├── app/
│   │   ├── api/              # API Route Handlers (resumes, jobs, github, interview, etc.)
│   │   ├── core/             # Config & DB Initialization
│   │   ├── models/           # SQLAlchemy DB Models & Pydantic Schemas
│   │   ├── services/         # Business logic (LLM parsers, GitHub fetcher, etc.)
│   │   └── main.py           # FastAPI Entry Point
│   └── requirements.txt
│
├── frontend/                 # Next.js 16 Frontend App
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # UI Components (InterviewPlanView, GitHubDashboard, etc.)
│   │   ├── lib/              # API Client & helper functions
│   │   └── globals.css       # Design System tokens & utilities
│   └── package.json
│
├── SPEC.md                   # Comprehensive Technical Specification
└── TASKS.md                  # Development Roadmap & Task Checklist
```

---

## Quick Start & Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate

# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
*Backend API will run at `http://localhost:8000` (Interactive API docs at `http://localhost:8000/docs`)*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*Frontend application will run at `http://localhost:3000`*

---

## License

Private / Internal Project — All Rights Reserved.
