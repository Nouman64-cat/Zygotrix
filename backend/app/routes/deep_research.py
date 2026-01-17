"""
Deep Research API Routes.

Provides endpoints for the deep research feature with LangGraph workflow.
"""

import logging
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from ..dependencies import get_current_user
from ..schema.auth import UserProfile
from ..services.deep_research import (
    DeepResearchService,
    get_deep_research_service,
    DeepResearchRequest,
    DeepResearchResponse,
)
from ..services.deep_research.schemas import (
    ResearchStatus,
    ResearchPhase,
    StreamingResearchChunk,
)
from ..services.auth.subscription_service import get_subscription_service, SubscriptionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/deep-research", tags=["Deep Research"])


@router.post(
    "",
    response_model=DeepResearchResponse,
    summary="Execute Deep Research",
    description="""
    Execute deep research on a query using the LangGraph workflow.
    
    **Subscription Requirements:**
    - FREE users: No access (returns 403)
    - PRO users: 3 deep research queries per 24-hour period
    
    The workflow consists of:
    1. **Clarification** (GPT-4o-mini) - Analyzes query and may ask clarifying questions
    2. **Retrieval** (Pinecone) - Fetches relevant document chunks
    3. **Reranking** (Cohere) - Improves precision of retrieved chunks
    4. **Synthesis** (Claude) - Generates comprehensive response
    
    If clarification is needed, the response will have status='needs_clarification'
    and include clarification_questions. Submit answers using the clarification_answers field.
    """
)
async def execute_research(
    request: DeepResearchRequest,
    current_user: UserProfile = Depends(get_current_user),
    service: DeepResearchService = Depends(get_deep_research_service),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
) -> DeepResearchResponse:
    """
    Execute deep research on a query.
    
    Returns either:
    - Clarification questions if the query needs refinement
    - Complete research results with synthesized response and sources
    """
    # Check subscription and usage limits
    can_access, reason, remaining = subscription_service.check_deep_research_access(current_user.id)
    if not can_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "subscription_required",
                "message": reason,
                "remaining_uses": remaining
            }
        )
    
    try:
        logger.info(f"Deep research request from user {current_user.id}: {request.query[:100]}...")
        
        response = await service.research(
            request=request,
            user_id=current_user.id,
            user_name=current_user.full_name
        )
        
        # Record usage only for completed research (not clarification questions)
        if response.status != ResearchStatus.NEEDS_CLARIFICATION:
            subscription_service.record_deep_research_usage(current_user.id)
        
        logger.info(
            f"Deep research completed: status={response.status}, "
            f"phase={response.phase}, sources={response.sources_used}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Deep research error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research failed: {str(e)}"
        )


