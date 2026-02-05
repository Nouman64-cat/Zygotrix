"""
Unified Usage Tracking Service.

Centralizes usage recording for all AI features:
- Deep Research
- Scholar Mode
- Web Search
- Chat
- Embeddings

This eliminates duplicate _record_usage methods across services.

Usage:
    from ..usage import get_usage_tracking_service, UsageType
    
    usage_service = get_usage_tracking_service()
    await usage_service.record_usage(
        usage_type=UsageType.SCHOLAR_MODE,
        user_id=user_id,
        input_tokens=1000,
        output_tokens=500,
        metadata={"sources_count": 10}
    )
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from enum import Enum

from ..base import BaseService
from ..ai.config import (
    CLAUDE_INPUT_TOKEN_PRICE,
    CLAUDE_OUTPUT_TOKEN_PRICE,
    WEB_SEARCH_COST_PER_SEARCH,
    COHERE_RERANK_COST_PER_1K,
    calculate_token_cost,
)

logger = logging.getLogger(__name__)


class UsageType(Enum):
    """Types of usage to track."""
    DEEP_RESEARCH = "deep_research"
    SCHOLAR_MODE = "scholar"
    WEB_SEARCH = "web_search"
    CHAT = "chat"
    EMBEDDING = "embedding"


class UsageTrackingService(BaseService):
    """
    Centralized service for tracking AI feature usage.
    
    Features:
    - Unified cost calculation
    - Consistent database operations
    - Aggregate user stats
    - Collection-per-feature storage
    
    This replaces the duplicate _record_usage methods in:
    - ScholarService (lines 520-591)
    - WebSearchService (lines 345-440)
    - DeepResearchAnalyticsService
    """
    
    # Collection names for each usage type
    COLLECTION_MAP = {
        UsageType.DEEP_RESEARCH: "deep_research_usage",
        UsageType.SCHOLAR_MODE: "scholar_usage",
        UsageType.WEB_SEARCH: "web_search_usage",
        UsageType.CHAT: "chat_usage",
        UsageType.EMBEDDING: "embedding_usage"
    }
    
    # User field prefixes for aggregate stats
    USER_FIELD_MAP = {
        UsageType.DEEP_RESEARCH: "deep_research_usage",
        UsageType.SCHOLAR_MODE: "scholar_usage",
        UsageType.WEB_SEARCH: "web_search_usage",
        UsageType.CHAT: "chat_usage",
        UsageType.EMBEDDING: "embedding_usage"
    }
    
    def __init__(self, db=None):
        """Initialize the usage tracking service."""
        super().__init__(db)
    
    async def record_usage(
        self,
        usage_type: UsageType,
        user_id: str,
        input_tokens: int = 0,
        output_tokens: int = 0,
        additional_cost: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None,
        user_name: Optional[str] = None,
        query_preview: Optional[str] = None,
        model: Optional[str] = None,
        is_cached: bool = False
    ) -> Dict[str, Any]:
        """
        Record usage for any AI feature.
        
        Args:
            usage_type: The type of usage (scholar, web_search, etc.)
            user_id: User's ID
            input_tokens: Number of input tokens used
            output_tokens: Number of output tokens used
            additional_cost: Extra costs (e.g., search API costs, reranking)
            metadata: Additional metadata to store (service-specific fields)
            user_name: Optional user name for logging
            query_preview: Optional preview of the query (first 100 chars)
            model: Model used for the request
            is_cached: Whether this was a cached response (no actual API cost)
            
        Returns:
            Usage record that was inserted
        """
        try:
            # Calculate costs (0 if cached)
            if is_cached:
                costs = {"input_cost": 0.0, "output_cost": 0.0, "token_cost": 0.0}
                total_cost = 0.0
            else:
                costs = calculate_token_cost(input_tokens, output_tokens)
                total_cost = costs["token_cost"] + additional_cost
            
            # Build usage record
            usage_record = {
                "user_id": user_id,
                "user_name": user_name,
                "timestamp": datetime.now(timezone.utc),
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "input_cost": costs["input_cost"],
                "output_cost": costs["output_cost"],
                "additional_cost": additional_cost,
                "total_cost": total_cost,
                "query_preview": query_preview,
                "model": model,
                "is_cached": is_cached,
            }
            
            # Merge any additional metadata
            if metadata:
                usage_record.update(metadata)
            
            # Insert into appropriate collection
            collection_name = self.COLLECTION_MAP[usage_type]
            self._db[collection_name].insert_one(usage_record)
            
            # Update user aggregate stats (skip for cached to avoid inflated counts)
            if not is_cached:
                self._update_user_aggregates(
                    user_id=user_id,
                    usage_type=usage_type,
                    total_cost=total_cost,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens
                )
            
            # Log the usage
            log_prefix = "💰 Cached" if is_cached else "📊 New"
            logger.info(
                f"{log_prefix} {usage_type.value} usage recorded | "
                f"User: {user_id} | "
                f"Tokens: {input_tokens + output_tokens} | "
                f"Cost: ${total_cost:.4f}"
            )
            
            return usage_record
            
        except Exception as e:
            logger.error(f"Failed to record {usage_type.value} usage: {e}")
            return {}
    
    def _update_user_aggregates(
        self,
        user_id: str,
        usage_type: UsageType,
        total_cost: float,
        input_tokens: int,
        output_tokens: int
    ) -> None:
        """
        Update user's aggregate usage statistics.
        
        Args:
            user_id: User's ID
            usage_type: Type of usage
            total_cost: Total cost of this usage
            input_tokens: Input tokens used
            output_tokens: Output tokens used
        """
        try:
            query_id = self.normalize_user_id(user_id)
            user_field = self.USER_FIELD_MAP[usage_type]
            
            self._db.users.update_one(
                {"_id": query_id},
                {
                    "$inc": {
                        f"{user_field}.total_queries": 1,
                        f"{user_field}.total_cost": total_cost,
                        f"{user_field}.total_input_tokens": input_tokens,
                        f"{user_field}.total_output_tokens": output_tokens
                    },
                    "$set": {
                        f"{user_field}.last_used": datetime.now(timezone.utc)
                    }
                }
            )
        except Exception as e:
            logger.error(f"Failed to update user aggregates: {e}")
    
    async def record_scholar_usage(
        self,
        user_id: str,
        input_tokens: int,
        output_tokens: int,
        deep_research_sources: int,
        web_search_sources: int,
        query_preview: str,
        user_name: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Convenience method for recording Scholar Mode usage.
        
        Calculates additional costs for source reranking.
        """
        # Calculate additional costs for reranking
        total_sources = deep_research_sources + web_search_sources
        rerank_cost = (total_sources / 1000) * COHERE_RERANK_COST_PER_1K
        
        return await self.record_usage(
            usage_type=UsageType.SCHOLAR_MODE,
            user_id=user_id,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            additional_cost=rerank_cost,
            metadata={
                "deep_research_sources": deep_research_sources,
                "web_search_sources": web_search_sources,
                "total_sources": total_sources,
                "rerank_cost": rerank_cost,
            },
            user_name=user_name,
            query_preview=query_preview,
            model=model
        )
    
    async def record_web_search_usage(
        self,
        user_id: str,
        search_count: int,
        input_tokens: int,
        output_tokens: int,
        query_preview: str,
        user_name: Optional[str] = None,
        model: Optional[str] = None,
        is_cached: bool = False
    ) -> Dict[str, Any]:
        """
        Convenience method for recording Web Search usage.
        
        Calculates additional costs for web search API calls.
        """
        # Calculate search API cost ($10 per 1,000 searches)
        search_cost = search_count * WEB_SEARCH_COST_PER_SEARCH if not is_cached else 0.0
        
        return await self.record_usage(
            usage_type=UsageType.WEB_SEARCH,
            user_id=user_id,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            additional_cost=search_cost,
            metadata={
                "search_count": search_count,
                "search_cost": search_cost,
            },
            user_name=user_name,
            query_preview=query_preview,
            model=model,
            is_cached=is_cached
        )
    
    def get_daily_usage_count(
        self,
        user_id: str,
        usage_type: UsageType,
        exclude_cached: bool = True
    ) -> int:
        """
        Get the count of usage for a user today.
        
        Useful for enforcing daily limits.
        
        Args:
            user_id: User's ID
            usage_type: Type of usage to count
            exclude_cached: Whether to exclude cached responses from count
            
        Returns:
            Number of usages today
        """
        try:
            today_start = datetime.now(timezone.utc).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            
            query = {
                "user_id": user_id,
                "timestamp": {"$gte": today_start}
            }
            
            if exclude_cached:
                query["is_cached"] = False
            
            collection_name = self.COLLECTION_MAP[usage_type]
            return self._db[collection_name].count_documents(query)
            
        except Exception as e:
            logger.error(f"Failed to get daily usage count: {e}")
            return 0


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

_usage_service: Optional[UsageTrackingService] = None


def get_usage_tracking_service() -> UsageTrackingService:
    """Get or create the global UsageTrackingService instance."""
    global _usage_service
    if _usage_service is None:
        _usage_service = UsageTrackingService()
    return _usage_service
