"""
Base Claude Service.

Provides shared functionality for all Claude API interactions.
This base class consolidates common code from:
- ClaudeAIService (chatbot)
- ZygotrixClaudeService (zygotrix_ai)

Following the DRY principle, all shared logic is centralized here.
"""

import os
import json
import logging
import asyncio
import random
from typing import Optional, List, Dict, Tuple, Any, AsyncGenerator
from abc import ABC

import httpx
from fastapi import HTTPException

# Import from centralized config (single source of truth)
from .config import (
    CLAUDE_API_KEY,
    CLAUDE_API_URL,
    ANTHROPIC_VERSION,
)

logger = logging.getLogger(__name__)


# =============================================================================
# BASE CLAUDE SERVICE
# =============================================================================

class BaseClaudeService(ABC):
    """
    Base class for Claude API services.
    
    Provides shared functionality:
    - API configuration and headers
    - Basic request/response handling
    - Streaming support
    - Tool schema caching
    - Token tracking
    - Error handling
    
    Subclasses can override specific methods to customize behavior.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Claude service.
        
        Args:
            api_key: Optional Claude API key (defaults to environment variable)
        """
        self.api_key = api_key or CLAUDE_API_KEY
        self.api_url = CLAUDE_API_URL
        self.anthropic_version = ANTHROPIC_VERSION
        
        # Cache for tool schemas (lazy-loaded)
        self._cached_tools_schema: Optional[list] = None
        
        if not self.api_key:
            logger.warning("CLAUDE_API_KEY not configured")
    
    # =========================================================================
    # HEADER MANAGEMENT
    # =========================================================================
    
    def _get_headers(self, enable_caching: bool = False) -> dict:
        """
        Get headers for Claude API requests.
        
        Args:
            enable_caching: Whether to enable prompt caching beta feature
            
        Returns:
            Headers dictionary for API requests
        """
        headers = {
            "x-api-key": self.api_key,
            "content-type": "application/json",
            "anthropic-version": self.anthropic_version,
        }
        
        # Enable prompt caching beta feature
        if enable_caching:
            headers["anthropic-beta"] = "prompt-caching-2024-07-31"
        
        return headers
    
    # =========================================================================
    # TOOL SCHEMA MANAGEMENT
    # =========================================================================
    
    def _get_tools_schema(self) -> list:
        """
        Get cached tool schema, loading if necessary.
        
        Returns:
            List of tool schemas for Claude API
        """
        if self._cached_tools_schema is None:
            from ...mcp import get_claude_tools_schema
            self._cached_tools_schema = get_claude_tools_schema()
            tool_names = [t.get("name") for t in self._cached_tools_schema]
            logger.info(f"Cached {len(self._cached_tools_schema)} MCP tools: {tool_names}")
        return self._cached_tools_schema
    
    def clear_tools_cache(self) -> None:
        """Clear the cached tool schemas (useful for testing or hot-reloading)."""
        self._cached_tools_schema = None
        logger.debug("Cleared tool schema cache")
    
    # =========================================================================
    # REQUEST BODY BUILDING
    # =========================================================================
    
    def _build_request_body(
        self,
        messages: List[Dict],
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        tools: Optional[List] = None,
        stream: bool = False,
        enable_caching: bool = False,
    ) -> dict:
        """
        Build the request body for Claude API.
        
        Args:
            messages: Conversation messages
            system_prompt: System prompt
            model: Claude model to use
            max_tokens: Maximum tokens for response
            temperature: Temperature setting
            tools: Optional list of tools
            stream: Whether to enable streaming
            enable_caching: Whether to enable prompt caching
            
        Returns:
            Request body dictionary
        """
        # Handle system prompt with caching
        if enable_caching:
            system_blocks = [
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"}
                }
            ]
        else:
            system_blocks = system_prompt
        
        request_body = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_blocks,
            "messages": messages,
        }
        
        if stream:
            request_body["stream"] = True
        
        if tools:
            request_body["tools"] = tools
        
        return request_body
    
    def _apply_message_caching(self, messages: List[Dict]) -> List[Dict]:
        """
        Apply cache control to conversation history.
        
        Marks the second-to-last message as cacheable, allowing
        most of the conversation to be cached while keeping the latest fresh.
        
        Args:
            messages: List of conversation messages
            
        Returns:
            Messages with cache control applied
        """
        if len(messages) <= 2:
            return messages
        
        cacheable_messages = messages.copy()
        cache_point_idx = len(cacheable_messages) - 2
        
        if cache_point_idx >= 0:
            msg = cacheable_messages[cache_point_idx]
            
            # Handle string content
            if isinstance(msg.get("content"), str):
                cacheable_messages[cache_point_idx] = {
                    **msg,
                    "content": [
                        {
                            "type": "text",
                            "text": msg["content"],
                            "cache_control": {"type": "ephemeral"}
                        }
                    ]
                }
            # Handle list content
            elif isinstance(msg.get("content"), list) and len(msg["content"]) > 0:
                content_blocks = msg["content"].copy()
                content_blocks[-1] = {
                    **content_blocks[-1],
                    "cache_control": {"type": "ephemeral"}
                }
                cacheable_messages[cache_point_idx] = {
                    **msg,
                    "content": content_blocks
                }
        
        return cacheable_messages
    
    # =========================================================================
    # TOKEN TRACKING
    # =========================================================================
    
    def _create_token_usage(
        self,
        input_tokens: int,
        output_tokens: int,
        model: str,
        tools_used: Optional[List[Dict]] = None,
        tool_iterations: int = 1,
        cache_creation_tokens: int = 0,
        cache_read_tokens: int = 0,
        extra_fields: Optional[Dict] = None
    ) -> Dict:
        """
        Create a standardized token usage dictionary.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model used
            tools_used: List of tools used
            tool_iterations: Number of tool iterations
            cache_creation_tokens: Tokens used for cache creation
            cache_read_tokens: Tokens read from cache
            extra_fields: Additional fields to include
            
        Returns:
            Token usage dictionary
        """
        usage = {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "model": model,
            "tools_used": tools_used or [],
            "tool_iterations": tool_iterations,
        }
        
        if cache_creation_tokens > 0:
            usage["cache_creation_input_tokens"] = cache_creation_tokens
        
        if cache_read_tokens > 0:
            usage["cache_read_input_tokens"] = cache_read_tokens
        
        if extra_fields:
            usage.update(extra_fields)
        
        return usage
    
    def _log_cache_metrics(
        self,
        cache_read_tokens: int,
        cache_creation_tokens: int,
        total_input_tokens: int
    ) -> None:
        """
        Log prompt caching metrics.
        
        Args:
            cache_read_tokens: Tokens read from cache
            cache_creation_tokens: Tokens used for cache creation
            total_input_tokens: Total input tokens
        """
        if cache_read_tokens > 0:
            logger.info(f"Cache hit: {cache_read_tokens} tokens read from cache (90% cost savings)")
        if cache_creation_tokens > 0:
            logger.info(f"Cache creation: {cache_creation_tokens} tokens cached for future use")
    
    # =========================================================================
    # BASIC API METHODS
    # =========================================================================
    
    async def _make_api_request(
        self,
        request_body: dict,
        enable_caching: bool = False,
        timeout: float = 120.0,
        max_retries: int = 3
    ) -> dict:
        """
        Make a non-streaming API request to Claude with retry logic.
        
        Args:
            request_body: Request body dictionary
            enable_caching: Whether caching is enabled
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries for transient errors
            
        Returns:
            Response data dictionary
            
        Raises:
            HTTPException: If the API returns a non-retriable error or retries are exhausted
        """
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(
                        self.api_url,
                        headers=self._get_headers(enable_caching=enable_caching),
                        json=request_body,
                    )
                    
                    if response.status_code == 200:
                        return response.json()
                        
                    # Check if error is retriable (5xx Server Errors or 429 Rate Limit)
                    if response.status_code >= 500 or response.status_code == 429:
                        error_text = response.text
                        logger.warning(
                            f"Claude API transient error (Attempt {attempt + 1}/{max_retries + 1}): "
                            f"{response.status_code} - {error_text}"
                        )
                        
                        if attempt < max_retries:
                            # Exponential backoff with jitter: 2^attempt * 1s + random(0-1s)
                            delay = (2 ** attempt) + random.random()
                            logger.info(f"Retrying in {delay:.2f} seconds...")
                            await asyncio.sleep(delay)
                            continue
                    
                    # If we get here, it's either a non-retriable error or we've exhausted retries
                    error_text = response.text
                    logger.error(f"Claude API failed: {response.status_code} - {error_text}")
                    raise HTTPException(
                        status_code=500 if response.status_code >= 500 else response.status_code,
                        detail=f"AI Provider Error: {response.status_code}"
                    )
            
            except httpx.RequestError as e:
                # Network level errors (connection refused, timeout, etc) are also retriable
                logger.warning(
                    f"Claude API network error (Attempt {attempt + 1}/{max_retries + 1}): {str(e)}"
                )
                last_exception = e
                
                if attempt < max_retries:
                    delay = (2 ** attempt) + random.random()
                    logger.info(f"Retrying network error in {delay:.2f} seconds...")
                    await asyncio.sleep(delay)
                    continue
                    
        # If we exit the loop, we failed
        logger.error(f"Claude API failed after {max_retries + 1} attempts")
        raise HTTPException(
            status_code=503,
            detail="AI Service Unavailable after multiple retries"
        ) from last_exception
    
    async def _stream_api_request(
        self,
        request_body: dict,
        enable_caching: bool = False,
        timeout: float = 120.0
    ) -> AsyncGenerator[dict, None]:
        """
        Make a streaming API request to Claude.
        
        Args:
            request_body: Request body dictionary (should include stream=True)
            enable_caching: Whether caching is enabled
            timeout: Request timeout in seconds
            
        Yields:
            Event dictionaries from the stream
        """
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                self.api_url,
                headers=self._get_headers(enable_caching=enable_caching),
                json=request_body,
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    logger.error(f"Claude API Streaming Error: {response.status_code} - {error_text}")
                    yield {"type": "error", "error": "AI Service Unavailable"}
                    return
                
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    
                    try:
                        yield json.loads(data_str)
                    except json.JSONDecodeError:
                        continue
    
    # =========================================================================
    # SIMPLE RESPONSE GENERATION
    # =========================================================================
    
    async def generate_simple_response(
        self,
        messages: List[Dict],
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float
    ) -> Tuple[str, Dict]:
        """
        Generate a non-streaming response from Claude (no tools).
        
        Args:
            messages: Conversation messages
            system_prompt: System prompt
            model: Claude model to use
            max_tokens: Maximum tokens for response
            temperature: Temperature setting
            
        Returns:
            Tuple of (content, metadata)
        """
        try:
            request_body = self._build_request_body(
                messages=messages,
                system_prompt=system_prompt,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            
            data = await self._make_api_request(request_body)
            
            # Extract content
            content = ""
            if data.get("content") and len(data["content"]) > 0:
                content = data["content"][0].get("text", "")
            
            # Build metadata
            usage = data.get("usage", {})
            metadata = self._create_token_usage(
                input_tokens=usage.get("input_tokens", 0),
                output_tokens=usage.get("output_tokens", 0),
                model=model,
            )
            
            return content, metadata
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            raise HTTPException(status_code=500, detail="Failed to connect to AI service")
    
    # =========================================================================
    # STREAMING RESPONSE GENERATION
    # =========================================================================
    
    async def stream_simple_response(
        self,
        messages: List[Dict],
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float
    ) -> AsyncGenerator[Dict, None]:
        """
        Stream a response from Claude (no tools).
        
        Args:
            messages: Conversation messages
            system_prompt: System prompt
            model: Claude model to use
            max_tokens: Maximum tokens for response
            temperature: Temperature setting
            
        Yields:
            Dictionaries with type 'content', 'metadata', 'done', or 'error'
        """
        try:
            request_body = self._build_request_body(
                messages=messages,
                system_prompt=system_prompt,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
            )
            
            full_content = ""
            input_tokens = 0
            output_tokens = 0
            
            async for event in self._stream_api_request(request_body):
                event_type = event.get("type")
                
                if event_type == "error":
                    yield event
                    return
                
                if event_type == "content_block_delta":
                    delta = event.get("delta", {})
                    if delta.get("type") == "text_delta":
                        text = delta.get("text", "")
                        full_content += text
                        yield {"type": "content", "content": text}
                
                elif event_type == "message_start":
                    usage = event.get("message", {}).get("usage", {})
                    input_tokens = usage.get("input_tokens", 0)
                
                elif event_type == "message_delta":
                    usage = event.get("usage", {})
                    output_tokens = usage.get("output_tokens", 0)
            
            # Send final metadata
            yield {
                "type": "metadata",
                "metadata": self._create_token_usage(
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    model=model,
                    extra_fields={"full_content": full_content}
                )
            }
            
            yield {"type": "done"}
            
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield {"type": "error", "error": str(e)}
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    def calculate_smart_max_tokens(
        self,
        message: str,
        history_length: int,
        default_max_tokens: int = 4096
    ) -> int:
        """
        Dynamically calculate max_tokens based on message characteristics.
        
        This optimization reduces response latency for simple queries by
        limiting the token budget, while allowing detailed responses when needed.
        
        Args:
            message: The user's message
            history_length: Number of messages in conversation history
            default_max_tokens: The default max tokens from settings
            
        Returns:
            Optimized max_tokens value
        """
        message_lower = message.lower()
        message_len = len(message)
        
        # Keywords indicating user wants a detailed response
        detail_keywords = [
            "explain", "detail", "elaborate", "comprehensive", "thorough",
            "in depth", "step by step", "walk me through", "full analysis",
            "describe", "breakdown", "example", "examples"
        ]
        
        # Keywords indicating user wants a brief response
        brief_keywords = [
            "briefly", "short", "quick", "simple", "just", "only",
            "yes or no", "one word", "summary", "tldr", "tl;dr"
        ]
        
        # Check for detailed response indicators
        wants_detail = any(keyword in message_lower for keyword in detail_keywords)
        wants_brief = any(keyword in message_lower for keyword in brief_keywords)
        
        # Short messages in new conversations likely expect shorter responses
        is_short_query = message_len < 50 and history_length < 3
        
        # Determine token budget
        if wants_brief:
            max_tokens = min(500, default_max_tokens)
            logger.debug(f"Smart tokens: BRIEF mode -> {max_tokens} tokens")
        elif wants_detail:
            max_tokens = min(4096, default_max_tokens)
            logger.debug(f"Smart tokens: DETAILED mode -> {max_tokens} tokens")
        elif is_short_query:
            max_tokens = min(1000, default_max_tokens)
            logger.debug(f"Smart tokens: SHORT QUERY mode -> {max_tokens} tokens")
        else:
            max_tokens = min(2048, default_max_tokens)
            logger.debug(f"Smart tokens: DEFAULT mode -> {max_tokens} tokens")
        
        return max_tokens
