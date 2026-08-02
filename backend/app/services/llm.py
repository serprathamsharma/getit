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

RESUME_PARSE_PROMPT = """Extract structured candidate information from the following resume text.

RESUME TEXT:
{resume_text}

Return a JSON object with exactly these fields:
{{
  "candidate_name": "Full Name or null",
  "github_username": "GitHub username or handle (e.g. 'johndoe' if github.com/johndoe is present) or null",
  "email": "Email address or null",
  "phone": "Phone number or null",
  "experience_years": 0.0,
  "skills": ["list of technical and professional skills"],
  "work_history": [
    {{
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Dates worked (e.g., Jan 2021 - Present)",
      "description": "Short summary of role",
      "highlights": ["Key achievements/responsibilities"]
    }}
  ],
  "education": [
    {{
      "institution": "University/College",
      "degree": "Degree and Major",
      "year": "Graduation year or dates"
    }}
  ],
  "projects": [
    {{
      "title": "Project Name",
      "description": "Project summary",
      "technologies": ["Tech used"]
    }}
  ],
  "certifications": ["List of certifications or null"]
}}"""

JOB_FIT_PROMPT = """Evaluate candidate fit by comparing the candidate's resume data against the job description.

PARSED CANDIDATE RESUME DATA:
{parsed_resume}

JOB DESCRIPTION:
{job_description}

CRITICAL EVALUATION & SCORING RULES:
1. Assess domain and technical alignment objectively. If the candidate's background is in a completely different field (e.g. Civil Engineering, Construction, Accounting) and the job requires Software Engineering (Full Stack, React, Node, Python, etc.), the match_percentage MUST be LOW (between 5.0% and 25.0%), the verdict MUST be "Weak" or "Mismatch", and qualification_score MUST be low (1.0 to 2.5).
2. Do NOT give artificial scores above 50% to candidates who lack the core technical competencies or prerequisites of the target job role.
3. Be specific in listing missing prerequisites and skill gaps.

Return a JSON object with exactly these fields:
{{
  "match_percentage": 85.0,
  "qualification_score": 8.5,
  "verdict": "Excellent | Strong | Moderate | Weak | Mismatch",
  "fit_summary": "2-3 sentences evaluating why candidate is or isn't a strong fit",
  "key_strengths": ["List of 3-5 specific matching strengths"],
  "skill_gaps": ["List of 2-4 skill or experience gaps"],
  "missing_prerequisites": ["List of critical missing requirements or empty list"],
  "recommendation": "Specific hiring decision advice"
}}"""

