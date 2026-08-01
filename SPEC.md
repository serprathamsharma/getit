# TalentRadar — AI-Powered Technical Talent Intelligence Platform

## Product Specification & Technical Architecture

---

## 1. Complete Product Architecture

### 1.1 System Overview

The platform consists of **six interconnected subsystems**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                          │
│   Recruiter Dashboard │ Search │ Profile Views │ Insights          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER (FastAPI)                        │
│   REST API │ GraphQL │ Webhooks │ Rate Limiting │ Auth            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  INGESTION      │   │  ANALYSIS       │   │  PROFILE        │
│  SUBSYSTEM      │   │  ENGINE         │   │  SERVICE        │
└─────────────────┘   └─────────────────┘   └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  GitHub API     │   │  AST/Code       │   │  Elasticsearch  │
│  Webhook Worker │   │  Intelligence   │   │  Vector Search  │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### 1.2 Core Architecture Principles

1. **Data-first, not API-first** — The analysis engine is the product. Everything else serves it.
2. **Event-driven** — All GitHub events flow through a message queue (Redis/RabbitMQ) for processing.
3. **Computed profiles** — Engineer profiles are **recomputed** on each analysis, not stored as static snapshots.
4. **Scoring as composition** — Final scores are weighted compositions of 50+ individual signals, not a single heuristic.
5. **Fail-forward** — Even partial analysis yields useful output; don't block on missing data.

### 1.3 Data Flow Architecture

```
GitHub Event (push/PR/star/fork)
         │
         ▼
   ┌──────────┐     ┌─────────────┐     ┌──────────────┐
   │ Webhook  │────▶│  Redis      │────▶│  Worker      │
   │ Ingest   │     │  Queue      │     │  Pipeline    │
   └──────────┘     └─────────────┘     └──────────────┘
                                              │
                    ┌──────────────────────────┼──────────────────────┐
                    ▼                          ▼                      ▼
           ┌─────────────┐            ┌─────────────┐       ┌─────────────┐
           │  Repo       │            │  Code       │       │  Profile    │
           │  Metadata   │            │  Analysis   │       │  Aggregator │
           └─────────────┘            └─────────────┘       └─────────────┘
                    │                          │                      │
                    ▼                          ▼                      ▼
           ┌─────────────┐            ┌─────────────┐       ┌─────────────┐
           │  PostgreSQL │            │  AST Store  │       │  Vector DB  │
           │  (metadata) │            │  (treesitter)       │  (profile)  │
           └─────────────┘            └─────────────┘       └─────────────┘
```

---

## 2. MVP Roadmap

### 2.1 Phase 1: Core Engine (Weeks 1–6)

**Goal:** Prove the analysis works end-to-end.

| Week | Deliverable |
|------|--------------|
| 1–2 | GitHub API ingestion pipeline + webhook handler |
| 3–4 | Repo metadata extraction (languages, stars, forks, commits, PRs, issues) |
| 5–6 | First-pass LLM analysis pipeline — generate sample Engineer Intelligence Profiles |
| 6 | **Milestone:** Analyze 100 GitHub users, manually validate quality |

**Exit criteria:** You can enter a GitHub username and get back a structured profile.

### 2.2 Phase 2: Search & UI (Weeks 7–10)

**Goal:** Make it usable for recruiters.

| Week | Deliverable |
|------|--------------|
| 7–8 | Recruiter-facing Next.js dashboard with search and filters |
| 9 | Profile detail views with score breakdowns |
| 10 | Invite-only beta signup flow + waitlist |
| 10 | **Milestone:** 10 beta recruiters can search and view profiles |

### 2.3 Phase 3: Differentiation & Polish (Weeks 11–16)

**Goal:** Build the features that make it actually useful.

| Week | Deliverable |
|------|--------------|
| 11–12 | Code intelligence layer (AST analysis, complexity metrics, testing detection) |
| 13–14 | LLM prompt refinement — move from generic to specific insights |
| 15–16 | Anti-gaming signals + "confidence scores" |
| 16 | **Milestone:** 50 paying customers or active pilot |

### 2.4 Phase 4: Scale & Moat (Weeks 17–24)

**Goal:** Build defensibility.

| Week | Deliverable |
|------|--------------|
| 17–18 | Vector similarity search — "find engineers like X" |
| 19–20 | Recommendation engine — "engineers who match job req" |
| 21–22 | Team/org analysis — "analyze this engineering team" |
| 23–24 | API for ATS integrations |

---

## 3. AI Pipeline Design

### 3.1 The Core Insight: Multi-Layer Analysis

The key to avoiding generic summaries is **layered analysis**:

```
Layer 1: RAW DATA EXTRACTION
├── GitHub API calls
├── Repo metadata
├── Commit history
├── PR conversations
└── Issue patterns

Layer 2: STRUCTURED METRICS COMPUTATION
├── Code churn (additions/deletions ratio)
├── Commit frequency distribution
├── Language diversity score
├── Testing ratio (test files / source files)
├── Documentation density
├── Dependency management quality
└── CI/CD configuration presence

Layer 3: SEMANTIC ANALYSIS (LLM)
├── Code review quality assessment
├── Architecture pattern recognition
├── Problem domain classification
├── Collaboration tone analysis
└── Technical vocabulary extraction

Layer 4: SYNTHESIS & SCORING
├── Composite expertise profile
├── Archetype classification
├── Strength/weakness mapping
└── Hire recommendation with confidence
```

