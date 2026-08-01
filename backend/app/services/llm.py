"""LLM service for AI-powered profile synthesis.

Supports both real Anthropic Claude API and a smart mock mode
that generates realistic profiles from computed metrics.
"""

import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Prompt Templates ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are an elite technical recruiting analyst at TalentRadar.
Your output must be specific, evidence-based, and actionable.

Rules:
1. Every claim must be backed by specific evidence from the data
2. Use exact numbers, not ranges ("12 merged PRs", not "several PRs")
3. Name specific technologies and patterns, not categories
4. Compare to known standards when possible
5. Highlight both strengths AND concerns with equal specificity
6. NEVER use generic phrases like "passion for technology" or "team player"
7. Be concise but detailed — recruiters are scanning quickly

Output ONLY valid JSON matching the requested schema. No markdown, no explanation."""

PROFILE_PROMPT = """Analyze the following GitHub engineer data and produce a hiring intelligence profile.

ENGINEER DATA:
{engineer_data}

COMPUTED METRICS:
{metrics}

Return a JSON object with exactly these fields:
{{
  "ai_summary": "2-3 sentence specific summary of this engineer's capabilities, referencing actual projects and technologies",
  "strengths": ["list of 4-6 specific, evidence-based strengths with details"],
  "growth_areas": ["list of 2-4 areas for growth, also specific"],
  "expertise_areas": ["list of 3-6 technical domain keywords like 'distributed-systems', 'machine-learning'"],
  "frameworks": ["list of specific frameworks/tools detected in their repos"],
  "domains": ["list of problem domains they work in"]
}}"""


class LLMService:
    """Handles LLM-powered profile synthesis."""

    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.model = settings.LLM_MODEL
        self._cache: dict[str, dict] = {}

    @property
    def is_available(self) -> bool:
        return bool(self.api_key)

    async def synthesize_profile(self, github_data: dict, metrics: dict, scores: dict) -> dict:
        """Generate an AI-powered profile synthesis."""
        username = github_data.get("user", {}).get("login", "unknown")

        # Check cache
        if username in self._cache:
            logger.info(f"Using cached LLM result for {username}")
            return self._cache[username]

        if self.is_available:
            try:
                result = await self._call_anthropic(github_data, metrics, scores)
                self._cache[username] = result
                return result
            except Exception as e:
                logger.error(f"Anthropic API error: {e}, falling back to mock")

        # Fall back to smart mock
        result = self._generate_mock_profile(github_data, metrics, scores)
        self._cache[username] = result
        return result

    async def _call_anthropic(self, github_data: dict, metrics: dict, scores: dict) -> dict:
        """Call the real Anthropic Claude API."""
        import anthropic

        client = anthropic.Anthropic(api_key=self.api_key)

        # Prepare condensed data for the prompt
        condensed = self._condense_data(github_data, metrics)

        message = client.messages.create(
            model=self.model,
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": PROFILE_PROMPT.format(
                        engineer_data=json.dumps(condensed, indent=2),
                        metrics=json.dumps(metrics, indent=2),
                    ),
                }
            ],
        )

        # Parse JSON response
        response_text = message.content[0].text
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON from the response
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response_text[start:end])
            raise

    def _condense_data(self, github_data: dict, metrics: dict) -> dict:
        """Condense GitHub data to fit in LLM context."""
        user = github_data.get("user", {})
        repos = github_data.get("repo_details", [])

        condensed_repos = []
        for rd in repos[:10]:
            repo = rd.get("repo", {})
            condensed_repos.append({
                "name": repo.get("full_name"),
                "description": repo.get("description"),
                "stars": repo.get("stargazers_count", 0),
                "forks": repo.get("forks_count", 0),
                "language": repo.get("language"),
                "languages": rd.get("languages", {}),
                "is_fork": repo.get("fork", False),
                "topics": repo.get("topics", []),
                "commit_count": len(rd.get("commits", [])),
            })

        return {
            "username": user.get("login"),
            "name": user.get("name"),
            "bio": user.get("bio"),
            "company": user.get("company"),
            "location": user.get("location"),
            "followers": user.get("followers", 0),
            "public_repos": user.get("public_repos", 0),
            "account_created": user.get("created_at"),
            "repos": condensed_repos,
        }

    def _generate_mock_profile(self, github_data: dict, metrics: dict, scores: dict) -> dict:
        """Generate a realistic profile from computed metrics (no LLM needed)."""
        user = github_data.get("user", {})
        username = user.get("login", "engineer")
        name = user.get("name") or username
        archetype = scores.get("archetype", "Full-Stack Developer")

        # Gather repo info for evidence
        repos = github_data.get("repo_details", [])
        top_repos = []
        all_languages = set()
        all_topics = set()
        detected_frameworks = set()

        framework_indicators = {
            "react": "React", "vue": "Vue.js", "angular": "Angular",
            "next": "Next.js", "nuxt": "Nuxt.js", "svelte": "Svelte",
            "fastapi": "FastAPI", "django": "Django", "flask": "Flask",
            "express": "Express.js", "nest": "NestJS", "spring": "Spring",
            "tensorflow": "TensorFlow", "pytorch": "PyTorch", "keras": "Keras",
            "docker": "Docker", "kubernetes": "Kubernetes", "terraform": "Terraform",
            "graphql": "GraphQL", "grpc": "gRPC", "redis": "Redis",
            "postgres": "PostgreSQL", "mongodb": "MongoDB", "elasticsearch": "Elasticsearch",
            "tailwind": "Tailwind CSS", "bootstrap": "Bootstrap",
        }

        for rd in repos:
            repo = rd.get("repo", {})
            repo_name = repo.get("name", "").lower()
            repo_desc = (repo.get("description") or "").lower()
            repo_lang = repo.get("language")
            stars = repo.get("stargazers_count", 0)

            if repo_lang:
                all_languages.add(repo_lang)
            for topic in repo.get("topics", []):
                all_topics.add(topic)

            # Framework detection
            full_text = f"{repo_name} {repo_desc} {' '.join(repo.get('topics', []))}"
            for indicator, framework in framework_indicators.items():
                if indicator in full_text:
                    detected_frameworks.add(framework)

            # Check languages in repo detail
            for lang in rd.get("languages", {}).keys():
                all_languages.add(lang)

            if stars > 0:
                top_repos.append(f"{repo.get('full_name')} ({stars} ★)")

        # Build language list
        lang_dist = metrics.get("language_distribution", {})
        sorted_langs = sorted(lang_dist.items(), key=lambda x: x[1], reverse=True)
        primary_langs = [l[0] for l in sorted_langs[:4]]

        # Determine expertise areas from topics and archetype
        expertise_map = {
            "Backend Systems Engineer": ["backend-systems", "api-design", "server-architecture"],
            "Frontend Engineer": ["frontend-development", "ui-engineering", "web-performance"],
            "Full-Stack Developer": ["full-stack-development", "web-applications"],
            "ML/AI Engineer": ["machine-learning", "data-science", "deep-learning"],
            "DevOps/Infrastructure": ["devops", "cloud-infrastructure", "ci-cd"],
            "Mobile Developer": ["mobile-development", "cross-platform"],
            "Systems Programmer": ["systems-programming", "performance-engineering"],
            "Data Engineer": ["data-engineering", "data-pipelines"],
            "Security Engineer": ["security-engineering", "application-security"],
            "Open Source Maintainer": ["open-source", "community-building"],
        }
        base_expertise = expertise_map.get(archetype, ["software-engineering"])
        expertise_from_topics = [t for t in all_topics if t not in ("", " ")][:3]
        expertise = list(set(base_expertise + expertise_from_topics))[:6]

        # Build summary
        total_stars = metrics.get("total_stars", 0)
        total_repos = metrics.get("total_repos_analyzed", len(repos))
        years = metrics.get("account_age_years", 1)
        lang_str = ", ".join(primary_langs[:3]) if primary_langs else "multiple languages"

        summaries_by_archetype = {
            "Backend Systems Engineer": f"{name} is a backend-focused engineer with {years}+ years of GitHub activity across {total_repos} repositories. Primarily works in {lang_str} with demonstrated experience in server-side architecture and API development. Portfolio includes {total_stars} total stars across original projects.",
            "Frontend Engineer": f"{name} is a frontend specialist with {years}+ years building user-facing applications. Works primarily in {lang_str}, with repos showing modern component-based architecture. Has accumulated {total_stars} stars across {total_repos} public repositories.",
            "Full-Stack Developer": f"{name} is a versatile full-stack developer active for {years}+ years on GitHub. Works across {lang_str} with {total_repos} public repositories spanning both frontend and backend domains. Combined {total_stars} stars on original work.",
            "ML/AI Engineer": f"{name} is an ML/AI engineer with {years}+ years of activity. Primarily uses {lang_str} for data science and machine learning projects across {total_repos} repositories. Has {total_stars} stars reflecting community interest in their ML work.",
            "DevOps/Infrastructure": f"{name} is an infrastructure and DevOps engineer with {years}+ years of contributions. Works in {lang_str} with expertise in deployment automation and cloud infrastructure across {total_repos} repositories.",
        }
        summary = summaries_by_archetype.get(
            archetype,
            f"{name} is a {archetype.lower()} with {years}+ years on GitHub. Works primarily in {lang_str} across {total_repos} repositories with {total_stars} total stars on original projects."
        )

        # Build strengths
        strengths = []
        if len(primary_langs) >= 3:
            strengths.append(f"Polyglot engineer — proficient across {', '.join(primary_langs[:4])}")
        elif primary_langs:
            strengths.append(f"Deep {primary_langs[0]} expertise — primary language across analyzed repositories")

        if total_stars >= 50:
            strengths.append(f"Impactful open-source work — {total_stars} total stars across projects")
        elif total_stars >= 10:
            strengths.append(f"Growing open-source presence — {total_stars} stars across repositories")

        if metrics.get("test_ratio", 0) > 0.1:
            strengths.append(f"Strong testing culture — test files detected in {metrics.get('test_ratio', 0)*100:.0f}% of analyzed repos")

        if metrics.get("has_ci_cd", False):
            strengths.append("CI/CD awareness — pipeline configurations found in repositories")

        if metrics.get("has_docs", False):
            strengths.append("Documentation-conscious — README and docs present across projects")

        if years >= 4:
            strengths.append(f"Long-term commitment — {years} years of sustained GitHub activity")

        if detected_frameworks:
            fw_str = ", ".join(sorted(detected_frameworks)[:4])
            strengths.append(f"Modern toolchain — uses {fw_str}")

        # Ensure at least 3 strengths
        while len(strengths) < 3:
            strengths.append(f"Active contributor with {metrics.get('total_commits', 0)}+ commits across analyzed repos")

        # Build growth areas
        growth = []
        if metrics.get("test_ratio", 0) < 0.05:
            growth.append("Limited test coverage detected — consider adding more automated tests")
        if not metrics.get("has_docs", False):
            growth.append("Minimal documentation — adding READMEs and inline docs would strengthen profile")
        if metrics.get("language_count", 0) < 2:
            growth.append("Single-language focus — expanding to complementary languages could broaden opportunities")
        if user.get("blog") in (None, ""):
            growth.append("No blog or writing presence — technical writing could enhance visibility")
        if user.get("followers", 0) < 10:
            growth.append("Limited community engagement — contributing to other projects would build network")

        if not growth:
            growth = ["Profile data limited — more public contributions would improve analysis accuracy"]

        # Frameworks and domains
        domains = _infer_domains(repos, all_topics, archetype)

        return {
            "ai_summary": summary,
            "strengths": strengths[:6],
            "growth_areas": growth[:4],
            "expertise_areas": expertise,
            "frameworks": sorted(detected_frameworks)[:8] if detected_frameworks else ["Not detected"],
            "domains": domains,
        }


def _infer_domains(repos: list, topics: set, archetype: str) -> list[str]:
    """Infer problem domains from repo metadata."""
    domain_keywords = {
        "web-development": ["web", "website", "frontend", "html", "css"],
        "api-services": ["api", "rest", "graphql", "service", "server"],
        "data-science": ["data", "analytics", "visualization", "pandas", "numpy"],
        "machine-learning": ["ml", "ai", "machine-learning", "deep-learning", "model"],
        "devops": ["docker", "kubernetes", "terraform", "ci", "deploy", "infrastructure"],
        "mobile": ["ios", "android", "mobile", "flutter", "react-native"],
        "database": ["database", "sql", "nosql", "postgres", "mongo"],
        "security": ["security", "auth", "crypto", "encryption"],
        "developer-tools": ["cli", "tool", "plugin", "extension", "sdk", "library"],
        "real-time": ["realtime", "websocket", "streaming", "chat"],
    }

    all_text = " ".join(
        f"{rd.get('repo', {}).get('name', '')} {rd.get('repo', {}).get('description', '')}"
        for rd in repos
    ).lower()
    all_text += " " + " ".join(topics)

    found = []
    for domain, keywords in domain_keywords.items():
        if any(kw in all_text for kw in keywords):
            found.append(domain)

    return found[:5] if found else ["general-software-engineering"]


# Singleton
llm_service = LLMService()