JD_PARSE_PROMPT = """Analyze and parse the following job description into structured role criteria.

JOB DESCRIPTION:
{job_description}

Return a JSON object with exactly these fields:
{{
  "role_title": "Extracted Role Title (e.g. Senior Full Stack Engineer, Civil Project Manager)",
  "required_skills": ["List of mandatory technical or domain skills"],
  "nice_to_have_skills": ["List of preferred / nice-to-have skills"],
  "experience_years_required": 5.0,
  "experience_level": "Junior | Mid-Level | Senior | Staff | Lead",
  "domain_knowledge": ["List of key domain topics, e.g. Web Development, Cloud Systems, Civil Construction"],
  "key_responsibilities": ["List of main job responsibilities"],
  "education_requirements": "Education requirement or degree specified or null"
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

    async def extract_resume_data(self, resume_text: str) -> dict:
        """Extract structured details from resume text."""
        if self.is_available:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=self.api_key)
                message = client.messages.create(
                    model=self.model,
                    max_tokens=2500,
                    system=SYSTEM_PROMPT,
                    messages=[{
                        "role": "user",
                        "content": RESUME_PARSE_PROMPT.format(resume_text=resume_text[:12000])
                    }]
                )
                response_text = message.content[0].text.strip()
                if response_text.startswith("```"):
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                return json.loads(response_text)
            except Exception as e:
                logger.error(f"Error extracting resume data with Anthropic API: {e}")

        # Smart fallback parser if API is unconfigured or fails
        return self._generate_mock_resume_data(resume_text)

    async def evaluate_candidate_job_fit(self, parsed_resume: dict, job_description: str) -> dict:
        """Evaluate candidate resume against a job description."""
        if self.is_available:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=self.api_key)
                message = client.messages.create(
                    model=self.model,
                    max_tokens=2000,
                    system=SYSTEM_PROMPT,
                    messages=[{
                        "role": "user",
                        "content": JOB_FIT_PROMPT.format(
                            parsed_resume=json.dumps(parsed_resume, indent=2),
                            job_description=job_description[:8000]
                        )
                    }]
                )
                response_text = message.content[0].text.strip()
                if response_text.startswith("```"):
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                return json.loads(response_text)
            except Exception as e:
                logger.error(f"Error evaluating job fit with Anthropic API: {e}")

        # Smart fallback evaluator
        return self._generate_mock_job_fit(parsed_resume, job_description)

    async def parse_job_description(self, job_description: str) -> dict:
        """Parse raw job description into structured role requirements and criteria."""
        if self.is_available:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=self.api_key)
                message = client.messages.create(
                    model=self.model,
                    max_tokens=2000,
                    system=SYSTEM_PROMPT,
                    messages=[{
                        "role": "user",
                        "content": JD_PARSE_PROMPT.format(
                            job_description=job_description[:8000]
                        )
                    }]
                )
                response_text = message.content[0].text.strip()
                if response_text.startswith("```"):
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                return json.loads(response_text)
            except Exception as e:
                logger.error(f"Error parsing job description with Anthropic API: {e}")

        # Smart fallback JD parser
        return self._generate_mock_parsed_jd(job_description)

    def _generate_mock_parsed_jd(self, job_description: str) -> dict:
        """Extract structured role criteria from job description using regex and heuristics."""
        import re

        jd_lower = job_description.lower()
        lines = [line.strip() for line in job_description.splitlines() if line.strip()]

        # 1. Role Title
        role_title = None
        for line in lines[:5]:
            if re.search(r"\b(engineer|developer|architect|manager|lead|specialist|analyst|consultant|designer)\b", line, re.I):
                role_title = re.sub(r"^(job description|position|role|title)\s*:?\s*", "", line, flags=re.I).strip()
                break
        if not role_title and lines:
            role_title = lines[0] if len(lines[0]) < 60 else "Software / Technical Engineer"

        # 2. Experience Years Required
        exp_match = re.search(r"(\d+)\+?\s*years?(?:\s+of)?\s+(?:experience|practical|work)", jd_lower)
        experience_years_required = float(exp_match.group(1)) if exp_match else 3.0

        # 3. Experience Level
        if any(kw in jd_lower for kw in ["lead", "principal", "staff"]):
            experience_level = "Lead"
        elif any(kw in jd_lower for kw in ["senior", "sr.", "5+ years", "6+ years", "7+ years"]):
            experience_level = "Senior"
        elif any(kw in jd_lower for kw in ["junior", "jr.", "entry"]):
            experience_level = "Junior"
        else:
            experience_level = "Mid-Level"

        # 4. Known Technical & Domain Skills
        known_skills = [
            "Python", "TypeScript", "JavaScript", "React", "Next.js", "Vue.js", "Angular",
            "Node.js", "Express", "FastAPI", "Django", "Flask", "Java", "Spring Boot",
            "C++", "C#", ".NET", "Go", "Rust", "SQL", "PostgreSQL", "MySQL", "MongoDB",
            "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Git", "GitHub",
            "CI/CD", "Tailwind CSS", "HTML", "CSS", "REST API", "GraphQL", "PyTorch",
            "TensorFlow", "System Architecture", "Linux", "Civil Engineering", "Construction",
            "AutoCAD", "Revit", "Billing", "Site Management", "Reconciliation"
        ]

        found_skills = []
        for skill in known_skills:
            if re.search(r"\b" + re.escape(skill) + r"\b", job_description, re.I):
                found_skills.append(skill)

        # Split into required vs nice-to-have
        required_skills = found_skills[:8] if found_skills else ["General Technical Engineering", "Problem Solving"]
        nice_to_have_skills = found_skills[8:14] if len(found_skills) > 8 else ["Agile Methodology", "Cross-functional Collaboration"]

        # 5. Domain Knowledge
        domain_knowledge = []
        if any(kw in jd_lower for kw in ["web", "frontend", "backend", "full stack"]):
            domain_knowledge.append("Web Application Engineering")
        if any(kw in jd_lower for kw in ["cloud", "aws", "gcp", "azure", "docker", "kubernetes"]):
            domain_knowledge.append("Cloud & DevOps Infrastructure")
        if any(kw in jd_lower for kw in ["database", "sql", "postgres", "nosql"]):
            domain_knowledge.append("Database & Data Architecture")
        if any(kw in jd_lower for kw in ["civil", "construction", "site", "building"]):
            domain_knowledge.append("Civil Infrastructure & Construction Management")
        if not domain_knowledge:
            domain_knowledge = ["Software Systems Engineering"]

        # 6. Key Responsibilities
        key_responsibilities = []
        for line in lines:
            if line.startswith(("•", "-", "*", "▪")) and len(line) > 15:
                cleaned_resp = line.lstrip("•-*▪ ").strip()
                if len(cleaned_resp) < 120:
                    key_responsibilities.append(cleaned_resp)
        if not key_responsibilities:
            key_responsibilities = [
                f"Design, develop, and deliver high quality solutions for the {role_title} role",
                "Collaborate with cross-functional teams to drive technical excellence",
                "Ensure adherence to project timelines, quality standards, and architectural best practices"
            ]

        # 7. Education Requirements
        education_requirements = None
        edu_match = re.search(r"(?:bachelor|master|degree|b\.tech|b\.e\.|bs|ms|diploma)[^\n\.]*", jd_lower)
        if edu_match:
            education_requirements = edu_match.group(0).title()
        else:
            education_requirements = "Bachelor's Degree in relevant engineering discipline or equivalent experience"

        return {
            "role_title": role_title,
            "required_skills": required_skills,
            "nice_to_have_skills": nice_to_have_skills,
            "experience_years_required": experience_years_required,
            "experience_level": experience_level,
            "domain_knowledge": domain_knowledge,
            "key_responsibilities": key_responsibilities[:6],
            "education_requirements": education_requirements,
        }

    def _generate_mock_resume_data(self, text: str) -> dict:
        """Extract structured details from resume text using regex and section heuristics."""
        import re

        lines = [line.strip() for line in text.splitlines() if line.strip()]

        # 1. Candidate Name Extraction
        candidate_name = None
        for line in lines[:8]:
            if "@" in line or "http" in line or "www." in line or "github" in line:
                continue
            if re.search(r"\b(resume|curriculum|vitae|cv|page|email|phone|contact)\b", line, re.I):
                continue
            cleaned = re.sub(r"[^\w\s\.-]", "", line).strip()
            if 2 <= len(cleaned.split()) <= 5 and len(cleaned) < 50:
                candidate_name = cleaned
                break
        if not candidate_name and lines:
            candidate_name = lines[0] if len(lines[0]) < 50 else "Candidate"

        # 2. Email & Phone Extraction
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        email = email_match.group(0) if email_match else None

        phone_match = re.search(r"\(?\+?\d{1,3}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}", text)
        phone = phone_match.group(0) if phone_match else None

        # 3. GitHub Username Extraction
        github_username = None
        gh_match = re.search(r"github\.com/([a-zA-Z0-9_\-\.]+)", text, re.I)
        if gh_match:
            raw_gh = gh_match.group(1).rstrip("/.")
            if raw_gh.lower() not in ("about", "features", "explore", "topics", "trending", "pricing", "login", "signup"):
                github_username = raw_gh
        if not github_username:
            gh_text_match = re.search(r"github:\s*@?([a-zA-Z0-9_\-\.]+)", text, re.I)
            if gh_text_match:
                github_username = gh_text_match.group(1).rstrip("/.")

        # 4. Skills Extraction
        known_skills = [
            "Python", "TypeScript", "JavaScript", "React", "Next.js", "Vue.js", "Angular",
            "Node.js", "Express", "FastAPI", "Django", "Flask", "Java", "Spring Boot",
            "C++", "C#", ".NET", "Go", "Rust", "SQL", "PostgreSQL", "MySQL", "MongoDB",
            "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Git", "GitHub",
            "CI/CD", "Tailwind CSS", "HTML", "CSS", "REST API", "GraphQL", "PyTorch",
            "TensorFlow", "Pandas", "NumPy", "Scikit-Learn", "Microservices", "System Architecture",
            "Agile", "Linux", "Bash", "Redux", "Webpack", "Vite", "Kafka", "Elasticsearch"
        ]
        found_skills = set()
        for skill in known_skills:
            if re.search(r"\b" + re.escape(skill) + r"\b", text, re.I):
                found_skills.add(skill)

        # Look for explicit SKILLS section
        skills_section_match = re.search(r"(?:skills|technical skills|technologies)\s*:?\s*\n+((?:[^\n]+\n?){1,8})", text, re.I)
        if skills_section_match:
            raw_skills_text = skills_section_match.group(1)
            for chunk in re.split(r"[,;•|/\n]", raw_skills_text):
                cleaned_item = chunk.strip(" -▪•*")
                if 2 <= len(cleaned_item) <= 30 and not re.search(r"(experience|education|projects|summary)", cleaned_item, re.I):
                    found_skills.add(cleaned_item)

        skills_list = sorted(list(found_skills)) if found_skills else ["Software Development", "Problem Solving", "System Architecture"]

        # 5. Work History Section Parsing
        work_history = []
        exp_header = None
        for m in re.finditer(r"(?:^|\n)\s*(?:work\s+experience|professional\s+experience|employment\s+history|work\s+history|career\s+history|employment|experience)\s*(?:\n|:|$)", text, re.I):
            exp_header = m
            if m.group(0).strip().isupper() or m.group(0).startswith("\n"):
                break

        if exp_header:
            start_idx = exp_header.end()
            # Standalone main section header regex (must be on its own line)
            next_sec = re.search(r"\n\s*(?:PROJECTS|TECHNICAL SKILLS|CERTIFICATIONS|EDUCATION|ACADEMICS|KEY CAREER ACHIEVEMENTS)\s*(?:\n|$)", text[start_idx:])
            if not next_sec:
                next_sec = re.search(r"\n\s*(?:projects|technical skills|certifications|education|academics)\s*\n", text[start_idx:], re.I)
            
            end_idx = start_idx + next_sec.start() if next_sec else len(text)
            exp_text = text[start_idx:end_idx].strip()

            exp_lines = [l.strip() for l in exp_text.splitlines() if l.strip()]
            current_job = None
            
            for line in exp_lines:
                if re.match(r"^(work\s+experience|professional\s+experience|experience|employment|work\s+history|summary)$", line, re.I):
                    continue

                # Match date range or standalone year
                date_match = re.search(r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b[\w\s–\-\/\.,]*\b(?:Present|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\b|\b(\d{4}[–\-]\d{4}|\b20\d{2}\b|\b19\d{2}\b)", line, re.I)
                is_bullet = line.startswith(("-", "•", "*", "▪"))
                
                # Check if this line is a bullet or description vs job header
                is_descriptive_sentence = any(line.lower().startswith(kw) for kw in ["delivering", "managing", "responsible for", "proven expertise", "high-end", "valued up to", "key projects:"])
                
                if (date_match or (current_job is None and len(line) < 90 and not is_bullet and not is_descriptive_sentence and not line.lower().startswith("skills") and not line.lower().startswith("summary"))):
                    if current_job and (current_job.get("company") or current_job.get("role")):
                        work_history.append(current_job)
                    
                    matched_date_str = date_match.group(0).strip() if date_match else "Dates per document"
                    clean_line = re.sub(r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b[\w\s–\-\/\.,]*\b(?:Present|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\b|\b(\d{4}[–\-]\d{4}|\b20\d{2}\b|\b19\d{2}\b)", "", line, flags=re.I).strip(" |-–,.")
                    
                    role_str = clean_line if clean_line else "Engineering Professional"
                    company_str = ""
                    
                    if "|" in clean_line:
                        parts = [p.strip() for p in clean_line.split("|") if p.strip()]
                        role_str = parts[0]
                        company_str = parts[1] if len(parts) > 1 else ""
                    elif " at " in clean_line.lower():
                        parts = re.split(r"\s+at\s+", clean_line, flags=re.I)
                        role_str = parts[0].strip()
                        company_str = parts[1].strip() if len(parts) > 1 else ""

                    role_str = re.sub(r"^(?:in|experience in|delivering|with|working as|responsible for|proven|expertise in)\s+", "", role_str, flags=re.I).strip(" ,.-:;")
                    if role_str:
                        role_str = role_str[0].upper() + role_str[1:]
                    
                    current_job = {
                        "company": company_str,
                        "role": role_str if role_str and len(role_str) < 65 else "Senior Project Lead",
                        "duration": matched_date_str,
                        "description": "",
                        "highlights": []
                    }
                elif current_job:
                    if not current_job["company"] and not is_bullet and len(line) < 80 and not line.lower().startswith("key projects") and not is_descriptive_sentence:
                        current_job["company"] = line
                    elif is_bullet or is_descriptive_sentence:
                        current_job["highlights"].append(line.lstrip("▪•*- ").strip())
                    elif not current_job["description"]:
                        current_job["description"] = line
                    else:
                        current_job["highlights"].append(line.lstrip("▪•*- ").strip())
            
            if current_job and (current_job.get("company") or current_job.get("role")):
                work_history.append(current_job)
            elif not work_history and exp_lines:
                # Fallback if no dates or clear structure matched
                first_line = exp_lines[0]
                role = re.sub(r"^(?:in|experience in|delivering|with)\s+", "", first_line, flags=re.I).strip(" ,.-:;")
                work_history.append({
                    "company": "Project & Operations",
                    "role": role[0].upper() + role[1:] if role and len(role) < 60 else "Senior Project Lead",
                    "duration": "Dates per document",
                    "description": exp_lines[1] if len(exp_lines) > 1 else first_line,
                    "highlights": exp_lines[2:6] if len(exp_lines) > 2 else []
                })

        # 6. Education Section Parsing
        education = []
        edu_header = re.search(r"\b(education|academic\s+background|qualifications)\b", text, re.I)
        if edu_header:
            start_idx = edu_header.end()
            next_sec = re.search(r"\b(projects|certifications|skills|experience)\b", text[start_idx:], re.I)
            end_idx = start_idx + next_sec.start() if next_sec else len(text)
            edu_text = text[start_idx:end_idx].strip()
            edu_lines = [l.strip() for l in edu_text.splitlines() if l.strip()]
            
            for i in range(0, min(len(edu_lines), 6), 2):
                degree_line = edu_lines[i]
                school_line = edu_lines[i+1] if i+1 < len(edu_lines) else ""
                year_match = re.search(r"\b(20\d{2}|19\d{2})\b", degree_line + " " + school_line)
                year_str = year_match.group(0) if year_match else None
                education.append({
                    "degree": degree_line,
                    "institution": school_line if school_line else "University / Institution",
                    "year": year_str
                })

        # 7. Projects Section Parsing
        projects = []
        proj_header = re.search(r"\b(projects|key\s+projects|personal\s+projects)\b", text, re.I)
        if proj_header:
            start_idx = proj_header.end()
            next_sec = re.search(r"\b(education|certifications|skills|experience)\b", text[start_idx:], re.I)
            end_idx = start_idx + next_sec.start() if next_sec else len(text)
            proj_text = text[start_idx:end_idx].strip()
            proj_blocks = [b.strip() for b in proj_text.split("\n\n") if b.strip()]
            
            for b in proj_blocks[:3]:
                b_lines = [l.strip() for l in b.splitlines() if l.strip()]
                if b_lines:
                    title = b_lines[0]
                    if len(title) > 60:
                        title = title[:57] + "..."
                    desc = " ".join(b_lines[1:]) if len(b_lines) > 1 else b_lines[0]
                    proj_tech = [s for s in skills_list if re.search(r"\b" + re.escape(s) + r"\b", b, re.I)]
                    projects.append({
                        "title": title,
                        "description": desc,
                        "technologies": proj_tech
                    })

        # 8. Certifications Section Parsing
        certifications = []
        cert_header = re.search(r"\b(certifications|credentials|licenses)\b", text, re.I)
        if cert_header:
            start_idx = cert_header.end()
            next_sec = re.search(r"\b(education|projects|skills|experience)\b", text[start_idx:], re.I)
            end_idx = start_idx + next_sec.start() if next_sec else len(text)
            cert_text = text[start_idx:end_idx].strip()
            cert_lines = [l.lstrip("▪•*- ").strip() for l in cert_text.splitlines() if l.strip()]
            # Filter out random sentences or all-caps header fragments
            filtered_certs = []
            for cl in cert_lines:
                if len(cl) > 4 and len(cl) < 70 and not cl.startswith("AND ") and not cl.startswith("ENSURED "):
                    filtered_certs.append(cl)
            certifications = filtered_certs[:5]

        # 9. Experience Years Calculation
        years_found = [int(y) for y in re.findall(r"\b(20\d{2}|19\d{2})\b", text)]
        if years_found and len(years_found) >= 2:
            exp_years = float(max(1, max(years_found) - min(years_found)))
        else:
            exp_years = 3.5

        return {
            "candidate_name": candidate_name,
            "github_username": github_username,
            "email": email,
            "phone": phone,
            "experience_years": exp_years,
            "skills": skills_list,
            "work_history": work_history,
            "education": education,
            "projects": projects,
            "certifications": certifications
        }

    def _generate_mock_job_fit(self, parsed_resume: dict, job_description: str) -> dict:
        """Generate accurate candidate-to-job fit evaluation based on deep skill and domain overlap."""
        import re

        jd_lower = job_description.lower()

        # Extract all text from candidate profile
        candidate_text_parts = []

        # 1. Skills
        candidate_skills = [s.strip() for s in parsed_resume.get("skills", []) if s.strip()]
        candidate_text_parts.extend(candidate_skills)

        # 2. Work History
        for job in parsed_resume.get("work_history", []):
            candidate_text_parts.append(job.get("role", ""))
            candidate_text_parts.append(job.get("company", ""))
            candidate_text_parts.append(job.get("description", ""))
            candidate_text_parts.extend(job.get("highlights", []))

        # 3. Education & Projects
        for edu in parsed_resume.get("education", []):
            candidate_text_parts.append(edu.get("degree", ""))
            candidate_text_parts.append(edu.get("institution", ""))

        for proj in parsed_resume.get("projects", []):
            candidate_text_parts.append(proj.get("title", ""))
            candidate_text_parts.append(proj.get("description", ""))
            candidate_text_parts.extend(proj.get("technologies", []))

        full_candidate_text = " ".join(candidate_text_parts).lower()

        # Common Tech Keywords
        tech_keywords = [
            "python", "typescript", "javascript", "react", "next.js", "vue", "angular", "node", "express",
            "fastapi", "django", "flask", "java", "spring", "c++", "c#", ".net", "go", "rust", "sql",
            "postgres", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes", "aws", "gcp",
            "azure", "git", "github", "ci/cd", "rest", "api", "graphql", "microservices", "frontend",
            "backend", "full stack", "fullstack", "software", "web"
        ]

        # Common Civil / Non-IT Keywords
        civil_keywords = [
            "civil", "construction", "mep", "billing", "reconciliation", "site", "structural", "contractor",
            "tendering", "autocad", "primevera", "revit", "substation", "turnkey", "infrastructure"
        ]

        # Determine JD Domain
        jd_requires_tech = any(re.search(r"\b" + re.escape(kw) + r"\b", jd_lower) for kw in tech_keywords)
        jd_requires_civil = any(re.search(r"\b" + re.escape(kw) + r"\b", jd_lower) for kw in civil_keywords)

        # Check candidate match
        candidate_is_civil = any(re.search(r"\b" + re.escape(kw) + r"\b", full_candidate_text) for kw in civil_keywords)
        candidate_is_tech = any(re.search(r"\b" + re.escape(kw) + r"\b", full_candidate_text) for kw in tech_keywords)

        # Matched explicit skills
        matched_skills = [s for s in candidate_skills if s.lower() in jd_lower]
        tech_matches_in_text = [kw for kw in tech_keywords if kw in jd_lower and kw in full_candidate_text]

        # Strict Domain Mismatch Check
        domain_mismatch = (jd_requires_tech and candidate_is_civil and not candidate_is_tech) or (
            jd_requires_tech and len(matched_skills) == 0 and len(tech_matches_in_text) == 0
        )

        if domain_mismatch:
            match_percentage = round(12.5 + (len(matched_skills) * 2.0), 1)
            qualification_score = 1.5
            verdict = "Mismatch"

            # Identify target role name from JD if possible
            target_role = "Full Stack / Software Engineer"
            if "frontend" in jd_lower:
                target_role = "Frontend Engineer"
            elif "backend" in jd_lower:
                target_role = "Backend Engineer"
            elif "civil" in jd_lower:
                target_role = "Civil Project Engineer"

            candidate_domain = "Civil Engineering & Construction Management" if candidate_is_civil else "Non-IT Field"

            fit_summary = (
                f"Candidate's background in {candidate_domain} exhibits major domain divergence "
                f"from the target {target_role} position. None of the core required technical stack components "
                f"(e.g., React, Node, Python, SQL) were detected in the candidate's dossier."
            )
            key_strengths = [
                "Proven leadership in large-scale project execution and team management",
                "Strong track record in vendor, contractor, and multidisciplinary coordination",
                "Demonstrated commitment to project scheduling, budgeting, and quality standards"
            ]
            skill_gaps = [
                "No evidence of Full Stack / Software Application Development experience",
                "Lacks hands-on programming proficiency in modern web frameworks (React, TypeScript, Node)",
                "Missing relational/NoSQL database design and API microservices architecture experience",
                "No background in cloud deployment (AWS/GCP), CI/CD pipelines, or git workflows"
            ]
            missing_prerequisites = [
                "Full Stack Web Development Experience",
                "Core Programming Languages & Frameworks (React, Node, Python, SQL)",
                "Computer Science or Software Engineering Degree / Credentials"
            ]
            recommendation = (
                "Do NOT recommend proceeding for this software engineering position due to complete domain mismatch. "
                "Candidate profile is best suited for Civil / Construction Project Management roles."
            )
        else:
            total_candidate_skills = max(len(candidate_skills), 1)
            match_ratio = len(matched_skills) / total_candidate_skills if candidate_skills else 0.4
            match_percentage = min(96.0, max(20.0, round(35.0 + match_ratio * 60.0, 1)))
            qualification_score = round(match_percentage / 10.0, 1)

            if match_percentage >= 80:
                verdict = "Excellent"
            elif match_percentage >= 65:
                verdict = "Strong"
            elif match_percentage >= 45:
                verdict = "Moderate"
            else:
                verdict = "Weak"

            fit_summary = (
                f"Candidate demonstrates alignment with target requirements. "
                f"Key matching competencies in {', '.join(matched_skills[:4]) if matched_skills else 'relevant technical fields'} "
                f"support qualification for the role."
            )
            key_strengths = [
                f"Direct experience matching key stack requirements ({', '.join(matched_skills[:3]) if matched_skills else 'Core Technical Stack'})",
                f"Proven track record with ~{parsed_resume.get('experience_years', 3)} years of engineering practice",
                "Demonstrated capability in technical delivery and project execution"
            ]
            skill_gaps = [
                "Specific enterprise scale experience should be verified during technical discussion",
                "Deep dive into specialized architecture tooling recommended during interview stage"
            ]
            missing_prerequisites = []
            recommendation = "Recommend proceeding to technical interview evaluation."

        return {
            "match_percentage": match_percentage,
            "qualification_score": qualification_score,
            "verdict": verdict,
            "fit_summary": fit_summary,
            "key_strengths": key_strengths,
            "skill_gaps": skill_gaps,
            "missing_prerequisites": missing_prerequisites,
            "recommendation": recommendation
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


