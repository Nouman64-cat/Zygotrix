"""Chatbot API routes for LlamaCloud and Claude AI integration."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import logging
import os
import re
import hashlib
import time
from typing import Optional
from collections import OrderedDict
from datetime import datetime, timezone
from dotenv import load_dotenv, find_dotenv


load_dotenv(find_dotenv())

from ..chatbot_tools import (
    get_traits_count, 
    search_traits, 
    get_trait_details,
    calculate_punnett_square,
    parse_cross_from_message
)

from ..services.chatbot_settings import get_chatbot_settings
from ..services.chatbot.response_cache_service import get_response_cache
from ..services.chatbot.conversation_memory_service import get_conversation_memory
from ..services.chatbot.rate_limiting_service import get_rate_limiter
from ..services.chatbot.claude_ai_service import get_claude_ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# Configuration - API keys from environment variables
LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")
LLAMA_CLOUD_BASE_URL = "https://api.cloud.eu.llamaindex.ai"
LLAMA_CLOUD_INDEX_NAME = "Zygotrix"
LLAMA_CLOUD_ORG_ID = "7e4d6187-f46d-4435-a999-768d5c727cf1"
LLAMA_CLOUD_PROJECT_NAME = "Default"

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")

# Debug logging - show if keys are loaded (masked for security)
logger.info(f"CLAUDE_API_KEY loaded: {'Yes' if CLAUDE_API_KEY else 'No'} (first 10 chars: {CLAUDE_API_KEY[:10] if CLAUDE_API_KEY else 'None'}...)")
logger.info(f"LLAMA_CLOUD_API_KEY loaded: {'Yes' if LLAMA_CLOUD_API_KEY else 'No'}")

# Cache the pipeline ID to avoid repeated lookups
_cached_pipeline_id: str | None = None


# =============================================================================
# MODEL PRICING CONFIGURATION
# =============================================================================

# Pricing per 1K tokens (updated 2025)
MODEL_PRICING = {
    "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
    "claude-3-sonnet-20240229": {"input": 0.003, "output": 0.015},
    "claude-3-opus-20240229": {"input": 0.015, "output": 0.075},
    "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
    "claude-3-5-haiku-20241022": {"input": 0.0008, "output": 0.004},
    "claude-sonnet-4-5-20250514": {"input": 0.003, "output": 0.015},
    "claude-opus-4-5-20251101": {"input": 0.005, "output": 0.025},
    "claude-haiku-4-5-20250514": {"input": 0.001, "output": 0.005},
}


def get_model_pricing(model: str) -> dict:
    """Get pricing for a specific model. Defaults to Haiku 3 if model not found."""
    return MODEL_PRICING.get(model, {"input": 0.00025, "output": 0.00125})


def calculate_cost(input_tokens: int, output_tokens: int, model: str) -> float:
    """Calculate cost based on model-specific pricing."""
    pricing = get_model_pricing(model)
    input_cost = (input_tokens / 1000) * pricing["input"]
    output_cost = (output_tokens / 1000) * pricing["output"]
    return input_cost + output_cost



class PageContext(BaseModel):
    pageName: str
    description: str
    features: list[str]


class ChatRequest(BaseModel):
    message: str
    pageContext: PageContext | None = None
    userName: str | None = None
    userId: str | None = None  # For token usage tracking
    userRole: str | None = None  # For admin unlimited tokens feature
    sessionId: str | None = None  # For conversation memory


class ChatResponse(BaseModel):
    response: str
    usage: dict | None = None  # Token usage info for rate limiting


async def get_pipeline_id() -> str | None:
    """Get the pipeline ID from LlamaCloud by looking up the pipeline by name."""
    global _cached_pipeline_id
    
    if _cached_pipeline_id:
        return _cached_pipeline_id
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # List all pipelines and find the one with our name
            response = await client.get(
                f"{LLAMA_CLOUD_BASE_URL}/api/v1/pipelines",
                headers={
                    "Accept": "application/json",
                    "Authorization": f"Bearer {LLAMA_CLOUD_API_KEY}",
                },
                params={
                    "project_name": LLAMA_CLOUD_PROJECT_NAME,
                    "pipeline_name": LLAMA_CLOUD_INDEX_NAME,
                }
            )
            
            logger.info(f"Pipeline lookup response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Failed to list pipelines: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            logger.info(f"Pipeline lookup response: {data}")
            
            # Find the pipeline with matching name
            pipelines = data if isinstance(data, list) else data.get("pipelines", [])
            for pipeline in pipelines:
                if pipeline.get("name") == LLAMA_CLOUD_INDEX_NAME:
                    _cached_pipeline_id = pipeline.get("id")
                    logger.info(f"Found pipeline ID: {_cached_pipeline_id}")
                    return _cached_pipeline_id
            
            logger.warning(f"Pipeline '{LLAMA_CLOUD_INDEX_NAME}' not found")
            return None
    except Exception as e:
        logger.error(f"Error looking up pipeline ID: {e}")
        return None


async def retrieve_context(query: str) -> str:
    """Retrieve relevant context from LlamaCloud."""
    try:
        # First get the pipeline ID
        pipeline_id = await get_pipeline_id()
        
        if not pipeline_id:
            logger.warning("Could not get pipeline ID, skipping retrieval")
            return ""
        
        url = f"{LLAMA_CLOUD_BASE_URL}/api/v1/pipelines/{pipeline_id}/retrieve"
        logger.info(f"Calling LlamaCloud retrieve: {url}")
        logger.info(f"Query: {query}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {LLAMA_CLOUD_API_KEY}",
                },
                json={
                    "query": query,
                    "similarity_top_k": 3,
                },
            )

            logger.info(f"LlamaCloud response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.warning(f"LlamaCloud retrieval failed: {response.status_code}")
                logger.warning(f"Response body: {response.text}")
                return ""

            data = response.json()
            logger.info(f"LlamaCloud response data keys: {data.keys() if isinstance(data, dict) else 'not a dict'}")
            logger.info(f"Full response: {data}")

            # Extract text from retrieved nodes
            if data.get("retrievals") and isinstance(data["retrievals"], list):
                context = "\n\n".join([r.get("text", "") for r in data["retrievals"]])
                logger.info(f"Retrieved context length: {len(context)} chars")
                return context

            return ""
    except Exception as e:
        logger.error(f"Error retrieving context: {e}")
        return ""


def get_traits_context(message: str) -> str:
    """
    Detect trait-related queries and fetch relevant data from the traits database.
    
    Returns formatted context string with trait information.
    """
    message_lower = message.lower()
    context_parts = []
    
    # ==== CHECK FOR PUNNETT SQUARE / CROSS QUERIES ====
    cross_keywords = ["cross", "punnett", "×", "offspring", "genotype", "phenotype"]
    if any(keyword in message_lower for keyword in cross_keywords):
        cross_data = parse_cross_from_message(message)
        if cross_data.get("found"):
            p1 = cross_data["parent1"]
            p2 = cross_data["parent2"]
            result = calculate_punnett_square(p1, p2)
            
            if result.get("success"):
                # Format the Punnett square results nicely
                genotype_info = []
                for g in result["offspring_genotypes"]:
                    genotype_info.append(f"  - {g['genotype']}: {g['percentage']} ({g['phenotype']})")
                
                phenotype_info = []
                for p in result["offspring_phenotypes"]:
                    phenotype_info.append(f"  - {p['phenotype']}: {p['percentage']}")
                
                # Build the Punnett square grid as text
                grid = result.get("punnett_square", {})
                grid_text = ""
                if grid:
                    header = grid.get("header", [])
                    rows = grid.get("rows", [])
                    grid_text = f"\nPunnett Square:\n"
                    grid_text += "    " + "  ".join(header[1:]) + "\n"
                    for row in rows:
                        grid_text += f" {row[0]}  " + "  ".join(row[1:]) + "\n"
                
                context_parts.append(f"""