@router.post(
    "/stream",
    summary="Execute Deep Research with Streaming",
    description="""
    Execute deep research with streaming updates.
    
    **Subscription Requirements:**
    - FREE users: No access (returns 403)
    - PRO users: 3 deep research queries per 24-hour period
    
    Returns a Server-Sent Events (SSE) stream with updates as the research progresses.
    Each event is a JSON object with a 'type' field indicating the update type:
    - 'phase_update': Research phase changed
    - 'clarification': Clarification question (if needed)
    - 'source': A source document being used
    - 'content': The final synthesized response
    - 'done': Research complete
    - 'error': An error occurred
    """
)
async def execute_research_stream(
    request: DeepResearchRequest,
    current_user: UserProfile = Depends(get_current_user),
    service: DeepResearchService = Depends(get_deep_research_service),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
) -> StreamingResponse:
    """
    Execute deep research with streaming updates.
    
    Returns SSE stream with real-time progress updates.
    """
    # Check subscription and usage limits
    can_access, reason, remaining = subscription_service.check_deep_research_access(current_user.id)
    if not can_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "subscription_required",
                "message": reason,
                "remaining_uses": remaining
            }
        )
    
    logger.info(f"Streaming deep research request from user {current_user.id}")
    
    async def generate():
        try:
            async for chunk in service.research_stream(
                request=request,
                user_id=current_user.id,
                user_name=current_user.full_name
            ):
                # Convert to JSON and format as SSE
                data = chunk.model_dump_json()
                yield f"data: {data}\n\n"
                
                # Record usage when done (not for clarification)
                if chunk.type == "done":
                    # Check if this was a clarification response (shouldn't count usage)
                    is_clarification = getattr(chunk, 'needs_clarification', False) or False
                    logger.info(f"Stream done for user {current_user.id}: is_clarification={is_clarification}")
                    
                    if not is_clarification:
                        logger.info(f"Recording deep research usage for user {current_user.id}")
                        subscription_service.record_deep_research_usage(current_user.id)
                
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            error_chunk = StreamingResearchChunk(
                type="error",
                error=str(e)
            )
            yield f"data: {error_chunk.model_dump_json()}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get(
    "/status",
    summary="Check Deep Research Service Status",
    description="Check if the deep research service and its dependencies are available."
)
async def check_status(
    current_user: UserProfile = Depends(get_current_user),
    service: DeepResearchService = Depends(get_deep_research_service)
) -> dict:
    """
    Check deep research service status.
    """
    try:
        # Check Cohere availability
        cohere_available = service.cohere_reranker.is_available
        
        # Check if graph is compiled
        graph_ready = service._compiled_graph is not None
        
        return {
            "status": "operational",
            "cohere_reranker": "available" if cohere_available else "unavailable",
            "graph_compiled": graph_ready,
            "max_recursion_depth": service._compiled_graph and 10 or None,
            "models": {
                "clarification": "gpt-4o-mini",
                "reranking": service.cohere_reranker.model if cohere_available else None,
                "synthesis": "claude-sonnet-4-20250514"
            }
        }
    except Exception as e:
        logger.error(f"Status check error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


@router.get(
    "/usage",
    summary="Get Deep Research Usage",
    description="Get the current user's deep research usage statistics including used and remaining counts."
)
async def get_usage(
    current_user: UserProfile = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service)
) -> dict:
    """
    Get deep research usage for the current user.
    
    Returns:
        - used: Number of deep research queries used today
        - remaining: Number of queries remaining today
        - limit: Daily limit for the user's subscription tier
        - can_access: Whether the user can use deep research
        - reset_time: Approximate time when the limit resets
    """
    try:
        can_access, reason, remaining = subscription_service.check_deep_research_access(current_user.id)
        
        # Get daily limit based on subscription
        from ..services.auth.subscription_service import DEEP_RESEARCH_DAILY_LIMIT_PRO, DEEP_RESEARCH_DAILY_LIMIT_FREE
        
        is_pro = current_user.subscription_status == "pro"
        daily_limit = DEEP_RESEARCH_DAILY_LIMIT_PRO if is_pro else DEEP_RESEARCH_DAILY_LIMIT_FREE
        
        # Calculate used count
        used = daily_limit - (remaining or 0) if remaining is not None else 0
        
        return {
            "used": used,
            "remaining": remaining or 0,
            "limit": daily_limit,
            "can_access": can_access,
            "is_pro": is_pro,
            "message": reason if not can_access else None
        }
    except Exception as e:
        logger.error(f"Usage check error: {e}")
        return {
            "used": 0,
            "remaining": 0,
            "limit": 0,
            "can_access": False,
            "is_pro": False,
            "error": str(e)
        }


@router.get(
    "/capabilities",
    summary="Get Deep Research Capabilities",
    description="Get information about the deep research feature and its capabilities."
)
async def get_capabilities() -> dict:
    """
    Get deep research capabilities and configuration.
    """
    return {
        "feature": "Deep Research",
        "version": "1.0.0",
        "description": "Multi-step research workflow with clarification, retrieval, reranking, and synthesis",
        "workflow": {
            "steps": [
                {
                    "name": "Clarification",
                    "model": "GPT-4o-mini",
                    "description": "Analyzes query and generates clarifying questions if needed"
                },
                {
                    "name": "Retrieval",
                    "service": "Pinecone",
                    "description": "Fetches relevant document chunks from vector store"
                },
                {
                    "name": "Reranking",
                    "model": "Cohere rerank-v4.0-fast",
                    "description": "Improves precision by reranking retrieved chunks"
                },
                {
                    "name": "Synthesis",
                    "model": "Claude",
                    "description": "Generates comprehensive response from top sources"
                }
            ]
        },
        "configuration": {
            "max_sources": 50,
            "default_top_k": 5,
            "max_clarification_questions": 3,
            "supported_formats": ["text", "markdown"]
        },
        "features": [
            "Automatic query clarification",
            "Multi-source synthesis",
            "Citation tracking",
            "Streaming updates",
            "Token usage tracking"
        ]
    }
