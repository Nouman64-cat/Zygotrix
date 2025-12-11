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

from ..prompt_engineering.prompts import ZIGI_SYSTEM_PROMPT
from ..chatbot_tools import (
    get_traits_count, 
    search_traits, 
    get_trait_details,
    calculate_punnett_square,
    parse_cross_from_message
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# Configuration - API keys from environment variables
LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")
LLAMA_CLOUD_BASE_URL = "https://api.cloud.eu.llamaindex.ai"
LLAMA_CLOUD_INDEX_NAME = "Zygotrix"
LLAMA_CLOUD_ORG_ID = "7e4d6187-f46d-4435-a999-768d5c727cf1"
LLAMA_CLOUD_PROJECT_NAME = "Default"

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")

# Debug logging - show if keys are loaded (masked for security)
logger.info(f"CLAUDE_API_KEY loaded: {'Yes' if CLAUDE_API_KEY else 'No'} (first 10 chars: {CLAUDE_API_KEY[:10] if CLAUDE_API_KEY else 'None'}...)")
logger.info(f"LLAMA_CLOUD_API_KEY loaded: {'Yes' if LLAMA_CLOUD_API_KEY else 'No'}")

# Cache the pipeline ID to avoid repeated lookups
_cached_pipeline_id: str | None = None


# =============================================================================
# LLM RESPONSE CACHE
# =============================================================================

class LLMResponseCache:
    """
    Simple in-memory TTL cache for LLM responses.
    
    Features:
    - TTL-based expiration (default 1 hour)
    - LRU eviction when max size reached
    - Hash-based cache keys for consistent lookups
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache: OrderedDict[str, dict] = OrderedDict()
        self.hits = 0
        self.misses = 0
    
    def _generate_key(self, message: str, context: str = "", page_name: str = "") -> str:
        """Generate a unique cache key from the inputs."""
        # Normalize message (lowercase, strip whitespace)
        normalized_msg = message.lower().strip()
        
        # Create a hash of the key components
        key_data = f"{normalized_msg}|{page_name}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, message: str, context: str = "", page_name: str = "") -> Optional[str]:
        """Get a cached response if it exists and hasn't expired."""
        key = self._generate_key(message, context, page_name)
        
        if key in self.cache:
            entry = self.cache[key]
            
            # Check if expired
            if time.time() - entry["timestamp"] < self.ttl_seconds:
                self.hits += 1
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                logger.info(f"Cache HIT for message: '{message[:50]}...' (hits: {self.hits})")
                return entry["response"]
            else:
                # Expired, remove it
                del self.cache[key]
        
        self.misses += 1
        return None
    
    def set(self, message: str, response: str, context: str = "", page_name: str = ""):
        """Store a response in the cache."""
        key = self._generate_key(message, context, page_name)
        
        # Evict oldest entries if cache is full
        while len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)
        
        self.cache[key] = {
            "response": response,
            "timestamp": time.time(),
            "message": message[:100]  # Store first 100 chars for debugging
        }
        logger.info(f"Cached response for: '{message[:50]}...' (cache size: {len(self.cache)})")
    
    def clear(self):
        """Clear all cached entries."""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "ttl_seconds": self.ttl_seconds
        }


# Global cache instance
_response_cache = LLMResponseCache(
    max_size=1000,      # Max 1000 cached responses
    ttl_seconds=3600    # Cache for 1 hour
)



class PageContext(BaseModel):
    pageName: str
    description: str
    features: list[str]


class ChatRequest(BaseModel):
    message: str
    pageContext: PageContext | None = None
    userName: str | None = None
    userId: str | None = None  # For token usage tracking


class ChatResponse(BaseModel):
    response: str


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