PUNNETT SQUARE CALCULATION RESULTS:
Cross: {p1} × {p2}
Cross Type: {result['cross_type']}
{grid_text}
Offspring Genotypes:
{chr(10).join(genotype_info)}

Genotype Ratio: {result['genotype_ratio']}
Phenotype Ratio: {result['phenotype_ratio']}

Summary: {result['summary']}
""")
    
    # ==== CHECK FOR COUNT QUERIES ====
    count_patterns = [
        r"how many traits",
        r"number of traits",
        r"total traits",
        r"traits.*count",
        r"count.*traits",
        r"traits.*available",
        r"traits.*have",
        r"traits.*database"
    ]
    
    if any(re.search(pattern, message_lower) for pattern in count_patterns):
        count_data = get_traits_count()
        if not count_data.get("error"):
            context_parts.append(f"""
TRAITS DATABASE INFO:
{count_data['message']}
- Total traits: {count_data['total_traits']}
- Monogenic traits (single gene): {count_data['monogenic_traits']}
- Polygenic traits (multiple genes): {count_data['polygenic_traits']}
""")
    
    # ==== CHECK FOR TRAIT EXPLANATION QUERIES ====
    explain_patterns = [
        r"explain\s+(.+?)(?:\s+trait)?$",
        r"tell me about\s+(.+?)(?:\s+trait)?$",
        r"what is\s+(.+?)(?:\s+trait)?$",
        r"describe\s+(.+?)(?:\s+trait)?$",
        r"how does\s+(.+?)\s+work",
        r"information about\s+(.+)",
        r"details on\s+(.+)",
    ]
    
    for pattern in explain_patterns:
        match = re.search(pattern, message_lower)
        if match:
            trait_query = match.group(1).strip()
            # Skip generic words
            if trait_query not in ["the", "a", "this", "it", "that", "trait", "genetics"]:
                trait_details = get_trait_details(trait_query)
                if trait_details.get("found"):
                    context_parts.append(f"""
