"""
Web Search Service for Zygotrix AI.

Handles web search requests using Claude's built-in web search tool.
This is a PRO-only feature with usage tracking for billing.

Pricing: $10 per 1,000 searches (plus standard Claude token costs)
"""

import time
import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from collections import OrderedDict

import httpx

# Import from centralized config (DRY principle)
from ..ai.config import (
    CLAUDE_API_KEY,
    CLAUDE_API_URL,
    ANTHROPIC_VERSION,
    CLAUDE_WEB_SEARCH_MODEL as WEB_SEARCH_MODEL,
)
from ..base import BaseService, APIServiceMixin

logger = logging.getLogger(__name__)


class WebSearchCache:
    """
    Review: Simple in-memory TTL cache for web search results to reduce costs.
    Stores complete response (text + metadata) for repeated queries.
    """
    
    def __init__(self, max_size: int = 500, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache: OrderedDict[str, dict] = OrderedDict()
    
    def _generate_key(self, query: str) -> str:
        """Generate a consistent key for the query."""
        normalized = query.lower().strip()[:200]  # Limit key length and normalize
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def get(self, query: str) -> Optional[Dict[str, Any]]:
        """Get cached result if available and fresh."""
        key = self._generate_key(query)
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.ttl_seconds:
                self.cache.move_to_end(key)
                return entry["data"]
            else:
                del self.cache[key]
        return None
    
    def set(self, query: str, response_text: str, metadata: Dict[str, Any]):
        """Store result in cache."""
        key = self._generate_key(query)
        
        # Evict LRU if full
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)
            
        self.cache[key] = {
            "timestamp": time.time(),
            "data": {
                "response_text": response_text,
                "metadata": metadata
            }
        }


# Global cache instance
_search_cache = WebSearchCache(max_size=500, ttl_seconds=3600 * 4)  # Cache for 4 hours to maximize savings