### 3.2 Why Layered Works

- **Layer 1** is reliable and fast (deterministic API calls)
- **Layer 2** catches gaming attempts (you can't fake commit frequency distribution)
- **Layer 3** provides depth (the "AI" part that competitors lack)
- **Layer 4** produces the deliverable output

### 3.3 LLM Workflow

```python
# Pseudocode for LLM pipeline
def analyze_engineer(github_user):
    repos = fetch_top_repos(github_user, limit=15)

    # Parallel processing — analyze multiple repos concurrently
    repo_analyses = run_in_parallel([
        analyze_single_repo(repo) for repo in repos
    ])

    # Aggregate across repos
    aggregated = aggregate(repo_analyses)

    # LLM synthesis — combine into coherent profile
    profile = llm_synthesize(
        system_prompt=EXPERT_ANALYST_PROMPT,
        user_data=aggregated,
        context={"analyze_for_hiring": true}
    )

    # Confidence scoring — how reliable is this profile?
    confidence = compute_confidence(
        data_quality=aggregated.completeness,
        signal_diversity=aggregated.signal_count,
        temporal_spread=aggregated.activity_spans_years
    )

    return {"profile": profile, "confidence": confidence}
```

### 3.4 Prompt Engineering Strategy

**The secret to non-generic output:** Use **few-shot prompting with labeled examples** of what good vs. great vs. average looks like. The prompt should include:

1. **Output schema** — Exactly what fields to return
2. **Decision criteria** — What distinguishes senior from principal from staff
3. **Negative examples** — "If the profile says 'full-stack developer' without specifics, it's wrong"
4. **Domain-specific vocabulary** — Use the language recruiters actually use

---

## 4. GitHub Data Ingestion Strategy

### 4.1 Data Collection Scope

| Data Type | Collection Method | Refresh Rate |
|-----------|-------------------|---------------|
| Public repos | GitHub REST API | On-demand |
| Commit history | GitHub API (commits endpoint) | Full history |
| PRs opened/merged | GitHub API (search endpoint) | Last 2 years |
| Issues (authored) | GitHub API | Last 2 years |
| Stars given | GitHub API | Last 1 year |
| Followers/following | GitHub API | On-demand |
| Gists | GitHub API | On-demand |
| Organizations | GitHub API | On-demand |
| Contribution graph | GitHub API (contributions) | On-demand |

### 4.2 Rate Limit Strategy

- **Unauthenticated:** 60 requests/hour — too slow
- **Authenticated (personal token):** 5,000 requests/hour — sufficient for MVP
- **GitHub App:** 5,000 requests/hour + 15,000 on installation — target for V2

**MVP approach:** Use personal access tokens for each worker, implement exponential backoff, cache aggressively.

### 4.3 Webhook Architecture

```python
# Webhook handler for real-time updates
@app.post("/webhook/github")
async def handle_github_webhook(payload: dict, event: str):
    if event == "push":
        # Update commit activity metrics
        await update_engineer_activity(payload["sender"]["login"])
    elif event == "pull_request":
        # Recalculate PR quality metrics
        await reAnalyze_PR_quality(payload)
    elif event == "issues":
        # Update issue engagement score
        await update_issue_metrics(payload)
```

### 4.4 Data Normalization

GitHub data is messy. Build a normalization layer:

- **Language mapping:** `JavaScript` → `JavaScript/TypeScript` (include TS implicitly)
- **Repo naming:** Handle deleted/renamed repos gracefully
- **Date parsing:** GitHub returns ISO strings — store as UTC, display in local
- **Content encoding:** Handle non-UTF8 in commit messages (yes, it happens)

---

## 5. Repo Analysis System

### 5.1 Repo Scoring Dimensions

| Dimension | Signals | Weight |
|-----------|---------|--------|
| **Popularity** | stars, forks, watchers | 10% |
| **Activity** | recent commits, issue response time, PR merge rate | 15% |
| **Code Quality** | test coverage, linting, documentation, CI/CD | 20% |
| **Complexity** | file count, directory depth, module coupling, cyclomatic complexity | 20% |
| **Collaboration** | PR review count, issue triage, contribution from external contributors | 15% |
| **Architecture** | dependency management, modular design, API design patterns | 10% |
| **Sustainability** | license, maintainer responsiveness, issue backlog health | 10% |

### 5.2 Per-Repo Analysis Output

```json
{
  "repo_id": "owner/awesome-project",
  "scores": {
    "popularity": 8.5,
    "activity": 7.2,
    "code_quality": 8.1,
    "complexity": 6.8,
    "collaboration": 7.5,
    "architecture": 7.9,
    "sustainability": 6.5
  },
  "insights": [
    "Maintains a well-documented API with OpenAPI specs",
    "Strong testing culture — 78% test coverage across 340 test files",
    "Uses hexagonal architecture with clear domain boundaries",
    "Active in helping contributors — 89% of PRs reviewed within 48 hours"
  ],
  "languages": {
    "Python": 65,
    "TypeScript": 25,
    "Shell": 10
  },
  "domain": "infrastructure/devops",
  "complexity_score": "medium-high"
}
```

---

## 6. AST/Code Intelligence Ideas

### 6.1 Why AST Analysis Matters

Raw metrics lie. AST analysis reveals actual code quality:

- **Testing detection:** Find test files by parsing `_test.py`, `*_test.go`, `spec/` patterns
- **Complexity metrics:** Count function length, nesting depth, cyclomatic complexity via AST
- **Pattern recognition:** Identify design patterns (factory, observer, strategy) in code
- **Security scanning:** Flag dangerous patterns (eval usage, SQL string concat, hardcoded secrets)

### 6.2 Implementation Approach

**Use Tree-sitter** — the fast, multi-language parser used by GitHub's code scanning:

```python
# Example: extract complexity metrics from Python
import tree_sitter_languages
import tree_sitter_python

parser = tree_sitter_languages.get_language("python")

def compute_complexity(source_code: str) -> dict:
    tree = parser.parse(source_code.encode())

    # Walk the AST to compute metrics
    def walk(node):
        metrics = {"functions": 0, "max_depth": 0, "complexity": 0}
        # Recursively walk and compute
        return metrics

    return walk(tree.root)
```

### 6.3 Supported Languages (MVP)

| Priority | Languages | Reasoning |
|----------|-----------|-----------|
| Tier 1 | Python, JavaScript, TypeScript, Go, Rust, Java | Most popular on GitHub |
| Tier 2 | C++, C#, Ruby, PHP | Significant GitHub presence |
| Tier 3 | Scala, Kotlin, Swift, Rust | Emerging/advanced |

---

## 7. LLM Evaluation Workflows

### 7.1 Evaluation Strategy: Three-Stage LLM Processing

```python
STAGE_1_ANALYZER = """
You are a senior engineer reviewing a GitHub profile.
Analyze the raw data and extract structured observations.
Focus on technical accuracy — don't summarize, observe.

Output format: JSON with "observations" array.
"""

STAGE_2_SYNTHESIZER = """
You are a technical recruiting expert.
Given structured observations about an engineer, write a hiring profile.
Use specific technical details. Avoid generic phrases.
Don't say "strong backend skills" — say "built distributed systems using Raft consensus"
"""

STAGE_3_VALIDATOR = """
Review the generated profile for accuracy and specificity.
Flag any claims that lack evidence from the data.
Output: score (0-10), issues array, revision needed (bool).
"""
```

### 7.2 Quality Assurance

- **Random sampling:** Human-review 10% of generated profiles
- **A/B prompt testing:** Run same data through different prompts, pick better output
- **Confidence scoring:** If confidence < 0.6, flag for manual review
- **Pattern injection:** Periodically test with known engineers to verify accuracy

### 7.3 Cost Optimization

- **Use smaller models for structured extraction:** Claude Haiku for Stage 1 (fast, cheap)
- **Use Sonnet for synthesis:** Stage 2 needs more reasoning
- **Use Opus for validation:** Stage 3 needs strongest model
- **Cache aggressively:** If analyzing same repo within 24 hours, reuse prior LLM output

---

## 8. Scoring Systems

### 8.1 Multi-Dimensional Scoring Model

The overall "Talent Score" is a weighted composite:

```
TALENT_SCORE = Σ(signal_weight × normalized_score)

Where signals are:
├── Technical Depth (30%)
│   ├── Architecture sophistication (10%)
│   ├── Code complexity (10%)
│   └── Problem domain difficulty (10%)
├── Output Quality (25%)
│   ├── Repo quality (10%)
│   ├── Project utility (10%)
│   └── Open-source impact (5%)
├── Consistency (20%)
│   ├── Activity span (10%)
│   ├── Commit regularity (5%)
│   └── Sustained contribution (5%)
├── Collaboration (15%)
│   ├── PR review quality (5%)
│   ├── Issue engagement (5%)
│   └── Community involvement (5%)
└── Specialization (10%)
    ├── Domain concentration (5%)
    └── Language/tool depth (5%)
```

### 8.2 Score Normalization

Scores must be comparable across different engineers. Use percentile-based normalization:

- For each signal, rank all engineers in database
- Map raw scores to percentiles (0–99)
- Weighted sum of percentiles = final TALENT_SCORE

### 8.3 Confidence Scoring

Every profile gets a **confidence score** (0–1) based on:

```python
confidence = (
    data_completeness × 0.4 +      # How much data did we analyze?
    signal_diversity × 0.3 +       # Did we analyze multiple languages/repos?
    temporal_spread × 0.2 +        # Is this a 3-month profile or 5-year?
    cross_validation × 0.1         # Do signals agree with each other?
)
```

**Low confidence** profiles show a warning badge — "Analyzed 3 of 15 repos, low activity span."

---

## 9. Database Schema

### 9.1 Core Tables

```sql
-- Engineers (the primary entity)
CREATE TABLE engineers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_username VARCHAR(255) UNIQUE NOT NULL,
    github_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    email VARCHAR(255),
    blog_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_analyzed_at TIMESTAMP,
    profile_confidence FLOAT,
    talent_score FLOAT,
    -- Denormalized for fast queries
    primary_languages JSONB,
    expertise_areas JSONB,
    archetype VARCHAR(100)
);

-- Repositories analyzed per engineer
CREATE TABLE engineer_repos (
    id UUID PRIMARY KEY,
    engineer_id UUID REFERENCES engineers(id),
    repo_full_name VARCHAR(255),
    repo_id INTEGER,
    analysis_data JSONB,          -- Full per-repo analysis
    analyzed_at TIMESTAMP,
    UNIQUE(engineer_id, repo_full_name)
);

-- Raw GitHub data (cached for re-analysis)
CREATE TABLE github_cache (
    id UUID PRIMARY KEY,
    github_type VARCHAR(50),      -- 'repo', 'user', 'commit', 'pr'
    github_id INTEGER,
    data JSONB,
    fetched_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Score components (for filtering/aggregation)
CREATE TABLE score_components (
    engineer_id UUID REFERENCES engineers(id),
    component_name VARCHAR(100),
    raw_score FLOAT,
    normalized_score FLOAT,
    weight FLOAT,
    computed_at TIMESTAMP,
    UNIQUE(engineer_id, component_name)
);

-- Search queries (for analytics)
CREATE TABLE search_queries (
    id UUID PRIMARY KEY,
    recruiter_id UUID,
    filters JSONB,
    results_count INTEGER,
    clicked_profiles JSONB,
    searched_at TIMESTAMP
);
```

### 9.2 Indexes for Performance

```sql
-- Essential for search
CREATE INDEX idx_engineers_talent_score ON engineers(talent_score DESC);
CREATE INDEX idx_engineers_languages ON engineers USING GIN(primary_languages);
CREATE INDEX idx_engineers_expertise ON engineers USING GIN(expertise_areas);
CREATE INDEX idx_engineers_archetype ON engineers(archetype);

-- For time-based queries
CREATE INDEX idx_engineers_updated ON engineers(updated_at DESC);
CREATE INDEX idx_engineers_analyzed ON engineers(last_analyzed_at DESC);
```

### 9.3 Vector Database (for similarity search)

Use **pgvector** (extension to PostgreSQL) or **Qdrant** for embedding-based search:

```sql
-- Store profile embeddings for "find similar engineers"
CREATE TABLE profile_embeddings (
    engineer_id UUID REFERENCES engineers(id),
    embedding vector(1536),  -- Claude embedding dimension
    model_version VARCHAR(50)
);
```

---

## 10. Search & Recommendation Engine

### 10.1 Search Capabilities

| Search Type | Implementation |
|-------------|----------------|
| **Keyword** | PostgreSQL full-text + trigram similarity |
| **Filter-based** | SQL with GIN indexes on JSONB columns |
| **Semantic** | Vector similarity (Qdrant/pgvector) |
| **Boolean** | Elasticsearch if PostgreSQL insufficient |
| **Stack-based** | Array containment queries |

### 10.2 Filter Schema

```json
{
  "languages": ["Python", "Rust"],
  "frameworks": ["React", "FastAPI"],
  "expertise_areas": ["distributed-systems", "machine-learning"],
  "archetype": ["backend-specialist", "full-stack"],
  "talent_score_min": 75,
  "talent_score_max": 100,
  "confidence_min": 0.7,
  "activity_range": {
    "years_active_min": 2,
    "recent_activity_days": 90
  },
  "open_source": {
    "has_oss_contributions": true,
    "stars_received_min": 50
  },
  "engagement_type": ["primary-maintainer", "active-contributor"]
}
```

### 10.3 Recommendation Algorithm

```python
def recommend_engineers(job_requirements: dict, limit: int = 20):
    # 1. Build query vector from job description
    job_embedding = embedding_model.embed(job_requirements["description"])

    # 2. Vector similarity search
    similar = vector_db.search(
        query_vector=job_embedding,
        filters={"confidence_min": 0.7},
        limit=limit
    )

    # 3. Re-rank by score + fresh signal bonus
    reranked = rerank(
        candidates=similar,
        weights={
            "vector_similarity": 0.4,
            "talent_score": 0.4,
            "recency_bonus": 0.1,
            "role_match": 0.1
        }
    )

    return reranked
```

---

## 11. Anti-Gaming Systems

### 11.1 Gaming Vectors & Defenses

| Gaming Attempt | Defense Mechanism |
|----------------|--------------------|
| **Star-farm repositories** | Analyze star-to-fork ratio; detect coordinated starring via temporal patterns |
| **Commit spam** | Measure commit size distribution; flag if 90% of commits are < 10 lines changed |
| **Copy-paste projects** | AST similarity detection across repos; flag identical patterns |
| **Fork-bombing** | Distinguish forks from original work; weight original repos 5x |
| **Keyword stuffing** | LLM evaluates actual skill, not just presence of "Rust" in README |
| **Test-less code** | Detect test files via naming conventions + AST parsing; penalize if < 5% coverage |
| **Bot-generated commits** | Detect auto-commit patterns (e.g., "update 2024-01-15" with consistent formatting) |
| **Issue buying** | Flag suspiciously positive issue conversations; cross-reference with account age |

### 11.2 Behavioral Analysis

```python
# Detect suspicious patterns
def detect_gaming(engineer_data: dict) -> list[str]:
    warnings = []

    if engineer_data["avg_commit_size"] < 15:
        warnings.append("Suspiciously small commits — possible gaming")

    if engineer_data["repo_fork_ratio"] > 0.9:
        warnings.append("High fork ratio — mostly borrowed code")

    if engineer_data["test_coverage"] < 0.05 and engineer_data["primary_language"] in ["Python", "JavaScript"]:
        warnings.append("No tests detected in main language — quality concerns")

    if engineer_data["commit_timestamps"].is_nighttime_only():
        warnings.append("All commits at unusual hours — possible automation")

    return warnings
```

### 11.3 Confidence-Based Trust

- **High-confidence (0.8+):** Multiple signals agree, multi-year activity, original work dominant
- **Medium-confidence (0.5–0.8):** Good data coverage but some gaps
- **Low-confidence (0.0–0.5):** New account, sparse data, recent activity only — show warning

---

## 12. UI/UX Suggestions

### 12.1 Recruiter Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔍 Search Engineers                                    [Login]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Filters    │ │  Results    │ │  Profile    │ │  Compare    │   │
│  │             │ │  (Grid)     │ │  Detail     │ │  (Side)     │   │
│  │ Language    │ │             │ │             │ │             │   │
│  │ Expertise   │ │ ┌─────────┐ │ │ Name: Alex  │ │ □ Engineer A│   │
│  │ Score       │ │ │ Score   │ │ │ Score: 87   │ │ □ Engineer B│   │
│  │ Confidence  │ │ │ 87      │ │ │ Archetype:  │ │ □ Engineer C│   │
│  │             │ │ │         │ │ │ Systems     │ │             │   │
│  └─────────────┘ │ │ Python  │ │ │ Engineer    │ └─────────────┘   │
│                   │ │ Rust    │ │ │             │                  │
│  ┌─────────────┐ │ │ Go      │ │ │ Strengths:  │                  │
│  │ Saved       │ │ └─────────┘ │ │ • Distributed│                 │
│  │ Searches    │ │             │ │ • Event-driven│                 │
│  │             │ │ ┌─────────┐ │ │ • Performance│                  │
│  │ - Backend   │ │ │ Score   │ │ │             │                  │
│  │   Rust      │ │ │ 82      │ │ │ Would Hire:  │                  │
│  │ - ML Eng.   │ │ │         │ │ │ ★★★★☆       │                  │
│  │   Python    │ │ │ TypeScript│ │ │             │                  │
│  └─────────────┘ │ └─────────┘ │ └─────────────┘                  │
│                   └─────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.2 Key UX Principles

1. **Score-first, detail-second** — Recruiters scan scores first, drill into details second
2. **Comparison is key** — Enable side-by-side comparison of 2–5 engineers
3. **Show confidence** — Always display confidence score; low confidence = don't trust blindly
4. **Explain the score** — Click any score component to see why (e.g., "Architecture score: 8.2 — modular design, dependency injection, API versioning")
5. **Don't hide weaknesses** — Show both strengths and growth areas — this builds trust
6. **Export-friendly** — One-click export to PDF/JSON for sharing with hiring managers

### 12.3 Profile Detail View

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back     Alex Chen — Senior Backend Engineer                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  TALENT SCORE: 87/100    Confidence: 0.82                     │ │
│  │  ████████████████████████░░░░░░░░░░░░░░░░░                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  AI SUMMARY ───────────────────────────────────────────────────── │
│  Backend-focused systems engineer with deep distributed systems   │
│  knowledge. Built production-grade event-driven infrastructure   │
│  using Rust and Go. Consistently writes well-tested, documented  │
│  code. Strong on-call culture experience.                         │
│                                                                     │
│  STRENGTHS ──────────────────────────────────────────────────────── │
│  ✓ Event-driven architecture (Kafka, NATS)                        │
│  ✓ Performance optimization (profiling, benchmarking)            │
│  ✓ CI/CD and infrastructure as code (Terraform, K8s)              │
│  ✓ Documentation quality (API docs, ADRs)                        │
│  ✓ Code review thoroughness                                       │
│                                                                     │
│  GROWTH AREAS ────────────────────────────────────────────────────── │
│  △ Limited frontend experience                                    │
│  △ Few technical blog posts / thought leadership                  │
│  △ No management experience visible                               │
│                                                                     │
│  EXPERTISE ──────────────────────────────────────────────────────── │
│  Languages:   [Python 8.5] [Go 7.8] [Rust 7.2] [TypeScript 5.0]  │
│  Frameworks: FastAPI, gRPC, Tokio, Actix, React                   │
│  Domains:    distributed-systems, infrastructure, real-time      │
│                                                                     │
│  WOULD YOU HIRE? ★★★★☆ (Strong Hire)                              │
│  ───────────────────────────────────────────────────────────────── │
│  Solid production engineer. Good fit for backend/systems team.   │
│  Would excel at high-performance service development.            │
│                                                                     │
│  [Download PDF]  [Share Profile]  [Save to List]  [Contact]     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 13. Competitive Analysis

### 13.1 Landscape

| Competitor | What They Do | Why They're Different | Our Advantage |
|------------|--------------|----------------------|----------------|
| **GitHub Profile Search** | Basic search by username | None — just metadata | Actual analysis, not search |
| **Hired.com** | Marketplace with resumes | Employer-focused | Data-driven, not resume-driven |
| **HackerRank/LeetCode** | Skills assessment via tests | Testing for interviews | Real work, not test puzzles |
| **LinkedIn** | Professional network | Connection-based | Talent-first, not network-first |
| **Gitter** (defunct) | GitHub analytics | Used to exist | This is the replacement |
| **GitHub Star Hub** | Star-based ranking | Popularity only | Depth over popularity |
| **Sourcegraph** | Code search | Developer tool | We analyze, they search |

### 13.2 Key Differentiation: "Talent Intelligence, Not GitHub Analytics"

The rest of the market focuses on:

- Repo popularity metrics (stars, forks)
- Activity heatmaps
- Language distribution charts
- Contribution counts

**We focus on:**

- Code quality (via AST analysis)
- Architecture sophistication
- Collaboration patterns
- Technical depth assessment
- Synthesis into hiring recommendations

**The insight:** Recruiters don't care how many stars a repo has — they care if this engineer would be good at their job.

---

## 14. SaaS Pricing Strategy

### 14.1 Pricing Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 5 searches/month, 3 profile views, basic scores |
| **Pro** | $49/mo | 100 searches, 50 profile views, full details, export |
| **Team** | $149/mo | Unlimited searches, team seats (5), saved searches, alerts |
| **Enterprise** | Custom | API access, ATS integration, custom scoring models, SSO |

### 14.2 Revenue Model

- **Annual discount:** 20% off for annual billing
- **Usage-based:** For Team tier, overage at $0.50/search after 1000
- **Seat-based:** Add seats at $29/user for Team tier

### 14.3 Pricing Psychology

- **Free tier is a demo** — not a revenue source, but a conversion funnel
- **Pro is the sweet spot** — $49/month is low-commitment enough for individual recruiters
- **Team is the target** — $149 × 12 × 20 teams = $35K ARR potential from 20 customers
- **Enterprise closes deals** — Custom pricing for large staffing agencies and FAANG recruiters

---

## 15. Scaling Strategy

### 15.1 Technical Scaling

| Challenge | Solution |
|-----------|----------|
| **GitHub rate limits** | Multiple auth tokens, exponential backoff, aggressive caching |
| **LLM cost at scale** | Use Haiku for extraction, Sonnet for synthesis; cache all LLM outputs |
| **Profile computation** | Async workers, background jobs, incremental updates |
| **Search speed** | PostgreSQL + pgvector; pre-computed indexes; denormalized columns |
| **Data storage growth** | TTL on raw data; keep only computed profiles after 30 days |

### 15.2 Data Network Effects

**The moat:** The more engineers you analyze, the better your scoring model becomes:

- More data → better normalization → more accurate scores
- More profiles → better similarity matching
- More queries → better recommendation training

### 15.3 Scaling Roadmap

- **0–1,000 engineers:** Single PostgreSQL instance, in-memory processing
- **1,000–50,000:** Read replicas, background workers (Celery + Redis)
- **50,000–500,000:** Sharded PostgreSQL, dedicated LLM queue, vector DB cluster
- **500,000+:** Multi-region, custom ML model training, real-time streaming

---

## 16. Best Tech Stack

### 16.1 Recommended Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | Next.js 14 (App Router) | React, fast, great DX, SEO-friendly |
| **Styling** | Tailwind CSS | Speed, consistency |
| **API** | FastAPI (Python) | Fast, great async, easy LLM integration |
| **Database** | PostgreSQL + pgvector | Relational + vector search in one |
| **Queue** | Redis + Celery | Simple, reliable, great Python support |
| **LLM** | Anthropic Claude (API) | Best coding analysis, good pricing |
| **Code Analysis** | Tree-sitter | Fast multi-language AST parsing |
| **Hosting** | Vercel (frontend) + Railway/Render (backend) | Fast deploy, reasonable pricing |
| **Auth** | Clerk or NextAuth | Easy, secure, good UI |

### 16.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL                                     │
│   Next.js (Frontend + API Routes)                                │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         RAILWAY                                    │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│   │  FastAPI    │   │   Celery    │   │   Redis     │            │
│   │  (API)      │   │  (Workers)  │   │  (Queue)    │            │
│   └─────────────┘   └─────────────┘   └─────────────┘            │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │             PostgreSQL + pgvector                           │ │
│   └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL APIS                                 │
│   GitHub API    │    Anthropic Claude    │    Tree-sitter          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 17. Making AI Evaluations Genuinely Valuable

### 17.1 The Problem with Generic Summaries

Most AI-generated profiles say:

> "Experienced full-stack developer with expertise in JavaScript, React, and Node.js. Strong communication skills and passion for building scalable applications."

**This is useless because:**

- Says nothing specific about this person
- Could describe 80% of engineers
- Provides no hiring signal

### 17.2 The Solution: Evidence-Based Specificity

**Instead of generic:** "Good code quality"

**Generate specific:** "Writes extensively tested code — found 340 test files across 12 repos with an average test-to-source ratio of 1:2.4. Uses property-based testing in Rust (proptest) and table-driven tests in Go. CI pipeline runs full test suite on every PR with mutation testing enabled."

**Instead of generic:** "Strong backend skills"

**Generate specific:** "Built distributed systems at scale — evidence includes: (1) designed Raft consensus implementation with 300+ GitHub stars, (2) created event-sourced microservices processing 50K+ events/second, (3) contributor to NATS streaming with 12 merged PRs focused on message persistence."

### 17.3 Key Prompts for Specificity

```python
SYSTEM_PROMPT = """
You are an elite technical recruiting analyst.
Your output must be specific, evidence-based, and actionable.

Rules:
1. Every claim must be backed by specific evidence from the data
2. Use exact numbers, not ranges ("12 merged PRs", not "several PRs")
3. Name specific technologies and patterns, not categories
4. Compare to known standards ("test coverage in top 15% of Python repos")
5. Highlight both strengths AND concerns with equal specificity

Output format: JSON with specific fields.
NEVER use generic phrases like "passion for technology" or "team player".
"""
```

### 17.4 Validation: Human-in-the-Loop

- **Calibration set:** Manually create 50 "gold standard" profiles of known engineers
- **Auto-evaluation:** Run generated profiles against gold standards
- **Prompt iteration:** If scores drop below 70% accuracy, iterate on prompt
- **Ongoing:** Random sample 5% of production profiles for human review

---

## 18. Creating a Moat Against Competitors

### 18.1 Sources of Defensibility

| Moat Type | How We Build It |
|-----------|-----------------|
| **Data network effects** | Every engineer analyzed improves scoring model |
| **Analysis sophistication** | AST-based code analysis is hard to replicate quickly |
| **Prompt IP** | Thousands of prompt iterations create unique synthesis logic |
| **Search corpus** | The more engineers we index, the better recommendations |
| **Integration ecosystem** | ATS integrations create switching costs |

### 18.2 The Hardest Thing to Copy

**The LLM prompt stack.** After analyzing 10,000+ engineers and iterating on prompts:

- You know what "good" looks like
- You know which signals correlate with hiring success
- You have a feedback loop: did the engineer get hired? was the profile accurate?

This feedback loop is the ultimate moat — and it takes time.

### 18.3 Competitive Response Strategy

If a big player (LinkedIn, Indeed) enters this space:

- **Go deeper on quality** — We can iterate faster than a large company
- **Go narrower first** — Focus on specific verticals (e.g., "find me Rust engineers for blockchain") before going broad
- **Build community** — Engineers who want to showcase their profile (like a "GitHub GPA") = network effects

---

## 19. Feature Prioritization for Fastest Launch

### 19.1 Must-Have (MVP)

| Priority | Feature | Why |
|----------|---------|-----|
| 1 | Single-user GitHub analysis | Core value — prove it works |
| 2 | Basic score computation | The main deliverable |
| 3 | Simple search (name/language) | Make it usable |
| 4 | Profile detail view | Show the result |
| 5 | Basic confidence scoring | Trust signal |

### 19.2 Should-Have (Beta)

| Priority | Feature | Why |
|----------|---------|-----|
| 6 | Multi-repo analysis | Depth of analysis |
| 7 | LLM-generated summary | The "AI" part |
| 8 | Filtering (language, score) | Better search |
| 9 | Saved searches | Retention |
| 10 | Invite/waitlist system | Controlled growth |

### 19.3 Could-Have (V2)

| Priority | Feature | Why |
|----------|---------|-----|
| 11 | Vector similarity ("similar engineers") | Differentiation |
| 12 | Job-to-candidate matching | Advanced recommendation |
| 13 | Team analysis | Enterprise feature |
| 14 | ATS integration | Sales enablement |
| 15 | API for programmatic access | Platform play |

### 19.4 Won't-Do (First 6 Months)

- Resume parsing (not our lane)
- LinkedIn integration (focus on GitHub first)
- Video interview scheduling (out of scope)
- Salary benchmarking (data risk)
- Real-time GitHub monitoring (expensive, not critical)

---

## 20. Step-by-Step Implementation Plan

### 20.1 Week-by-Week

| Week | Phase | Tasks |
|------|-------|-------|
| 1 | **Setup** | Repo setup, tech stack deployment, PostgreSQL, Redis, basic auth |
| 2 | **Ingestion v1** | GitHub API client, rate limiter, store user + repo metadata |
| 3 | **Analysis v1** | Fetch commits, PRs, issues per repo; compute basic metrics |
| 4 | **LLM v1** | Connect Claude API, write first prompt, test on 20 engineers |
| 5 | **Profile v1** | Generate first complete profile, display in console |
| 6 | **Review** | Manually review 50 profiles, iterate prompt, validate quality |
| 7 | **API + Search** | Build FastAPI, add basic search (PostgreSQL full-text) |
| 8 | **Frontend v1** | Next.js dashboard, search bar, results grid |
| 9 | **Profile UI** | Detail view with scores, summary, confidence badge |
| 10 | **Beta launch** | Invite 10 recruiters, gather feedback |

### 20.2 Key Milestones

- **Day 7:** First engineer analyzed end-to-end
- **Day 30:** 100 engineers analyzed, 10 sample profiles for review
- **Day 60:** Working product, 10 beta users
- **Day 90:** First 5 paying customers OR clear path to product-market fit

---

## 21. Realistic MVP Timeline

| Phase | Duration | End State |
|-------|----------|------------|
| **Core Engine** | 6 weeks | Can analyze any GitHub user → structured profile |
| **Beta Product** | 4 weeks | Usable by 10 recruiters, search works |
| **Iterate to PMF** | 4 weeks | Refine scores, prompts, UI based on feedback |
| **Total to MVP** | **14 weeks** | 10+ paying customers, reliable product |

**Realistic timeline:** 3.5 months from code to revenue.

---

## 22. Team Requirements

### 22.1 MVP Team (2–3 people)

| Role | Responsibilities | Must Have |
|------|------------------|-----------|
| **Tech Lead / Founder** | Full-stack, architecture, LLM integration | 5+ years, Python + React |
| **Backend Engineer** | API, data pipeline, GitHub integration | 3+ years, FastAPI, PostgreSQL |
| **Frontend Engineer** (can be same as tech lead for MVP) | Next.js, dashboard, UX | 3+ years, Tailwind, TypeScript |

### 22.2 Optional Early Hires

| Role | When | Why |
|------|------|-----|
| **ML/LLM Engineer** | After seed | Prompt iteration, scoring model refinement |
| **Designer** | After MVP | Professional UI before scaling |

### 22.3 Skills That Matter

- **GitHub API mastery** — Understanding of rate limits, webhooks, search API
- **LLM prompt engineering** — Critical for product quality
- **AST/code analysis** — Tree-sitter experience helpful but not required
- **Search systems** — Elasticsearch or PostgreSQL full-text experience

---

## 23. Biggest Risks

### 23.1 Technical Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **GitHub API rate limits** | High | Multiple tokens, caching, queue system |
| **LLM cost spirals** | Medium | Aggressive caching, smaller models where possible |
| **Analysis quality inconsistent** | High | Confidence scoring, human review loop |

### 23.2 Business Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Recruiters don't trust AI profiles** | High | Show evidence, confidence scores, human-in-loop |
| **Engineers opt-out of being analyzed** | Medium | Public data only, "claim your profile" opt-in |
| **GitHub changes API/access** | Low | Diversify data sources (GitLab, BitBucket later) |
| **Big player (LinkedIn) builds this** | Medium | Move faster, go deeper, build community |

### 23.3 Execution Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **MVP takes too long** | High | Ruthless scope cutting, 6-week hard deadline |
| **Founding team disagreement** | Medium | Clear roles, weekly syncs, documented decisions |
| **Can't find first customers** | High | Network-based sales, cold outreach to recruiters |

---

## 24. Fastest Path to First Paying Customer

### 24.1 Sales Strategy

1. **Week 1–2:** Identify 20 recruiting contacts (LinkedIn, warm intros)
2. **Week 3:** Send personalized outreach — "I'd love to show you something that finds engineers you'd never find otherwise"
3. **Week 4:** Demo to 5+ prospects, gather feedback
4. **Week 5–6:** Fix critical issues from demos
5. **Week 7:** Offer 3-month free to 5 "champion" users in exchange for feedback
6. **Week 10:** Convert champions to paid — you now have case studies

### 24.2 Customer Targets (Priority Order)

1. **Technical recruiting agencies** — They need differentiation, will pay
2. **Startup founders hiring engineers** — Already on GitHub, high motivation
3. **Enterprise recruiters** — Longer sales cycle but bigger contracts
4. **HR/recruiting platforms** — Potential partnerships/white-label

### 24.3 Pricing for First Customer

- **First 10:** Free (beta) — build trust, get feedback
- **Next 20:** $29/month (introductory) — low barrier to convert
- **After 30:** Full pricing — $49/month

---

## 25. The Single Most Important Feature to Perfect First

### The answer: **Engineer Intelligence Profile synthesis**

Everything else (search, UI, filters, comparison) is secondary. If the profile doesn't provide genuine insight — specific, evidence-based, actionable — nothing else matters.

### What "perfect" means:

1. **Specific, not generic** — Every claim has a specific evidence trail
2. **Confidence-aware** — If data is thin, say so explicitly
3. **Hiring-actionable** — Recruiter reads it and knows what to do next
4. **Hard to game** — Can't be faked with repository stunts

### How to achieve it:

- Start with 50 manually-crafted profiles of engineers you know
- Use these as the evaluation set for LLM output
- Iterate prompt until auto-generation matches manual quality 80% of time
- Then — and only then — ship to customers

**The entire product is the profile. Everything else is delivery.**

---

## Quick Reference

| Item | Value |
|------|-------|
| **MVP Timeline** | 14 weeks to revenue |
| **Team Size** | 2–3 (tech lead + backend + optional frontend) |
| **Tech Stack** | Next.js + FastAPI + PostgreSQL + Claude + Tree-sitter |
| **Initial Cost** | ~$500/month (API calls + hosting) |
| **Revenue Target** | 10 customers by week 14 |
| **Core Moat** | LLM prompt stack + data network effects |
| **Biggest Risk** | Profile quality not meeting recruiter expectations |
| **Single Priority** | Perfect the Engineer Intelligence Profile synthesis |