"""
Web Search Service for Zygotrix AI.

Handles web search requests using Claude's built-in web search tool.
This is a PRO-only feature with usage tracking for billing.

Pricing: $10 per 1,000 searches (plus standard Claude token costs)
"""

import os
import time
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from collections import OrderedDict
from bson import ObjectId

import httpx
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

# Configuration
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

# Web search specific model (Claude 3.5 Sonnet supports web search)
WEB_SEARCH_MODEL = os.getenv("WEB_SEARCH_MODEL", "claude-sonnet-4-20250514")


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


class WebSearchService:
    """
    Service for handling web search requests using Claude's built-in web search tool.
    
    Features:
    - PRO-only access control
    - Usage tracking for billing ($10/1k searches)
    - Source extraction for citations
    - Token usage tracking
    - COST REDUCTION: Caching & Optimized Search Limits
    """
    
    def __init__(self, db=None):
        """
        Initialize the web search service.
        
        Args:
            db: MongoDB database instance (optional, defaults to singleton)
        """
        self.api_key = CLAUDE_API_KEY
        self.api_url = CLAUDE_API_URL
        self.model = WEB_SEARCH_MODEL
        
        if db is None:
            from ..common import get_database
            self._db = get_database()
        else:
            self._db = db
        
        if not self.api_key:
            logger.warning("CLAUDE_API_KEY not configured - web search will be disabled")
    
    @property
    def is_available(self) -> bool:
        """Check if web search service is available."""
        return self.api_key is not None and self.api_key.strip() != ""
    
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
        Check if user has access to web search (PRO feature).
        
        Args:
            user_id: The user's ID
            
        Returns:
            Tuple of (can_access, reason, remaining_count or -1 if unlimited)
        """
        from ..auth.subscription_service import get_subscription_service
        
        subscription_service = get_subscription_service()
        
        # Check if user is PRO
        try:
            # Try to query with ObjectId if possible
            query_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
            user = self._db.users.find_one({"_id": query_id})
        except Exception:
            # Fallback to string query
            user = self._db.users.find_one({"_id": user_id})
            
        if not user:
            return False, "User not found", 0
        
        subscription_status = user.get("subscription_status", "free")
        
        if subscription_status != "pro":
            return False, "Web Search is a PRO feature. Upgrade to access real-time web information.", 0
        
        # Enforce daily limit of 5 searches
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        usage_today = self._db.web_search_usage.count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": today_start},
            "is_cached": False  # Only count actual API calls against the limit (cached are free)
        })
        
        daily_limit = 5
        if usage_today >= daily_limit:
            return False, f"Daily web search limit reached ({daily_limit}/{daily_limit}). Please try again tomorrow.", 0
            
        remaining = daily_limit - usage_today
        return True, "Access granted", remaining
    
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
        
        Pricing: $10 per 1,000 searches + token costs
        If cached, cost is 0.
        
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
            if is_cached:
                search_cost = 0.0
                input_cost = 0.0
                output_cost = 0.0
                total_cost = 0.0
            else:
                # Calculate cost
                # $10 per 1,000 searches = $0.01 per search
                search_cost = search_count * 0.01
                
                # Token costs (Claude Sonnet pricing: $3/1M input, $15/1M output)
                input_cost = (input_tokens / 1_000_000) * 3.0
                output_cost = (output_tokens / 1_000_000) * 15.0
                total_cost = search_cost + input_cost + output_cost
            
            # Record in web_search_usage collection
            usage_record = {
                "user_id": user_id,
                "user_name": user_name,
                "timestamp": datetime.now(timezone.utc),
                "search_count": search_count,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "query_preview": query_preview,
                "search_cost": search_cost,
                "token_cost": input_cost + output_cost,
                "total_cost": total_cost,
                "model": self.model,
                "is_cached": is_cached
            }
            
            self._db.web_search_usage.insert_one(usage_record)
            
            # Also update user's aggregate usage
            try:
                query_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
            except Exception:
                query_id = user_id
                
            self._db.users.update_one(
                {"_id": query_id},
                {
                    "$inc": {
                        "web_search_usage.total_searches": search_count,
                        "web_search_usage.total_cost": total_cost
                    },
                    "$set": {
                        "web_search_usage.last_used": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Invalidate user cache to ensure frontend gets fresh daily limit stats
            try:
                from ..auth.user_service import get_user_service
                # Use string ID as cache uses string keys
                get_user_service()._clear_user_cache(str(query_id))
            except Exception as e:
                logger.warning(f"Failed to invalidate user cache after web search usage: {e}")
            
            log_prefix = "💰 Cached" if is_cached else "📊 New"
            logger.info(
                f"{log_prefix} web search usage recorded | "
                f"User: {user_id} | "
                f"Searches: {search_count} | "
                f"Cost: ${total_cost:.4f}"
            )
            
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