class WebSearchService(BaseService, APIServiceMixin):
    """
    Service for handling web search requests using Claude's built-in web search tool.
    
    Features:
    - PRO-only access control
    - Usage tracking for billing ($10/1k searches)
    - Source extraction for citations
    - Token usage tracking
    - COST REDUCTION: Caching & Optimized Search Limits
    
    Inherits from:
    - BaseService: Database access pattern
    - APIServiceMixin: API availability checking
    """
    
    def __init__(self, db=None):
        """
        Initialize the web search service.
        
        Args:
            db: MongoDB database instance (optional, defaults to singleton)
        """
        BaseService.__init__(self, db)
        self.api_key = CLAUDE_API_KEY
        self.api_url = CLAUDE_API_URL
        self.model = WEB_SEARCH_MODEL
        
        if not self.api_key:
            logger.warning("CLAUDE_API_KEY not configured - web search will be disabled")
    
    # is_available property is inherited from APIServiceMixin
    
    def _get_headers(self) -> dict:
        """Get headers for Claude API requests with web search beta."""
        return {
            "x-api-key": self.api_key,
            "content-type": "application/json",
            "anthropic-version": ANTHROPIC_VERSION,
            # Enable web search beta feature
            "anthropic-beta": "web-search-2025-03-05"
        }
    
    async def check_access(self, user_id: str) -> Tuple[bool, str, int]:
        """
        Check if user has access to web search (PRO feature with daily limit).
        
        Delegates to subscription_service for unified access control (DRY principle).
        
        Args:
            user_id: The user's ID
            
        Returns:
            Tuple of (can_access, reason, remaining_count or 0 if denied)
        """
        from ..auth.subscription_service import get_subscription_service
        
        subscription_service = get_subscription_service()
        can_access, reason, remaining = subscription_service.check_web_search_access(user_id)
        
        # Convert None to 0 for consistency with the expected return type
        return can_access, reason, remaining if remaining is not None else 0
    
    async def search(
        self,
        query: str,
        user_id: str,
        user_name: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Perform a web search using Claude's built-in tool.
        
        Args:
            query: The search query/user message
            user_id: User ID for tracking
            user_name: Optional user name for logging
            max_tokens: Maximum tokens for response
            temperature: Temperature setting
            
        Returns:
            Tuple of (response_content, metadata)
        """
        if not self.is_available:
            return "Web search is currently unavailable.", {
                "error": "Service unavailable",
                "input_tokens": 0,
                "output_tokens": 0
            }
        
        logger.info(f"🌐 Web search request from user {user_id}: {query[:100]}...")
        
        # COST REDUCTION: Check cache first
        cached = _search_cache.get(query)
        if cached:
            logger.info(f"💰 Cache HIT for query: {query[:50]}... (Cost saved)")
            
            # Record zero-cost usage for stats visibility
            await self._record_usage(
                user_id=user_id,
                user_name=user_name,
                search_count=0,
                input_tokens=0,
                output_tokens=0,
                query_preview=query[:100],
                is_cached=True
            )
            
            return cached["response_text"], cached["metadata"]
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Build request with web search tool
                request_body = {
                    "model": self.model,
                    "max_tokens": min(max_tokens, 2048),  # Cap output tokens to 2k (~$0.03)
                    "temperature": temperature,
                    "tools": [
                        {
                            "type": "web_search_20250305",
                            "name": "web_search",
                            # DEEP COST REDUCTION: Limit max searches to 1.
                            # Keeps input tokens lowest possible (~15k context) for single-shot answers.
                            "max_uses": 1
                        }
                    ],
                    "messages": [
                        {
                            "role": "user",
                            "content": f"{query}\n\n[SYSTEM INSTRUCTION: PERFORM A FAST, SINGLE-STEP SEARCH. DO NOT BROWSE MORE THAN 2 PAGES. BE EXTREMELY CONCISE. STOP AS SOON AS YOU FIND THE ANSWER.]"
                        }
                    ]
                }
                
                response = await client.post(
                    self.api_url,
                    headers=self._get_headers(),
                    json=request_body
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"Claude API error: {response.status_code} - {error_text}")
                    return f"Web search failed: {error_text}", {
                        "error": error_text,
                        "input_tokens": 0,
                        "output_tokens": 0
                    }
                
                data = response.json()
                
                # Extract response content and sources
                content_blocks = data.get("content", [])
                usage = data.get("usage", {})
                
                # Parse content blocks to extract text and sources
                response_text = ""
                sources = []
                search_count = 0
                
                for block in content_blocks:
                    block_type = block.get("type")
                    
                    if block_type == "text":
                        response_text += block.get("text", "")
                    
                    elif block_type == "web_search_tool_result":
                        # Extract web search results
                        search_count += 1
                        search_results = block.get("content", [])
                        
                        for result in search_results:
                            if result.get("type") == "web_search_result":
                                sources.append({
                                    "title": result.get("title", ""),
                                    "url": result.get("url", ""),
                                    "snippet": result.get("snippet", ""),
                                    "encrypted_content": result.get("encrypted_content")
                                })
                
                # Record usage for billing
                await self._record_usage(
                    user_id=user_id,
                    user_name=user_name,
                    search_count=max(search_count, 1),  # At least 1 search
                    input_tokens=usage.get("input_tokens", 0),
                    output_tokens=usage.get("output_tokens", 0),
                    query_preview=query[:100]
                )
                
                metadata = {
                    "input_tokens": usage.get("input_tokens", 0),
                    "output_tokens": usage.get("output_tokens", 0),
                    "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
                    "model": self.model,
                    "search_count": search_count,
                    "sources": sources,
                    "sources_count": len(sources),
                    "cached": False
                }
                
                # COST REDUCTION: Store success response in cache
                _search_cache.set(query, response_text, {**metadata, "cached": True})
                
                logger.info(
                    f"✅ Web search complete | "
                    f"Searches: {search_count} | "
                    f"Sources: {len(sources)} | "
                    f"Tokens: {metadata['total_tokens']}"
                )
                
                return response_text, metadata
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error during web search: {e}")
            return f"Web search failed: Connection error", {
                "error": str(e),
                "input_tokens": 0,
                "output_tokens": 0
            }
        except Exception as e:
            logger.error(f"Unexpected error during web search: {e}", exc_info=True)
            return f"Web search failed: {str(e)}", {
                "error": str(e),
                "input_tokens": 0,
                "output_tokens": 0
            }
    
    async def _record_usage(
        self,
        user_id: str,
        user_name: Optional[str],
        search_count: int,
        input_tokens: int,
        output_tokens: int,
        query_preview: str,
        is_cached: bool = False
    ):
        """
        Record web search usage for billing.
        
        Delegates to the unified UsageTrackingService (DRY principle).
        Maintains cache invalidation for frontend daily limit stats.
        
        Args:
            user_id: User ID
            user_name: User name (optional)
            search_count: Number of searches performed
            input_tokens: Input tokens used
            output_tokens: Output tokens used
            query_preview: First 100 chars of query
            is_cached: Whether valid cache result was used
        """
        try:
            # Use unified usage tracking service
            from ..usage import get_usage_tracking_service
            
            usage_service = get_usage_tracking_service()
            await usage_service.record_web_search_usage(
                user_id=user_id,
                search_count=search_count,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                query_preview=query_preview,
                user_name=user_name,
                model=self.model,
                is_cached=is_cached
            )
            
            # Invalidate user cache to ensure frontend gets fresh daily limit stats
            try:
                from ..auth.user_service import get_user_service
                query_id = self.normalize_user_id(user_id)
                get_user_service()._clear_user_cache(str(query_id))
            except Exception as e:
                logger.warning(f"Failed to invalidate user cache after web search usage: {e}")
            
        except Exception as e:
            logger.error(f"Failed to record web search usage: {e}")


# Global singleton instance
_web_search_service: Optional[WebSearchService] = None


def get_web_search_service() -> WebSearchService:
    """Get or create the global WebSearchService instance."""
    global _web_search_service
    if _web_search_service is None:
        _web_search_service = WebSearchService()
    return _web_search_service