async def generate_response(user_message: str, context: str, page_context: PageContext | None = None, user_name: str = "there") -> tuple[str, dict]:
    """
    Generate response using Claude AI.
    
    Returns:
        tuple: (response_text, token_usage_dict)
               token_usage_dict contains: input_tokens, output_tokens
    """
    try:
        # Format system prompt with user's name
        system_prompt = ZIGI_SYSTEM_PROMPT.format(user_name=user_name)
        
        # Build page context information
        page_info = ""
        if page_context:
            features_list = "\n".join([f"- {feature}" for feature in page_context.features])
            page_info = f"""
CURRENT PAGE CONTEXT:
The user is currently on: {page_context.pageName}
Page Description: {page_context.description}
Available Features on this page:
{features_list}
"""

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": CLAUDE_API_KEY,
                    "content-type": "application/json",
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 200,
                    "temperature": 0.7,
                    "system": system_prompt,
                    "messages": [
                        {
                            "role": "user",
                            "content": f"""{page_info}

Background information (use this to answer, but don't copy it directly):
{context}

Question: {user_message}

Remember: Answer in 2-4 simple, friendly sentences. No technical jargon. No bullet points. Just talk naturally like you're explaining to a friend.""",
                        }
                    ],
                },
            )

            if response.status_code != 200:
                logger.error(f"Claude API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to generate response from AI",
                )

            data = response.json()
            
            # Extract token usage from response
            token_usage = {
                "input_tokens": data.get("usage", {}).get("input_tokens", 0),
                "output_tokens": data.get("usage", {}).get("output_tokens", 0),
                "model": CLAUDE_MODEL,
            }

            if data.get("content") and len(data["content"]) > 0:
                return data["content"][0].get("text", "I'm sorry, I couldn't generate a response."), token_usage

            return "I'm sorry, I couldn't generate a response. Please try again!", token_usage
    except httpx.HTTPError as e:
        logger.error(f"HTTP error generating response: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to connect to AI service",
        )
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating response",
        )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Chat endpoint that retrieves context from LlamaCloud and generates
    a response using Claude AI with page context awareness.
    
    Features caching to reduce API token consumption.
    Tracks token usage per user for admin monitoring.
    """
    try:
        # Get page name for cache key
        page_name = request.pageContext.pageName if request.pageContext else ""
        
        # Step 0: Check cache first (no tokens used for cache hits!)
        cached_response = _response_cache.get(
            message=request.message,
            page_name=page_name
        )
        
        if cached_response:
            logger.info(f"Returning cached response for: '{request.message[:50]}...'")
            # Log cache hit (0 tokens used)
            _log_token_usage(
                user_id=request.userId,
                user_name=request.userName,
                input_tokens=0,
                output_tokens=0,
                cached=True,
                message_preview=request.message[:100]
            )
            return ChatResponse(response=cached_response)
        
        # Step 1: Retrieve relevant context from LlamaCloud
        llama_context = await retrieve_context(request.message)
        
        # Step 2: Get traits-specific context from the traits database
        traits_context = get_traits_context(request.message)
        
        # Step 3: Combine contexts
        combined_context = llama_context
        if traits_context:
            combined_context = f"{traits_context}\n\n{llama_context}" if llama_context else traits_context
            logger.info(f"Added traits context: {len(traits_context)} chars")

        # Step 4: Generate response using Claude with context, page context, and user name
        user_name = request.userName or "there"
        response, token_usage = await generate_response(request.message, combined_context, request.pageContext, user_name)
        
        # Step 5: Log token usage for this request
        _log_token_usage(
            user_id=request.userId,
            user_name=request.userName,
            input_tokens=token_usage.get("input_tokens", 0),
            output_tokens=token_usage.get("output_tokens", 0),
            cached=False,
            message_preview=request.message[:100],
            model=token_usage.get("model")
        )
        
        # Step 6: Cache the response for future requests
        _response_cache.set(
            message=request.message,
            response=response,
            page_name=page_name
        )

        return ChatResponse(response=response)
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
    return _response_cache.get_stats()


@router.post("/cache/clear")
async def clear_cache():
    """
    Clear all cached responses.
    
    Use this when prompts or responses change and you want to invalidate old cache.
    """
    _response_cache.clear()
    return {"message": "Cache cleared successfully", "stats": _response_cache.get_stats()}


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