TRAIT DETAILS FROM DATABASE:
Trait Name: {trait_details['name']}
Type: {trait_details['type']}
Inheritance: {trait_details['inheritance']}
Gene(s): {trait_details['genes']}
Chromosome(s): {trait_details['chromosomes']}
Alleles: {', '.join(trait_details['alleles'])}
Phenotypes: {'; '.join(trait_details['phenotype_summary'])}

Description: {trait_details['description']}
""")
                break
    
    # ==== SEARCH FOR RELATED TRAITS ====
    search_patterns = [
        r"search.*trait.*(.+)",
        r"find.*trait.*(.+)",
        r"traits.*related to\s+(.+)",
        r"(.+)\s+traits?",
        r"list.*(.+)\s+traits",
    ]
    
    # Also check for specific trait names in the message
    if not context_parts:
        # Try a general search with the message
        search_result = search_traits(message_lower, limit=3)
        if search_result.get("found") and search_result.get("count", 0) > 0:
            results = search_result.get("results", [])
            if results:
                traits_info = []
                for r in results[:3]:
                    traits_info.append(f"- {r['name']} ({r['type']}, {r['inheritance']})")
                
                context_parts.append(f"""
RELATED TRAITS FROM DATABASE:
Found {len(results)} matching trait(s):
{chr(10).join(traits_info)}

