"""TalentRadar API — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.engineers import router as engineers_router
from app.api.analysis import router as analysis_router
from app.api.resumes import router as resumes_router
from app.api.jobs import router as jobs_router
from app.api.copilot import router as copilot_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 Starting TalentRadar API...")
    await init_db()
    logger.info("✅ Database initialized")
    logger.info(f"📡 GitHub token: {'configured' if settings.GITHUB_TOKEN else 'not set (using unauthenticated, 60 req/hr)'}")
    logger.info(f"🤖 Anthropic API: {'configured' if settings.ANTHROPIC_API_KEY else 'using mock LLM (no API key)'}")
    yield
    logger.info("👋 Shutting down TalentRadar API")


app = FastAPI(
    title="TalentRadar API",
    description="AI-Powered Technical Talent Intelligence Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(engineers_router)
app.include_router(analysis_router)
app.include_router(resumes_router)
app.include_router(jobs_router, prefix="/api")
app.include_router(copilot_router)



@app.get("/")
async def root():
    return {
        "name": "TalentRadar API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
