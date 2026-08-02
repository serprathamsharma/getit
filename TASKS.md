# anti getit - Implementation Task List

This task list tracks the development of the 8 core features for **anti getit**.

---

## 📋 Core Feature Breakdown & Development Tasks

### 1. 📄 AI Resume Intelligence
- [x] **1.1 Resume Parsing & Extraction**
  - [x] Implement file upload handlers for PDF, DOCX, and plain text formats.
  - [x] Build text extraction pipelines and text cleaning pre-processors.
  - [x] Integrate LLM/Parser prompt to extract structured candidate details (skills, work history, education, projects, certifications).
- [x] **1.2 Candidate-to-Job Fit Evaluation**
  - [x] Formulate prompt templates to evaluate parsed resume experience against target job requirements.
  - [x] Compute initial qualification score and candidate overview summary.
- [x] **1.3 UI & Visual Feedback**
  - [x] Create UI component for uploading resumes with upload progress/status.
  - [x] Render structured candidate profiles (skills tag cloud, experience timeline, key projects).


---

### 2. 🎯 Job Description Matching
- [x] **2.1 Role Requirement Parsing**
  - [x] Parse job descriptions into key criteria: required skills, nice-to-haves, experience level, domain knowledge, and responsibilities.
- [x] **2.2 Matching Engine**
  - [x] Build comparison pipeline comparing candidate resume data against job criteria.
  - [x] Calculate overall Match Percentage score.
  - [x] Identify key Candidate Strengths matching required criteria.
  - [x] Identify Critical Gaps and missing prerequisites.
- [x] **2.3 UI & Match Visualization**
  - [x] Build interactive Job Description vs. Resume comparison view.
  - [x] Implement visual match percentage dial/bar chart.
  - [x] Display side-by-side strengths and skill gap breakdown.

---

### 3. 🐙 GitHub Engineering Analysis
- [ ] **3.1 GitHub API & Data Fetching**
  - [ ] Implement GitHub OAuth / Personal Access Token integration.
  - [ ] Fetch public repositories, commit logs, pull requests, code trees, languages, and open-source contributions.
- [ ] **3.2 Static Code & Architecture Analysis**
  - [ ] Analyze repository structure, modularity, and architectural patterns.
  - [ ] Evaluate code quality metrics (linting, doc comments, test coverage, project complexity).
  - [ ] Detect test suites, framework usage, and CI/CD workflows.
- [ ] **3.3 UI & GitHub Dashboard**
  - [ ] Build repository overview widgets (languages breakdown, commit activity heatmap, top repositories).
  - [ ] Display repository quality metrics and architecture highlights.

---

### 4. 🕵️ Project Authenticity Score
- [ ] **4.1 Repository Evolution Analysis**
  - [ ] Analyze commit timestamps, commit messages, and author distribution over time.
  - [ ] Detect suspicious patterns (e.g., single massive initial commit vs. iterative development).
- [ ] **4.2 Code & Refactoring Evidence**
  - [ ] Track refactoring history, diff size distributions, and PR reviews.
  - [ ] Verify originality indicators vs. common starter template clones.
- [ ] **4.3 Authenticity Scoring Engine**
  - [ ] Algorithmically compute the overall **Project Authenticity Score**.
  - [ ] Generate detailed audit logs explaining score factors.
- [ ] **4.4 UI & Authenticity Breakdown**
  - [ ] Create Authenticity Score card with risk/originality badges.
  - [ ] Render commit timeline and provenance indicators.

---

### 5. 🛠️ Engineering Skills Assessment
- [ ] **5.1 Multi-Domain Skill Evaluator**
  - [ ] Define evaluation frameworks across 8 technical domains:
    - [ ] Backend Development
    - [ ] Frontend Development
    - [ ] AI / ML Engineering
    - [ ] DevOps & Infrastructure
    - [ ] System Design & Architecture
    - [ ] Security Practices
    - [ ] Database & Storage
    - [ ] Scalability & Performance
- [ ] **5.2 Skill Rating Calculation**
  - [ ] Aggregate insights from Resume, GitHub code, and project evidence to assign proficiency levels per domain.
- [ ] **5.3 UI & Skill Radar Matrix**
  - [ ] Build interactive Radar/Spider chart visualizing proficiency across the 8 domains.
  - [ ] Provide clickable domain detail cards showcasing supporting code snippets & evidence.

---

### 6. 🎙️ Personalized Interview Generator
- [ ] **6.1 Tailored Question Synthesis**
  - [ ] Combine candidate resume details, GitHub code snippets, and architectural decisions to generate targeted questions.
  - [ ] Create specialized technical questions focused on the candidate's actual codebase, design trade-offs, and frameworks used.
- [ ] **6.2 Question Categorization**
  - [ ] Group questions by category: Conceptual, Code-Deep-Dive, System Design, Trade-Off Rationale, and Problem Solving.
- [ ] **6.3 UI & Interview Plan View**
  - [ ] Display personalized interview questionnaire for interviewers.
  - [ ] Allow filtering, editing, and exporting interview guides (PDF/Markdown).

---

### 7. 🤖 Adaptive Interview Assistant
- [ ] **7.1 Real-Time Candidate Response Processing**
  - [ ] Build real-time response ingestion (text / audio transcript).
  - [ ] Analyze candidate answers for depth, correctness, accuracy, and missing nuances.
- [ ] **7.2 Dynamic Follow-Up Generation**
  - [ ] Synthesize intelligent follow-up questions dynamically based on live candidate answers.
  - [ ] Adjust difficulty dynamically (probe deeper on weak answers, skip redundant topics on strong answers).
- [ ] **7.3 UI & Live Interviewer Dashboard**
  - [ ] Build interactive real-time assistant panel showing live suggested follow-up questions, key points to verify, and hint prompts.

---

### 8. 📊 AI Hiring Recommendation
- [ ] **8.1 Explainable Recommendation Engine**
  - [ ] Synthesize all evaluated signals (Resume fit, Job match %, GitHub analysis, Authenticity score, Skill matrix, Interview performance).
  - [ ] Compute overall Hiring Recommendation (e.g., Strong Hire, Hire, Neutral, No Hire) and Confidence Score.
- [ ] **8.2 Risk & Strength Synthesis**
  - [ ] Summarize top candidate strengths, potential hiring risks, and mitigation strategies.
  - [ ] Generate explainable rationale backing the hiring verdict.
- [ ] **8.3 UI & Executive Hiring Report**
  - [ ] Create clean, printable/exportable Executive Hiring Report card.
  - [ ] Display recommendation status, confidence meter, risk matrix, and detailed summary notes.

---

## 🛠️ Cross-Cutting Technical Setup
- [ ] Environment configuration (.env management for API keys, GitHub Tokens, LLM provider endpoints).
- [ ] API integration testing and latency optimization.
- [ ] Security & Privacy controls (data anonymization, data retention policies).