(User can ask for more details about any of these traits)
""")
    
    return "\n".join(context_parts)



@router.get("/status")
async def get_chatbot_status():
    """
    Public endpoint to check if chatbot is enabled.
    Used by frontend to show/hide the chat button.
    """
    try:
        settings = get_chatbot_settings()
        return {"enabled": settings.enabled}
    except Exception as e:
        logger.warning(f"Failed to check chatbot status: {e}")
        # Default to enabled if we can't check
        return {"enabled": True}


@router.get("/rate-limit")
async def get_rate_limit_status(userId: str | None = None, userRole: str | None = None):
    """
    Public endpoint to get the current user's rate limit status.
    Used by frontend to display token usage bar in real-time.

    Returns:
        - tokens_used: Total tokens consumed in current cycle
        - tokens_remaining: Tokens remaining before limit
        - max_tokens: Maximum tokens allowed per cycle (25,000)
        - reset_time: ISO timestamp when quota resets
        - is_limited: Boolean indicating if user hit limit
        - cooldown_active: Boolean indicating active cooldown
        - cooldown_hours: Duration of cooldown in hours (5)
    """
    try:
        user_id = userId or "anonymous"

        # Check if user is admin or super admin
        is_admin = userRole in ["admin", "super_admin"] if userRole else False

        # Use check_limit to get proper usage with admin unlimited tokens support
        _, usage = get_rate_limiter().check_limit(user_id, is_admin=is_admin)

        return {
            "tokens_used": usage["tokens_used"],
            "tokens_remaining": usage["tokens_remaining"],
            "max_tokens": get_rate_limiter().max_tokens,
            "reset_time": usage["reset_time"],
            "is_limited": usage["is_limited"],
            "cooldown_active": usage["cooldown_active"],
            "cooldown_hours": get_rate_limiter().cooldown_seconds // 3600,
            "admin_unlimited": usage.get("admin_unlimited", False)
        }
    except Exception as e:
        logger.error(f"Error fetching rate limit status: {e}")
        # Return default values on error
        return {
            "tokens_used": 0,
            "tokens_remaining": 25000,
            "max_tokens": 25000,
            "reset_time": None,
            "is_limited": False,
            "cooldown_active": False,
            "cooldown_hours": 5
        }


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Chat endpoint that retrieves context from LlamaCloud and generates
    a response using Claude AI with page context awareness.
    
    Features:
    - Caching to reduce API token consumption
    - Conversation memory for context-aware follow-ups
    - Token usage tracking per user
    - Rate limiting (25,000 tokens per 5 hours)
    """
    try:
        # Step 0: Check if chatbot is enabled and get settings
        response_caching_enabled = True  # Default to enabled if settings fetch fails
        try:
            settings = get_chatbot_settings()
            if not settings.enabled:
                return ChatResponse(
                    response="🔧 The chatbot is currently disabled for maintenance. Please check back later!",
                    usage=None
                )
            # Get response caching setting
            response_caching_enabled = settings.response_caching
            logger.info(f"Response caching is {'enabled' if response_caching_enabled else 'disabled'}")
        except Exception as e:
            logger.warning(f"Failed to check chatbot enabled status: {e}")
            # Continue if we can't check - fail open for availability

        # Get user ID for rate limiting
        user_id = request.userId or "anonymous"

        # Check if user is admin or super admin
        is_admin = request.userRole in ["admin", "super_admin"] if request.userRole else False

        # Step 0: Check rate limit FIRST
        is_allowed, usage_info = get_rate_limiter().check_limit(user_id, is_admin=is_admin)
        
        if not is_allowed:
            # User has exceeded their token limit
            reset_seconds = get_rate_limiter().get_reset_time_remaining(user_id)
            reset_minutes = reset_seconds // 60 if reset_seconds else 0
            reset_hours = reset_minutes // 60
            reset_mins_remaining = reset_minutes % 60
            
            time_str = f"{reset_hours}h {reset_mins_remaining}m" if reset_hours > 0 else f"{reset_minutes}m"
            
            return ChatResponse(
                response=f"⏳ You've reached your chat limit for now. Your limit will reset in **{time_str}**. This helps us keep the service free for everyone!",
                usage=usage_info
            )
        
        # Get page name for cache key
        page_name = request.pageContext.pageName if request.pageContext else ""
        
        # Get or generate a session ID for conversation memory
        session_id = request.sessionId or user_id
        
        # Get conversation history for this session
        conversation_history = get_conversation_memory().get_history(session_id)
        
        # For short follow-up questions (like "how?", "why?"), skip cache
        is_followup = len(request.message.strip()) < 20 and conversation_history

        # Step 1: Check cache first (but not for follow-up questions that need context)
        # Only use cache if response_caching_enabled is True
        if not is_followup and response_caching_enabled:
            cached_response = get_response_cache().get(
                message=request.message,
                page_name=page_name
            )

            if cached_response:
                logger.info(f"Returning cached response for: '{request.message[:50]}...'")
                # Log cache hit (0 tokens used - doesn't count against rate limit)
                _log_token_usage(
                    user_id=request.userId,
                    user_name=request.userName,
                    input_tokens=0,
                    output_tokens=0,
                    cached=True,
                    message_preview=request.message[:100]
                )
                # Still add to conversation memory for context
                get_conversation_memory().add_message(session_id, "user", request.message)
                get_conversation_memory().add_message(session_id, "assistant", cached_response)

                # Return with current usage info
                return ChatResponse(response=cached_response, usage=usage_info)
        
        # Step 2: Retrieve relevant context from LlamaCloud
        llama_context = await retrieve_context(request.message)
        
        # Step 3: Get traits-specific context from the traits database
        traits_context = get_traits_context(request.message)
        
        # Step 4: Combine contexts
        combined_context = llama_context
        if traits_context:
            combined_context = f"{traits_context}\n\n{llama_context}" if llama_context else traits_context
            logger.info(f"Added traits context: {len(traits_context)} chars")

        # Step 5: Generate response using Claude with context, page context, user name, and conversation history
        user_name = request.userName or "there"
        response, token_usage = await get_claude_ai_service().generate_response(
            user_message=request.message, 
            context=combined_context, 
            page_context=request.pageContext, 
            user_name=user_name,
            conversation_history=conversation_history
        )
        
        # Step 6: Store in conversation memory
        get_conversation_memory().add_message(session_id, "user", request.message)
        get_conversation_memory().add_message(session_id, "assistant", response)
        
        # Step 7: Calculate and record token usage for rate limiting
        total_tokens = token_usage.get("input_tokens", 0) + token_usage.get("output_tokens", 0)
        get_rate_limiter().record_usage(user_id, total_tokens)
        
        # Get updated usage info after recording
        _, updated_usage = get_rate_limiter().check_limit(user_id, is_admin=is_admin)
        
        # Step 8: Log token usage for admin tracking
        _log_token_usage(
            user_id=request.userId,
            user_name=request.userName,
            input_tokens=token_usage.get("input_tokens", 0),
            output_tokens=token_usage.get("output_tokens", 0),
            cached=False,
            message_preview=request.message[:100],
            model=token_usage.get("model")
        )
        
        # Step 9: Cache the response for future requests (but not short follow-ups)
        # Only cache if response_caching_enabled is True
        if not is_followup and response_caching_enabled:
            get_response_cache().set(
                message=request.message,
                response=response,
                page_name=page_name
            )

        return ChatResponse(response=response, usage=updated_usage)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Sorry, I encountered an error. Please try again!",
        )


