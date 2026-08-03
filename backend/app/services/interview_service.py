"""Service for synthesizing personalized technical interview questionnaires."""

import uuid
import logging
from typing import Any
from app.core.config import settings

logger = logging.getLogger(__name__)

# Categories as defined in Feature 6
CATEGORIES = [
    "Conceptual",
    "Code-Deep-Dive",
    "System Design",
    "Trade-Off Rationale",
    "Problem Solving",
]


def generate_interview_questions_fallback(
    github_username: str,
    name: str | None,
    languages: dict[str, Any] | list[str],
    frameworks: list[str],
    repos: list[dict[str, Any]],
    strengths: list[str],
    archetype: str | None = None,
    target_role: str | None = "Senior Software Engineer",
    resume_profile: dict[str, Any] | None = None,
    custom_topics: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Generates structured questions across all 5 categories tailored to candidate profile."""
    username = github_username or "candidate"
    cand_name = name or (resume_profile.get("candidate_name") if resume_profile else None) or username

    # Normalize languages list
    lang_list = list(languages.keys()) if isinstance(languages, dict) else (languages or ["TypeScript", "Python"])
    top_lang = lang_list[0] if lang_list else "Software Engineering"
    second_lang = lang_list[1] if len(lang_list) > 1 else "Database Systems"

    top_repo = repos[0] if repos else {"repo_full_name": f"{username}/core-project", "language": top_lang}
    repo_name = top_repo.get("repo_full_name", f"{username}/main-app") if isinstance(top_repo, dict) else f"{username}/main-app"

    fw_str = ", ".join(frameworks[:3]) if frameworks else f"{top_lang} Ecosystem"

    # Extract details from resume if available
    res_company = "previous tech lead role"
    res_project = "key production architecture"
    if resume_profile:
        work_hist = resume_profile.get("work_history") or []
        if work_hist and isinstance(work_hist, list) and len(work_hist) > 0:
            c_name = work_hist[0].get("company")
            r_name = work_hist[0].get("role")
            if c_name and r_name:
                res_company = f"{r_name} at {c_name}"
            elif c_name:
                res_company = c_name
        projs = resume_profile.get("projects") or []
        if projs and isinstance(projs, list) and len(projs) > 0:
            p_title = projs[0].get("title")
            if p_title:
                res_project = p_title

    questions = [
        # Category 1: Conceptual
        {
            "id": str(uuid.uuid4()),
            "category": "Conceptual",
            "question": f"In your experience with {top_lang}, how do you manage memory lifecycle, concurrency, and async operations under heavy throughput?",
            "context_reference": f"Language: {top_lang} • Primary Stack",
            "ideal_answer": f"The candidate should articulate core {top_lang} primitives, event loop or thread model behavior, garbage collection implications, and how to avoid memory leaks or thread contention.",
            "red_flags": [
                "Vague answers ignoring language-specific concurrency models",
                "Confusing async/await primitives with multi-process execution",
                "Inability to explain memory retention or cleanup strategies"
            ],
            "probing_hints": [
                "Ask how they profile high memory consumption in production",
                "Probe on event-loop blocking or deadlock scenarios"
            ],
            "difficulty": "Medium",
            "estimated_time_mins": 10,
            "is_asked": False,
            "rating": None,
            "user_notes": None,
        },
        {
            "id": str(uuid.uuid4()),
            "category": "Conceptual",
            "question": f"Explain your approach to software architecture and modular design when utilizing frameworks like {fw_str}.",
            "context_reference": f"Frameworks: {fw_str}",
            "ideal_answer": "Candidate should discuss separation of concerns, dependency injection, clean interface boundaries, and strategies to prevent monolithic coupling.",
            "red_flags": [
                "Tight coupling between business logic and framework controllers",
                "Over-engineering simple features without architectural justification"
            ],
            "probing_hints": [
                "How do you enforce boundary discipline across team commits?",
                "What linting or static analysis rules do you mandate?"
            ],
            "difficulty": "Easy",
            "estimated_time_mins": 8,
            "is_asked": False,
            "rating": None,
            "user_notes": None,
        },

        # Category 2: Code-Deep-Dive
        {
            "id": str(uuid.uuid4()),
            "category": "Code-Deep-Dive",
            "question": f"In repository `{repo_name}`, walk us through the internal architecture and key data flow during a request lifecycle.",
            "context_reference": f"Repo: {repo_name} • Architecture",
            "ideal_answer": f"Candidate should clearly explain the entry point of `{repo_name}`, routing/middleware sequence, business layer processing, data persistence, and error handling mechanisms.",
            "red_flags": [
                "Unfamiliarity with their own repository codebase structure",
                "Inability to explain data transformation steps",
                "Lack of error handling or boundary validation"
            ],
            "probing_hints": [
                "Ask why specific directory structures were chosen",
                "Inquire how state transitions are tracked across services"
            ],
            "difficulty": "Hard",
            "estimated_time_mins": 15,
            "is_asked": False,
            "rating": None,
            "user_notes": None,
        },
        {
            "id": str(uuid.uuid4()),
            "category": "Code-Deep-Dive",
            "question": f"During your work on '{res_project}' (or in `{repo_name}`), how did you handle automated testing, CI/CD pipelines, and quality validation?",
            "context_reference": f"Experience: {res_project} • Quality Assurance",
            "ideal_answer": "Candidate should detail unit vs integration testing coverage, mocking strategies for external APIs, and CI pipeline automation triggers.",
            "red_flags": [
                "No automated tests or reliance purely on manual QA",
                "Flaky test setup without isolated mocks"
            ],
            "probing_hints": [
                "What is your target code coverage threshold?",
                "How do you catch regression bugs before production release?"
            ],
            "difficulty": "Medium",
            "estimated_time_mins": 10,
            "is_asked": False,
            "rating": None,
            "user_notes": None,
        },

        # Category 3: System Design
        {
            "id": str(uuid.uuid4()),
            "category": "System Design",
            "question": f"Design a high-availability ingestion engine that processes 100,000 real-time events/sec built with {top_lang} and {second_lang}.",
            "context_reference": f"System Design • High Scale",
            "ideal_answer": "Candidate should detail message broker usage (Kafka/RabbitMQ), partitioning, horizontal consumer scaling, caching layers (Redis), idempotent persistence, and fallback dead-letter queues.",
            "red_flags": [
                "Single point of failure without queue partitioning",
                "Ignoring database write bottlenecks and backpressure",
                "Lack of monitoring, metrics, or alerting design"
            ],
            "probing_hints": [
                "How do you handle out-of-order event streams?",
                "What happens when database connection pools are exhausted?"
            ],
            "difficulty": "Hard",
            "estimated_time_mins": 15,
            "is_asked": False,
            "rating": None,
            "user_notes": None,
        },

        # Category 4: Trade-Off Rationale
        {
            "id": str(uuid.uuid4()),
            "category": "Trade-Off Rationale",
            "question": f"Reflecting on your role as {res_company}, when selecting your primary technology stack ({top_lang} / {fw_str}), what trade-offs did you evaluate vs alternative frameworks?",
            "context_reference": f"Role: {res_company} • Architectural Trade-Offs",
            "ideal_answer": "Candidate should evaluate performance vs developer velocity, ecosystem maturity, community support, maintenance costs, and deployment overhead.",
            "red_flags": [
                "Selecting tools purely due to hype without objective trade-off evaluation",
                "Inability to articulate drawbacks of chosen stack"
            ],
            "probing_hints": [
                "When would you recommend NOT using this technology?",
                "What unexpected friction arose during production scaling?"
            ],
            "difficulty": "Medium",
            "estimated_time_mins": 10,
            "is_asked": False,
            "rating": None,
            "user_notes": None,
        },

        # Category 5: Problem Solving
        {
            "id": str(uuid.uuid4()),
            "category": "Problem Solving",
            "question": f"Describe a scenario in {repo_name} or at {res_company} where a critical production outage occurred due to high latency or memory spikes. How did you diagnose and resolve the root cause?",
            "context_reference": "Incident Response & Troubleshooting",
            "ideal_answer": "Candidate should outline structured debugging: inspecting APM metrics/logs, reproducing locally, profiling memory/cpu, deploying hotfix, and documenting post-mortem.",
            "red_flags": [
                "Random trial-and-error without log or metric inspection",
                "Blaming infrastructure without investigating underlying code contracts"
            ],
            "probing_hints": [
                "What telemetry or alerting metrics alerted you first?",
                "How did you prevent recurrence in subsequent sprints?"
            ],
            "difficulty": "Medium",
            "estimated_time_mins": 12,
            "is_asked": False,
            "rating": None,
            "user_notes": None,
        },
    ]

    # Add custom topic questions if requested
    if custom_topics:
        for topic in custom_topics:
            if topic and topic.strip():
                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Trade-Off Rationale",
                    "question": f"Deep Dive: How do you evaluate and implement {topic.strip()} within your engineering team's architecture?",
                    "context_reference": f"Custom Focus Topic: {topic.strip()}",
                    "ideal_answer": f"Candidate should explain practical experience, design constraints, and best practices regarding {topic.strip()}.",
                    "red_flags": ["Superficial understanding of the topic", "Inability to give concrete usage examples"],
                    "probing_hints": ["Ask for specific design patterns used", "Inquire about production pitfalls"],
                    "difficulty": "Hard",
                    "estimated_time_mins": 10,
                    "is_asked": False,
                    "rating": None,
                    "user_notes": None,
                })

    return questions


def generate_interview_plan(
    github_username: str,
    engineer_profile: dict[str, Any] | None = None,
    resume_profile: dict[str, Any] | None = None,
    target_role: str | None = "Senior Software Engineer",
    custom_topics: list[str] | None = None,
) -> dict[str, Any]:
    """Synthesizes a complete interview questionnaire for a candidate."""
    cand_name = (
        (engineer_profile.get("name") if engineer_profile else None)
        or (resume_profile.get("candidate_name") if resume_profile else None)
        or github_username
    )
    languages = (engineer_profile.get("primary_languages") if engineer_profile else {}) or {}
    frameworks = (engineer_profile.get("frameworks") if engineer_profile else []) or []
    repos = (engineer_profile.get("repos") if engineer_profile else []) or []
    strengths = (engineer_profile.get("strengths") if engineer_profile else []) or []
    archetype = (engineer_profile.get("archetype") if engineer_profile else None)

    questions = generate_interview_questions_fallback(
        github_username=github_username,
        name=cand_name,
        languages=languages,
        frameworks=frameworks,
        repos=repos,
        strengths=strengths,
        archetype=archetype,
        target_role=target_role,
        resume_profile=resume_profile,
        custom_topics=custom_topics,
    )

    overview = (
        f"Customized technical interview plan for {cand_name} targeting {target_role} position. "
        f"Questions focus on candidate's demonstrated experience with {', '.join(list(languages.keys())[:3]) if isinstance(languages, dict) and languages else 'core technologies'}, "
        f"public codebases ({len(repos)} repositories evaluated), and system architectural trade-offs."
    )

    return {
        "id": str(uuid.uuid4()),
        "github_username": github_username,
        "candidate_name": cand_name,
        "overview_summary": overview,
        "recommended_duration_mins": 60,
        "questions": questions,
    }


def export_interview_plan_markdown(plan: dict[str, Any]) -> str:
    """Exports an interview plan to a structured Markdown document."""
    username = plan.get("github_username", "candidate")
    name = plan.get("candidate_name") or username
    summary = plan.get("overview_summary", "")
    duration = plan.get("recommended_duration_mins", 60)
    questions = plan.get("questions", [])

    md_lines = [
        f"# 🎙️ THE TALENT TIMES — OFFICIAL INTERVIEW QUESTIONNAIRE",
        f"**Candidate**: {name} (@{username})  ",
        f"**Recommended Duration**: {duration} Minutes  ",
        f"**Generated Rationale**: {summary}  ",
        "",
        "---",
        "",
        "## 📋 EXECUTIVE INTERVIEW PLAN",
        "",
    ]

    for idx, q in enumerate(questions, start=1):
        cat = q.get("category", "General")
        q_text = q.get("question", "")
        ref = q.get("context_reference", "")
        answer = q.get("ideal_answer", "")
        red_flags = q.get("red_flags", [])
        hints = q.get("probing_hints", [])
        diff = q.get("difficulty", "Medium")
        mins = q.get("estimated_time_mins", 10)

        md_lines.append(f"### Question {idx}: [{cat}] ({diff} • {mins} mins)")
        if ref:
            md_lines.append(f"**Context**: `{ref}`")
        md_lines.append(f"\n> **{q_text}**\n")
        md_lines.append(f"#### 🎯 Ideal Answer Key & Key Points:")
        md_lines.append(f"{answer}\n")

        if red_flags:
            md_lines.append("#### ⚠ Red Flags to Watch For:")
            for rf in red_flags:
                md_lines.append(f"- 🚨 {rf}")
            md_lines.append("")

        if hints:
            md_lines.append("#### 💡 Follow-Up Probing Hints:")
            for h in hints:
                md_lines.append(f"- 🔍 {h}")
            md_lines.append("")

        md_lines.append("---\n")

    md_lines.append("© 2026 THE TALENT GAZETTE • CONFIDENTIAL INTERVIEWER GUIDE")
    return "\n".join(md_lines)
