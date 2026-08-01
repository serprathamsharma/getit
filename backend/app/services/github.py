"""GitHub API client with rate limiting and caching."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class GitHubService:
    """Handles all GitHub API interactions."""

    def __init__(self):
        self.base_url = settings.GITHUB_API_BASE
        self.token = settings.GITHUB_TOKEN
        self._cache: dict[str, tuple[Any, datetime]] = {}
        self._rate_remaining = 60
        self._rate_reset: datetime | None = None

    def _headers(self) -> dict:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _cache_key(self, endpoint: str) -> str:
        return endpoint

    def _get_cached(self, key: str) -> Any | None:
        if key in self._cache:
            data, expires = self._cache[key]
            if datetime.utcnow() < expires:
                return data
            del self._cache[key]
        return None

    def _set_cache(self, key: str, data: Any, ttl_hours: int = None):
        ttl = ttl_hours or settings.CACHE_TTL_HOURS
        self._cache[key] = (data, datetime.utcnow() + timedelta(hours=ttl))

    async def _request(self, endpoint: str, params: dict | None = None) -> Any:
        """Make a rate-limited, cached request to the GitHub API."""
        cache_key = self._cache_key(f"{endpoint}:{params}")
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        # Rate limit check
        if self._rate_remaining <= 1 and self._rate_reset:
            wait_seconds = (self._rate_reset - datetime.utcnow()).total_seconds()
            if wait_seconds > 0:
                logger.warning(f"Rate limited. Waiting {wait_seconds:.0f}s...")
                await asyncio.sleep(min(wait_seconds + 1, 60))

        url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(3):
                try:
                    response = await client.get(url, headers=self._headers(), params=params)

                    # Update rate limit tracking
                    self._rate_remaining = int(response.headers.get("x-ratelimit-remaining", 60))
                    reset_ts = response.headers.get("x-ratelimit-reset")
                    if reset_ts:
                        self._rate_reset = datetime.utcfromtimestamp(int(reset_ts))

                    if response.status_code == 200:
                        data = response.json()
                        self._set_cache(cache_key, data)
                        return data
                    elif response.status_code == 403:
                        logger.warning("Rate limited by GitHub, backing off...")
                        await asyncio.sleep(2 ** attempt * 5)
                        continue
                    elif response.status_code == 404:
                        logger.warning(f"Not found: {endpoint}")
                        return None
                    else:
                        logger.error(f"GitHub API error {response.status_code}: {response.text}")
                        return None
                except httpx.TimeoutException:
                    logger.warning(f"Timeout on attempt {attempt + 1} for {endpoint}")
                    await asyncio.sleep(2 ** attempt)
                except Exception as e:
                    logger.error(f"Request error: {e}")
                    return None

        return None

    async def get_user(self, username: str) -> dict | None:
        """Fetch a GitHub user's profile."""
        return await self._request(f"/users/{username}")

    async def get_user_repos(self, username: str, limit: int = None) -> list[dict]:
        """Fetch user's public repos, sorted by stars."""
        limit = limit or settings.MAX_REPOS_TO_ANALYZE
        repos = []
        page = 1

        while len(repos) < limit:
            data = await self._request(
                f"/users/{username}/repos",
                params={
                    "sort": "pushed",
                    "direction": "desc",
                    "per_page": min(30, limit),
                    "page": page,
                    "type": "owner",
                },
            )
            if not data:
                break
            repos.extend(data)
            if len(data) < 30:
                break
            page += 1

        # Sort by stars descending, filter out forks for priority
        original = [r for r in repos if not r.get("fork", False)]
        forked = [r for r in repos if r.get("fork", False)]
        original.sort(key=lambda r: r.get("stargazers_count", 0), reverse=True)
        result = original + forked
        return result[:limit]

    async def get_repo_commits(self, owner: str, repo: str, limit: int = 100) -> list[dict]:
        """Fetch recent commits for a repo."""
        commits = await self._request(
            f"/repos/{owner}/{repo}/commits",
            params={"per_page": min(limit, 100)},
        )
        return commits or []

    async def get_repo_pulls(self, owner: str, repo: str, state: str = "all", limit: int = 50) -> list[dict]:
        """Fetch pull requests for a repo."""
        pulls = await self._request(
            f"/repos/{owner}/{repo}/pulls",
            params={"state": state, "per_page": min(limit, 100), "sort": "updated"},
        )
        return pulls or []

    async def get_repo_issues(self, owner: str, repo: str, limit: int = 50) -> list[dict]:
        """Fetch issues for a repo."""
        issues = await self._request(
            f"/repos/{owner}/{repo}/issues",
            params={"per_page": min(limit, 100), "state": "all", "sort": "updated"},
        )
        return issues or []

    async def get_repo_languages(self, owner: str, repo: str) -> dict:
        """Fetch language breakdown for a repo."""
        data = await self._request(f"/repos/{owner}/{repo}/languages")
        return data or {}

    async def get_repo_contents(self, owner: str, repo: str, path: str = "") -> list[dict] | None:
        """Fetch repo file tree (for test/doc detection)."""
        data = await self._request(f"/repos/{owner}/{repo}/contents/{path}")
        if isinstance(data, list):
            return data
        return None

    async def get_user_events(self, username: str, limit: int = 100) -> list[dict]:
        """Fetch recent public events for a user."""
        events = await self._request(
            f"/users/{username}/events/public",
            params={"per_page": min(limit, 100)},
        )
        return events or []

    async def collect_full_profile(self, username: str) -> dict | None:
        """Collect all GitHub data for a user in one call."""
        user = await self.get_user(username)
        if not user:
            return None

        repos = await self.get_user_repos(username)

        # Analyze top repos in detail
        repo_details = []
        for repo in repos[:settings.MAX_REPOS_TO_ANALYZE]:
            repo_name = repo.get("name", "")
            owner = repo.get("owner", {}).get("login", username)

            # Fetch repo details concurrently
            languages = await self.get_repo_languages(owner, repo_name)
            commits = await self.get_repo_commits(owner, repo_name, limit=50)

            # Get root contents for test/doc detection
            contents = await self.get_repo_contents(owner, repo_name)

            repo_details.append({
                "repo": repo,
                "languages": languages,
                "commits": commits,
                "contents": contents or [],
            })

        events = await self.get_user_events(username, limit=100)

        return {
            "user": user,
            "repos": repos,
            "repo_details": repo_details,
            "events": events,
        }


# Singleton instance
github_service = GitHubService()