def _log_token_usage(
    user_id: str | None,
    user_name: str | None,
    input_tokens: int,
    output_tokens: int,
    cached: bool,
    message_preview: str,
    model: str | None = None
):
    """Log token usage to MongoDB for admin tracking."""
    try:
        from ..services.common import get_token_usage_collection
        
        collection = get_token_usage_collection()
        if collection is None:
            return  # MongoDB not available
        
        doc = {
            "user_id": user_id or "anonymous",
            "user_name": user_name or "Unknown",
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "cached": cached,
            "message_preview": message_preview,
            "model": model or CLAUDE_MODEL,
            "timestamp": datetime.now(timezone.utc),
        }
        
        collection.insert_one(doc)
        logger.debug(f"Logged token usage: {input_tokens + output_tokens} tokens for user {user_id or 'anonymous'}")
    except Exception as e:
        logger.warning(f"Failed to log token usage: {e}")





@router.get("/cache/stats")
async def get_cache_stats():
    """
    Get cache statistics for monitoring.
    
    Returns:
        - size: Current number of cached responses
        - max_size: Maximum cache capacity
        - hits: Number of cache hits
        - misses: Number of cache misses
        - hit_rate: Cache hit rate percentage
        - ttl_seconds: Time-to-live for cache entries
    """
    return get_response_cache().get_stats()


@router.post("/cache/clear")
async def clear_cache():
    """
    Clear all cached responses.
    
    Use this when prompts or responses change and you want to invalidate old cache.
    """
    get_response_cache().clear()
    return {"message": "Cache cleared successfully", "stats": get_response_cache().get_stats()}


