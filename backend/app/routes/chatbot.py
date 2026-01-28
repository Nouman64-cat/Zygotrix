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

from ..services.chatbot_settings import get_chatbot_settings
from ..services.chatbot.response_cache_service import get_response_cache
from ..services.chatbot.conversation_memory_service import get_conversation_memory
from ..services.chatbot.rate_limiting_service import get_rate_limiter
from ..services.chatbot.claude_ai_service import get_claude_ai_service
from ..services.chatbot.rag_service import get_rag_service
from ..services.chatbot.traits_enrichment_service import get_traits_service
from ..services.chatbot.token_analytics_service import get_token_analytics_service
from ..services.chatbot.query_router import get_query_router

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

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
        
        # DEBUG: Log received userName from frontend request
        logger.info(f"🔍 DEBUG chatbot.py - user_id: {user_id}, userName from request: '{request.userName}'")

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
        # Note: Disabled followup detection to improve cache hit rate
        # is_followup = len(request.message.strip()) < 20 and len(conversation_history) > 0
        is_followup = False  # Temporarily disabled - let all messages be cached

        logger.info(f"Cache check - Message: '{request.message[:50]}...', Page: '{page_name}', IsFollowup: {is_followup}, CacheEnabled: {response_caching_enabled}")

        # Step 1: Check cache first (but not for follow-up questions that need context)
        # Only use cache if response_caching_enabled is True
        if not is_followup and response_caching_enabled:
            cached_response = get_response_cache().get(
                message=request.message,
                page_name=page_name
            )

            if cached_response:
                logger.info(f"✅ CACHE HIT! Returning cached response for: '{request.message[:50]}...'")
                # Log cache hit (0 tokens used - doesn't count against rate limit)
                get_token_analytics_service().log_usage(
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
            else:
                logger.info(f"❌ Cache miss for: '{request.message[:50]}...'")
        else:
            if is_followup:
                logger.info(f"⏭️  Skipping cache (followup question): '{request.message[:50]}...'")
            if not response_caching_enabled:
                logger.info(f"⏭️  Skipping cache (disabled in settings)")
        
        # Check if intelligent routing is enabled
        use_intelligent_routing = os.getenv("ENABLE_INTELLIGENT_ROUTING", "true").lower() == "true"

        if use_intelligent_routing:
            # NEW: Use intelligent routing layer
            logger.info("🧠 Using intelligent routing")
            router = get_query_router()

            routing_result = await router.route_and_execute(
                query=request.message,
                user_id=request.userId,
                user_name=request.userName,
                page_context=request.pageContext,
                conversation_history=conversation_history
            )

            response = routing_result["response"]
            token_usage = routing_result.get("token_usage", {})

            # Log routing decision
            logger.info(
                f"📊 Routing stats: type={routing_result['route_type']}, "
                f"sources={routing_result['sources_used']}, "
                f"confidence={routing_result['confidence']:.2f}, "
                f"time={routing_result['response_time_ms']:.0f}ms"
            )
        else:
            # OLD: Traditional flow (fallback)
            logger.info("🔧 Using traditional routing (fallback mode)")

            # Step 2: Retrieve relevant context from Pinecone
            llama_context = await get_rag_service().retrieve_context(
                request.message,
                user_id=request.userId,
                user_name=request.userName
            )

            # Step 3: Get traits-specific context from the traits database
            traits_context = get_traits_service().get_traits_context(request.message)

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
        get_token_analytics_service().log_usage(
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
            logger.info(f"💾 Cached response for: '{request.message[:50]}...' (page: '{page_name}')")
        else:
            if is_followup:
                logger.info(f"⏭️  Not caching (followup): '{request.message[:50]}...'")
            if not response_caching_enabled:
                logger.info(f"⏭️  Not caching (disabled in settings)")

        return ChatResponse(response=response, usage=updated_usage)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Sorry, I encountered an error. Please try again!",
        )


from fastapi.responses import StreamingResponse
import json

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    """
    Streaming chat endpoint providing real-time text generation (SSE).
    """
    try:
        # Step 0: Check if chatbot is enabled and get settings
        try:
            settings = get_chatbot_settings()
            if not settings.enabled:
                raise HTTPException(status_code=503, detail="Chatbot is disabled")
            response_caching_enabled = settings.response_caching
        except Exception:
            response_caching_enabled = True # Fail open

        # Auth & Rate Limiting Check
        user_id = request.userId or "anonymous"
        is_admin = request.userRole in ["admin", "super_admin"] if request.userRole else False
        
        is_allowed, usage_info = get_rate_limiter().check_limit(user_id, is_admin=is_admin)
        if not is_allowed:
            # For streaming, we can't easily return a JSON body with 200, better to error or send specific event
            # Standard HTTP 429
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        # Context Setup (Similar to /chat)
        page_name = request.pageContext.pageName if request.pageContext else ""
        session_id = request.sessionId or user_id
        conversation_history = get_conversation_memory().get_history(session_id)
        
        # Intelligent Routing (Simplified for Stream: just use fallback/claude for now until router supports stream)
        # For now, bypassing router to ensure streaming works directly
        logger.info("🌊 Streaming Request - Using Direct Claude Service")
        
        # RAG Context Retrieval
        llama_context = await get_rag_service().retrieve_context(
            request.message, user_id=request.userId, user_name=request.userName
        )
        traits_context = get_traits_service().get_traits_context(request.message)
        
        combined_context = llama_context
        if traits_context:
            combined_context = f"{traits_context}\n\n{llama_context}" if llama_context else traits_context

        user_name = request.userName or "there"

        # Generator Wrapper for Side Effects (Recording Usage)
        async def response_generator():
            full_response_text = ""
            final_usage = None
            
            try:
                async for event in get_claude_ai_service().generate_streaming_response(
                    user_message=request.message,
                    context=combined_context,
                    page_context=request.pageContext,
                    user_name=user_name,
                    conversation_history=conversation_history
                ):
                    yield event
                    
                    # Intercept data to track full response and usage
                    if event.startswith("data: "):
                        data_str = event[6:].strip()
                        if data_str == "[DONE]": 
                            break
                        try:
                            payload = json.loads(data_str)
                            if payload.get("type") == "token":
                                full_response_text += payload.get("content", "")
                            elif payload.get("type") == "usage":
                                final_usage = payload.get("usage")
                        except:
                            pass
                
                # Stream finished - Record Stats
                if final_usage:
                    total = final_usage.get("total_tokens", 0)
                    model = final_usage.get("model")
                    
                    # Record Rate Limit
                    get_rate_limiter().record_usage(user_id, total)
                    
                    # Log Analytics
                    get_token_analytics_service().log_usage(
                        user_id=request.userId,
                        user_name=request.userName,
                        input_tokens=final_usage.get("input_tokens", 0),
                        output_tokens=final_usage.get("output_tokens", 0),
                        cached=False,
                        message_preview=request.message[:100],
                        model=model
                    )
                    
                    # Save to Memory
                    get_conversation_memory().add_message(session_id, "user", request.message)
                    get_conversation_memory().add_message(session_id, "assistant", full_response_text)
                    
            except Exception as e:
                logger.error(f"Stream Generator Error: {e}")
                error_payload = json.dumps({"message": "Stream interrupted"})
                yield f"event: error\ndata: {error_payload}\n\n"

        return StreamingResponse(response_generator(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Streaming Setup Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
    return get_token_analytics_service().get_aggregate_stats()

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
    return get_token_analytics_service().get_user_stats(user_id, limit)

@router.get("/admin/token-usage-daily")
async def get_daily_token_usage(days: int = 30):
    """
    Get daily aggregated token usage for the last N days.

    Args:
        days: Number of days to fetch (default 30)

    Returns:
        - daily_usage: List of daily token usage with date, tokens, requests, and cost
    """
    return get_token_analytics_service().get_daily_stats(days)

@router.get("/admin/embedding-usage")
async def get_embedding_usage_stats():
    """
    Get aggregate embedding usage statistics for all users.

    Returns:
        - total_tokens: Total embedding tokens consumed across all users
        - total_cost: Total cost in USD for embeddings
        - total_requests: Total number of embedding requests
        - avg_tokens_per_request: Average tokens per embedding request
        - user_count: Number of users who used embeddings
        - users: List of users with their embedding consumption
    """
    return get_token_analytics_service().get_embedding_stats()

@router.get("/admin/embedding-usage-daily")
async def get_daily_embedding_usage(days: int = 30):
    """
    Get daily aggregated embedding usage for the last N days.

    Args:
        days: Number of days to fetch (default 30)

    Returns:
        - daily_usage: List of daily embedding usage with date, tokens, requests, cost, and model breakdown
        - summary: Summary statistics including totals and projections
    """
    return get_token_analytics_service().get_embedding_daily_stats(days)


@router.get("/admin/routing-health")
async def get_routing_health():
    """
    Get intelligent routing system health status.

    Returns health metrics for monitoring the routing layer.
    """
    import os
    from ..services.chatbot.query_classifier import get_query_classifier

    # Get configuration
    routing_enabled = os.getenv("ENABLE_INTELLIGENT_ROUTING", "true").lower() == "true"
    llm_enabled = os.getenv("ENABLE_LLM_CLASSIFIER", "true").lower() == "true"
    threshold = float(os.getenv("CLASSIFIER_CONFIDENCE_THRESHOLD", "0.85"))

    # Get classifier instance
    classifier = get_query_classifier()

    # Calculate cache stats
    cache_size = len(classifier._cache) if hasattr(classifier, '_cache') else 0
    cache_max = classifier._cache_max_size if hasattr(classifier, '_cache_max_size') else 1000

    return {
        "status": "healthy" if routing_enabled else "disabled",
        "configuration": {
            "routing_enabled": routing_enabled,
            "llm_fallback_enabled": llm_enabled,
            "confidence_threshold": threshold,
            "llm_model": "claude-3-haiku-20240307"
        },
        "cache": {
            "size": cache_size,
            "max_size": cache_max,
            "utilization": f"{(cache_size / cache_max * 100):.1f}%"
        },
        "recommendations": {
            "threshold_too_low": threshold < 0.7,
            "threshold_too_high": threshold > 0.95,
            "cache_full": cache_size >= cache_max * 0.9
        },
        "endpoints": {
            "test_classification": "/api/chatbot/admin/test-routing",
            "health_check": "/api/chatbot/admin/routing-health"
        }
    }


@router.post("/admin/test-routing")
async def test_routing(query: str):
    """
    Test routing classification for a given query.

    Useful for debugging and validating classifier behavior.

    Args:
        query: Query string to classify

    Returns:
        Classification result with route type and confidence
    """
    from ..services.chatbot.query_classifier import get_query_classifier

    classifier = get_query_classifier()
    query_type, confidence = await classifier.classify(query)

    return {
        "query": query,
        "route_type": query_type.value,
        "confidence": confidence,
        "sources_used": {
            "conversational": ["claude_only"],
            "knowledge": ["pinecone", "claude"],
            "genetics_tools": ["mcp_tools", "claude"],
            "hybrid": ["pinecone", "mcp_tools", "claude"]
        }.get(query_type.value, []),
        "estimated_cost": {
            "conversational": 0.0001,
            "knowledge": 0.002,
            "genetics_tools": 0.001,
            "hybrid": 0.003
        }.get(query_type.value, 0.002)
    }