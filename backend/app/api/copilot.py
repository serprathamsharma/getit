"""APIs for AI Technical Hiring Co-Pilot and Adaptive Interview Assistant."""

import logging
from fastapi import APIRouter
from app.models.schemas import (
    AdaptiveFollowupRequest,
    AdaptiveFollowupResponse,
)
from app.services.interview_agent import AdaptiveInterviewAssistant, PersonalizedInterviewAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/copilot", tags=["copilot"])

adaptive_assistant = AdaptiveInterviewAssistant()
interview_agent = PersonalizedInterviewAgent()


@router.post("/adaptive-interview", response_model=AdaptiveFollowupResponse)
async def adaptive_interview_followup(payload: AdaptiveFollowupRequest):
    """Evaluate candidate interview response and generate dynamic follow-up recommendations."""
    res = adaptive_assistant.evaluate_response(payload.model_dump())
    return AdaptiveFollowupResponse(**res)
