"""
Web Search API Routes.

Provides endpoints for web search analytics and usage statistics.
"""

import logging
from fastapi import APIRouter, HTTPException, status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/web-search", tags=["Web Search"])


@router.get(
    "/analytics",
    summary="Get Web Search Analytics (Admin)",
    description="Get aggregate web search usage statistics for all users."
)
async def get_analytics() -> dict:
    """
    Get aggregate web search analytics for all users.
    Returns stats on searches, token usage, and costs.
    
    Cost breakdown:
    - Search API: $10 per 1,000 searches
    - Claude tokens: Standard Claude pricing ($3/1M input, $15/1M output)
    """
    try:
        from ..services.web_search import get_web_search_analytics_service
        analytics_service = get_web_search_analytics_service()
        return analytics_service.get_aggregate_stats()
    except Exception as e:
        logger.error(f"Failed to get web search analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )


@router.get(
    "/analytics/daily",
    summary="Get Daily Web Search Analytics (Admin)",
    description="Get daily web search usage statistics for the last N days."
)
async def get_daily_analytics(days: int = 30) -> dict:
    """
    Get daily web search analytics.
    Returns daily breakdown of searches, tokens, and costs.
    """
    try:
        from ..services.web_search import get_web_search_analytics_service
        analytics_service = get_web_search_analytics_service()
        return analytics_service.get_daily_stats(days=min(days, 90))  # Cap at 90 days
    except Exception as e:
        logger.error(f"Failed to get daily web search analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get daily analytics: {str(e)}"
        )
