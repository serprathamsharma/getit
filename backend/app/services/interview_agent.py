"""Personalized Technical Interview Intelligence and Adaptive Interview Assistant Agents."""

import uuid
import logging

logger = logging.getLogger(__name__)


class PersonalizedInterviewAgent:
    """Generates repository-anchored technical interview questions across Easy, Medium, and Hard difficulties."""

    def generate_interview_suite(self, github_data: dict, metrics: dict) -> dict:
        repos = github_data.get("repo_details", [])
        repo_names = [rd.get("repo", {}).get("name", "project") for rd in repos[:3]]
        if not repo_names:
            repo_names = ["core-service", "web-application"]

        top_repo = repo_names[0]
        second_repo = repo_names[1] if len(repo_names) > 1 else top_repo

        langs = list(metrics.get("language_distribution", {}).keys())
        primary_lang = langs[0] if langs else "TypeScript/Python"

        easy_questions = [
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"In your repository '{top_repo}', how did you structure the error handling flow across API calls?",
                "difficulty": "Easy",
                "category": "Debugging",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Centralized exception handling or error boundaries",
                    "HTTP status code mapping",
                    "User-friendly error messages vs logging detail"
                ],
                "rationale": "Assesses foundational code organization and error recovery knowledge from candidate's own code."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"Walk me through the choice of {primary_lang} and key libraries used in '{top_repo}'. What were the main drivers?",
                "difficulty": "Easy",
                "category": "Engineering Decisions",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Ecosystem tooling & type safety benefits",
                    "Performance considerations for target workload",
                    "Team familiarity or speed of prototyping"
                ],
                "rationale": "Verifies technical decision rationale behind tech stack selection."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"How did you organize file structures and module boundaries in '{top_repo}' to keep code maintainable?",
                "difficulty": "Easy",
                "category": "Architecture",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Layered architecture (controllers, services, repositories)",
                    "Separation of concerns and reusable helper modules",
                    "Clean import hierarchy"
                ],
                "rationale": "Evaluates fundamental software organization and code readability."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"What testing tools or unit test patterns did you use in '{top_repo}' to verify correctness?",
                "difficulty": "Easy",
                "category": "Testing",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Test frameworks (pytest, Jest, Vitest, Go test)",
                    "Mocking external API dependencies or database calls",
                    "Automated test execution in local workflow"
                ],
                "rationale": "Tests practical testing discipline and familiarity with test runners."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"How do you handle environment configuration variables (such as API keys or DB URLs) in '{top_repo}' safely?",
                "difficulty": "Easy",
                "category": "Security",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Use of .env files and environment variable injection",
                    "Strict gitignore enforcement to prevent secret leaks",
                    "Config validation on application startup"
                ],
                "rationale": "Probes basic application security hygiene and secret management."
            }
        ]

        medium_questions = [
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"In '{top_repo}', if concurrent user traffic increased by 50x, where would the primary architectural bottlenecks occur and how would you refactor it?",
                "difficulty": "Medium",
                "category": "Scalability",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Database connection pooling and query indexing",
                    "Caching strategy (Redis / edge caching)",
                    "Asynchronous background task queues for heavy operations"
                ],
                "rationale": "Evaluates candidate's system bottleneck analysis and scalability mindset on code they authored."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"How do you handle state synchronization and data consistency between '{top_repo}' and external dependencies?",
                "difficulty": "Medium",
                "category": "Architecture",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Transactional consistency or eventual consistency models",
                    "Idempotency keys for network requests",
                    "Retry mechanisms with exponential backoff"
                ],
                "rationale": "Tests practical architectural understanding of distributed data flow."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"In '{second_repo}', how would you design an automated CI/CD pipeline to build, test, and deploy code changes safely?",
                "difficulty": "Medium",
                "category": "Performance",
                "repo_context": f"Repository: {second_repo}",
                "ideal_answer_points": [
                    "GitHub Actions or CI pipeline matrix steps",
                    "Staging vs production environment isolation",
                    "Zero-downtime rolling deployment strategies"
                ],
                "rationale": "Assesses DevOps integration capability and deployment automation knowledge."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"Describe a complex bug or race condition you encountered in '{top_repo}' and walk through your step-by-step debugging methodology.",
                "difficulty": "Medium",
                "category": "Debugging",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Log inspection and stack trace reproduction",
                    "Isolated unit test creation to isolate the bug",
                    "Root cause fix and regression test prevention"
                ],
                "rationale": "Verifies analytical problem-solving and systematic debugging skill under real scenarios."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"How would you optimize database queries or memory consumption in '{top_repo}' when handling large datasets?",
                "difficulty": "Medium",
                "category": "Engineering Decisions",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Pagination and cursor-based data streaming",
                    "Database index optimization and N+1 query elimination",
                    "In-memory caching and garbage collection awareness"
                ],
                "rationale": "Examines performance profiling and database query optimization knowledge."
            }
        ]

        hard_questions = [
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"Suppose a critical zero-day vulnerability is discovered in one of the core third-party packages used in '{second_repo}'. Describe your step-by-step mitigation, patching, and CI testing strategy.",
                "difficulty": "Hard",
                "category": "Security",
                "repo_context": f"Repository: {second_repo}",
                "ideal_answer_points": [
                    "Dependency auditing tools (npm audit / Dependabot / Snyk)",
                    "Virtual patching / WAF rules if dependency patch is unavailable",
                    "Automated regression testing before emergency production deployment"
                ],
                "rationale": "Probes deep security incident response and production risk management under pressure."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"In '{top_repo}', evaluate the performance trade-offs between your current database query patterns and an event-driven CQRS model. When would you make that shift?",
                "difficulty": "Hard",
                "category": "Trade-offs",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Read vs write workload imbalance triggers",
                    "Operational complexity of dual datastores",
                    "Eventual consistency trade-offs vs synchronous ACID transactions"
                ],
                "rationale": "Examines high-level engineering maturity and architectural trade-off reasoning."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"How would you re-architect '{top_repo}' to support multi-region high availability with active-active database replication and low latency global routing?",
                "difficulty": "Hard",
                "category": "Scalability",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "DNS routing (latency-based / GeoDNS) and Edge CDN caching",
                    "Multi-master DB replication and write conflict resolution",
                    "Circuit breakers and failover mechanisms"
                ],
                "rationale": "Tests staff-level system architecture and global cloud scalability vision."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"If '{second_repo}' experienced an unexpected 99.9th percentile tail latency spike of 4000ms under load, how would you instrument profiling tools to pinpoint the root cause?",
                "difficulty": "Hard",
                "category": "Performance",
                "repo_context": f"Repository: {second_repo}",
                "ideal_answer_points": [
                    "Distributed tracing (OpenTelemetry / Jaeger)",
                    "CPU and memory flamegraphs / heap profiling",
                    "Database lock contention and slow query log analysis"
                ],
                "rationale": "Probes deep system performance diagnostics and distributed tracing experience."
            },
            {
                "id": str(uuid.uuid4())[:8],
                "question": f"Describe your strategy for executing zero-downtime database schema migrations on '{top_repo}' while serving active read/write traffic.",
                "difficulty": "Hard",
                "category": "Architecture",
                "repo_context": f"Repository: {top_repo}",
                "ideal_answer_points": [
                    "Expand and contract migration pattern (dual-writing)",
                    "Backward-compatible API versioning",
                    "Asynchronous data backfill scripts before dropping old columns"
                ],
                "rationale": "Evaluates production database maintenance and risk management expertise."
            }
        ]

        return {
            "easy": easy_questions,
            "medium": medium_questions,
            "hard": hard_questions,
        }