# =============================================================================
# ADMIN TOKEN USAGE ENDPOINTS
# =============================================================================

@router.get("/admin/token-usage")
async def get_token_usage_stats():
    """
    Get aggregate token usage statistics for all users.
    
    Returns:
        - total_tokens: Total tokens consumed across all users
        - total_requests: Total number of API requests
        - cached_requests: Number of requests served from cache
        - users: List of users with their token consumption
    """
    try:
        from ..services.common import get_token_usage_collection
        
        collection = get_token_usage_collection()
        if collection is None:
            return {"error": "MongoDB not available", "users": []}
        
        # Aggregate token usage by user
        pipeline = [
            {
                "$group": {
                    "_id": "$user_id",
                    "user_name": {"$last": "$user_name"},
                    "total_input_tokens": {"$sum": "$input_tokens"},
                    "total_output_tokens": {"$sum": "$output_tokens"},
                    "total_tokens": {"$sum": "$total_tokens"},
                    "request_count": {"$sum": 1},
                    "cached_count": {
                        "$sum": {"$cond": [{"$eq": ["$cached", True]}, 1, 0]}
                    },
                    "last_request": {"$max": "$timestamp"},
                }
            },
            {"$sort": {"total_tokens": -1}}
        ]
        
        results = list(collection.aggregate(pipeline))
        
        # Calculate totals
        total_tokens = sum(r.get("total_tokens", 0) for r in results)
        total_requests = sum(r.get("request_count", 0) for r in results)
        cached_requests = sum(r.get("cached_count", 0) for r in results)
        
        # Format user data
        users = []
        for r in results:
            users.append({
                "user_id": r["_id"],
                "user_name": r.get("user_name", "Unknown"),
                "total_tokens": r.get("total_tokens", 0),
                "input_tokens": r.get("total_input_tokens", 0),
                "output_tokens": r.get("total_output_tokens", 0),
                "request_count": r.get("request_count", 0),
                "cached_count": r.get("cached_count", 0),
                "cache_hit_rate": f"{(r.get('cached_count', 0) / r.get('request_count', 1)) * 100:.1f}%",
                "last_request": r.get("last_request").isoformat() if r.get("last_request") else None,
            })
        
        return {
            "total_tokens": total_tokens,
            "total_input_tokens": sum(r.get("total_input_tokens", 0) for r in results),
            "total_output_tokens": sum(r.get("total_output_tokens", 0) for r in results),
            "total_requests": total_requests,
            "cached_requests": cached_requests,
            "cache_hit_rate": f"{(cached_requests / total_requests * 100) if total_requests > 0 else 0:.1f}%",
            "user_count": len(users),
            "users": users,
        }
    except Exception as e:
        logger.error(f"Error fetching token usage stats: {e}")
        return {"error": str(e), "users": []}


@router.get("/admin/token-usage/{user_id}")
async def get_user_token_usage(user_id: str, limit: int = 50):
    """
    Get detailed token usage history for a specific user.
    
    Args:
        user_id: The user ID to fetch history for
        limit: Maximum number of records to return (default 50)
    
    Returns:
        - user_id: The requested user ID
        - total_tokens: Total tokens consumed by this user
        - history: List of recent token usage records
    """
    try:
        from ..services.common import get_token_usage_collection
        
        collection = get_token_usage_collection()
        if collection is None:
            return {"error": "MongoDB not available", "history": []}
        
        # Get recent history for user
        history = list(
            collection.find({"user_id": user_id})
            .sort("timestamp", -1)
            .limit(limit)
        )
        
        # Calculate totals for this user
        total_tokens = sum(h.get("total_tokens", 0) for h in history)
        
        # Format history
        formatted_history = []
        for h in history:
            formatted_history.append({
                "timestamp": h.get("timestamp").isoformat() if h.get("timestamp") else None,
                "input_tokens": h.get("input_tokens", 0),
                "output_tokens": h.get("output_tokens", 0),
                "total_tokens": h.get("total_tokens", 0),
                "cached": h.get("cached", False),
                "message_preview": h.get("message_preview", ""),
                "model": h.get("model", "unknown"),
            })
        
        return {
            "user_id": user_id,
            "total_tokens": total_tokens,
            "request_count": len(history),
            "history": formatted_history,
        }
    except Exception as e:
        logger.error(f"Error fetching user token usage: {e}")
        return {"error": str(e), "history": []}