class AdaptiveInterviewAssistant:
    """Evaluates real-time interviewer feedback (Correct / Partially Correct / Incorrect) and generates dynamic follow-ups."""

    def evaluate_response(self, payload: dict) -> dict:
        rating = payload.get("user_response_rating", "correct")
        category = payload.get("category", "Architecture")

        if rating == "correct":
            return {
                "rating": "Correct",
                "follow_up_question": f"Excellent answer on {category}. How would you monitor and alert on this in production?",
                "harder_question": "Pushing further: what happens if the primary database node fails during this process?",
                "easier_question": "Can you summarize the core takeaway in one sentence?",
                "alternative_scenario": "Suppose budget constraints forced serverless architecture instead of dedicated instances?",
                "deeper_architecture_question": "How does your solution scale horizontally across multiple cloud availability zones?",
                "guidance_notes": "Candidate demonstrated clear mastery. Move to harder probe or deeper architecture question."
            }
        elif rating == "partially_correct":
            return {
                "rating": "Partially Correct",
                "follow_up_question": "You hit key points, but what edge cases or race conditions might occur in that setup?",
                "harder_question": "How would you write an automated test to catch this edge case?",
                "easier_question": "What is the single most critical failure point in this system?",
                "alternative_scenario": "What if network latency spiked by 500ms between services?",
                "deeper_architecture_question": "Which trade-off would you prioritize first: latency or strict consistency?",
                "guidance_notes": "Candidate has solid intuition but missed edge case handling."
            }
        else:
            return {
                "rating": "Incorrect",
                "follow_up_question": "Let's step back: walk me through basic request validation and exception handling first.",
                "harder_question": "N/A",
                "easier_question": "What built-in framework utility would help handle this out of the box?",
                "alternative_scenario": "How would you debug this locally?",
                "deeper_architecture_question": "What is the primary role of a connection pool in this architecture?",
                "guidance_notes": "Candidate struggled with the original question. Switch to easier question to test baseline."
            }