@router.get("/admin/token-usage-daily")
async def get_daily_token_usage(days: int = 30):
    """
    Get daily aggregated token usage for the last N days.
    
    Args:
        days: Number of days to fetch (default 30)
    
    Returns:
        - daily_usage: List of daily token usage with date, tokens, requests, and cost
    """
    try:
        from ..services.common import get_token_usage_collection
        from datetime import timedelta
        
        collection = get_token_usage_collection()
        if collection is None:
            return {"error": "MongoDB not available", "daily_usage": []}
        
        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Aggregate by day with model-specific calculations
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$timestamp"},
                        "month": {"$month": "$timestamp"},
                        "day": {"$dayOfMonth": "$timestamp"},
                        "model": "$model"
                    },
                    "total_tokens": {"$sum": "$total_tokens"},
                    "input_tokens": {"$sum": "$input_tokens"},
                    "output_tokens": {"$sum": "$output_tokens"},
                    "request_count": {"$sum": 1},
                    "cached_count": {
                        "$sum": {"$cond": [{"$eq": ["$cached", True]}, 1, 0]}
                    },
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
        ]

        results = list(collection.aggregate(pipeline))

        # Group by date and calculate total costs across all models
        daily_data = {}
        for r in results:
            date_str = f"{r['_id']['year']}-{r['_id']['month']:02d}-{r['_id']['day']:02d}"
            model = r['_id'].get('model', 'claude-3-haiku-20240307')

            if date_str not in daily_data:
                daily_data[date_str] = {
                    "total_tokens": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "request_count": 0,
                    "cached_count": 0,
                    "unique_users": set(),
                    "cost": 0.0
                }

            input_tokens = r.get("input_tokens", 0)
            output_tokens = r.get("output_tokens", 0)

            # Calculate cost using model-specific pricing
            cost = calculate_cost(input_tokens, output_tokens, model or 'claude-3-haiku-20240307')

            daily_data[date_str]["total_tokens"] += r.get("total_tokens", 0)
            daily_data[date_str]["input_tokens"] += input_tokens
            daily_data[date_str]["output_tokens"] += output_tokens
            daily_data[date_str]["request_count"] += r.get("request_count", 0)
            daily_data[date_str]["cached_count"] += r.get("cached_count", 0)
            daily_data[date_str]["unique_users"].update(r.get("unique_users", []))
            daily_data[date_str]["cost"] += cost

        # Format results
        daily_usage = []
        for date_str in sorted(daily_data.keys()):
            data = daily_data[date_str]
            input_tokens = data["input_tokens"]
            output_tokens = data["output_tokens"]
            cost = data["cost"]

            daily_usage.append({
                "date": date_str,
                "total_tokens": data["total_tokens"],
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "request_count": data["request_count"],
                "cached_count": data["cached_count"],
                "unique_users": len(data["unique_users"]),
                "cost": round(cost, 4)
            })
        
        # Calculate totals and projections
        total_tokens = sum(d["total_tokens"] for d in daily_usage)
        total_cost = sum(d["cost"] for d in daily_usage)
        avg_daily_tokens = total_tokens / len(daily_usage) if daily_usage else 0
        avg_daily_cost = total_cost / len(daily_usage) if daily_usage else 0
        
        return {
            "daily_usage": daily_usage,
            "summary": {
                "total_tokens": total_tokens,
                "total_cost": round(total_cost, 4),
                "avg_daily_tokens": round(avg_daily_tokens, 0),
                "avg_daily_cost": round(avg_daily_cost, 4),
                "projected_monthly_tokens": round(avg_daily_tokens * 30, 0),
                "projected_monthly_cost": round(avg_daily_cost * 30, 4),
                "days_with_data": len(daily_usage)
            }
        }
    except Exception as e:
        logger.error(f"Error fetching daily token usage: {e}")
        return {"error": str(e), "daily_usage": []}
