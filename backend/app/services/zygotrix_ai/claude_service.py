"""
Zygotrix Claude Service.

Handles all Claude API interactions for Zygotrix AI,
including streaming, non-streaming, and tool-enabled responses.

Extracted from zygotrix_ai.py as part of Phase 2.5 refactoring.
"""

import os
import json
import logging
from typing import AsyncGenerator, Optional

import httpx
from fastapi import HTTPException
from dotenv import load_dotenv, find_dotenv

from ...mcp import (
    get_claude_tools_schema,
    process_tool_calls,
    extract_tool_calls,
    extract_text_content,
)

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

# Environment variables
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"


class ZygotrixClaudeService:
    """
    Service for Claude API interactions in Zygotrix AI.
    
    Provides:
    - Streaming responses for real-time chat
    - Non-streaming responses for quick queries
    - Tool-enabled responses with MCP integration
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
    
    def _get_tools_schema(self) -> list:
        """Get cached tool schema, loading if necessary."""
        if self._cached_tools_schema is None:
            self._cached_tools_schema = get_claude_tools_schema()
            tool_names = [t.get("name") for t in self._cached_tools_schema]
            logger.info(f"Cached {len(self._cached_tools_schema)} MCP tools: {tool_names}")
        return self._cached_tools_schema
    
    def _get_headers(self, enable_caching: bool = False) -> dict:
        """Get headers for Claude API requests."""
        headers = {
            "x-api-key": self.api_key,
            "content-type": "application/json",
            "anthropic-version": self.anthropic_version,
        }

        # Enable prompt caching beta feature
        if enable_caching:
            headers["anthropic-beta"] = "prompt-caching-2024-07-31"

        return headers
    
    async def stream_response(
        self,
        messages: list,
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float
    ) -> AsyncGenerator[dict, None]:
        """
        Stream response from Claude API.
        
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
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    self.api_url,
                    headers=self._get_headers(),
                    json={
                        "model": model,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "system": system_prompt,
                        "messages": messages,
                        "stream": True,
                    }
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Claude API error: {response.status_code} - {error_text}")
                        yield {"type": "error", "error": "Failed to generate response"}
                        return

                    full_content = ""
                    input_tokens = 0
                    output_tokens = 0

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break

                            try:
                                data = json.loads(data_str)
                                event_type = data.get("type")

                                if event_type == "content_block_delta":
                                    delta = data.get("delta", {})
                                    if delta.get("type") == "text_delta":
                                        text = delta.get("text", "")
                                        full_content += text
                                        yield {"type": "content", "content": text}

                                elif event_type == "message_start":
                                    usage = data.get("message", {}).get("usage", {})
                                    input_tokens = usage.get("input_tokens", 0)

                                elif event_type == "message_delta":
                                    usage = data.get("usage", {})
                                    output_tokens = usage.get("output_tokens", 0)

                            except json.JSONDecodeError:
                                continue

                    # Send final metadata
                    yield {
                        "type": "metadata",
                        "metadata": {
                            "input_tokens": input_tokens,
                            "output_tokens": output_tokens,
                            "total_tokens": input_tokens + output_tokens,
                            "model": model,
                            "full_content": full_content,
                        }
                    }

                    yield {"type": "done"}

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield {"type": "error", "error": str(e)}
    
    async def generate_response(
        self,
        messages: list,
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float
    ) -> tuple[str, dict]:
        """
        Generate non-streaming response from Claude.
        
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
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self._get_headers(),
                    json={
                        "model": model,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "system": system_prompt,
                        "messages": messages,
                    }
                )

                if response.status_code != 200:
                    raise HTTPException(status_code=500, detail="Failed to generate response")

                data = response.json()
                content = ""
                if data.get("content") and len(data["content"]) > 0:
                    content = data["content"][0].get("text", "")

                usage = data.get("usage", {})
                metadata = {
                    "input_tokens": usage.get("input_tokens", 0),
                    "output_tokens": usage.get("output_tokens", 0),
                    "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
                    "model": model,
                }

                return content, metadata

        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            raise HTTPException(status_code=500, detail="Failed to connect to AI service")
    
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
            # User explicitly wants brief - use minimal tokens
            max_tokens = min(500, default_max_tokens)
            logger.debug(f"Smart tokens: BRIEF mode -> {max_tokens} tokens")
        elif wants_detail:
            # User wants detailed response - use higher budget
            max_tokens = min(4096, default_max_tokens)
            logger.debug(f"Smart tokens: DETAILED mode -> {max_tokens} tokens")
        elif is_short_query:
            # Short query, likely expects moderate response
            max_tokens = min(1000, default_max_tokens)
            logger.debug(f"Smart tokens: SHORT QUERY mode -> {max_tokens} tokens")
        else:
            # Default case - use standard budget
            max_tokens = min(2048, default_max_tokens)
            logger.debug(f"Smart tokens: DEFAULT mode -> {max_tokens} tokens")
        
        return max_tokens
    
    async def generate_response_with_tools(
        self,
        messages: list,
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        use_tools: bool = True,
        max_tool_iterations: int = 5,
        enable_caching: bool = True,
    ) -> tuple[str, dict]:
        """
        Generate response from Claude with native tool calling support and prompt caching.

        This function allows Claude to autonomously decide when to use tools.
        It handles the tool-use loop automatically and uses prompt caching to reduce costs.

        Args:
            messages: Conversation messages
            system_prompt: System prompt
            model: Claude model to use
            max_tokens: Maximum tokens for response
            temperature: Temperature setting
            use_tools: Whether to enable tool use
            max_tool_iterations: Maximum number of tool call iterations
            enable_caching: Whether to enable prompt caching (default: True)

        Returns:
            Tuple of (final_content, metadata)
        """
        # Use cached tools schema for better performance
        tools = self._get_tools_schema() if use_tools else []
        total_input_tokens = 0
        total_output_tokens = 0
        total_cache_creation_tokens = 0
        total_cache_read_tokens = 0
        tools_used = []
        breeding_widget_data = None  # Track breeding simulation data if tool is used
        dna_rna_widget_data = None  # Track DNA/RNA visualization data if tool is used
        gwas_widget_data = None  # Track GWAS analysis data if tool is used

        # Log tool availability for debugging (only on first request or when debugging)
        if tools:
            logger.debug(f"MCP tools enabled: {len(tools)} tools available")
        else:
            logger.debug("MCP tools disabled for this request")
        
        working_messages = messages.copy()
        
        for iteration in range(max_tool_iterations):
            import time
            iter_start = time.perf_counter()
            logger.info(f"🔄 Claude API iteration {iteration + 1}/{max_tool_iterations}")
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    # Prepare system prompt with caching if enabled
                    if enable_caching:
                        # System prompt as a cacheable block
                        system_blocks = [
                            {
                                "type": "text",
                                "text": system_prompt,
                                "cache_control": {"type": "ephemeral"}
                            }
                        ]
                    else:
                        system_blocks = system_prompt

                    # Apply cache control to conversation history if enabled
                    cacheable_messages = working_messages.copy()
                    if enable_caching and len(cacheable_messages) > 2:
                        # Mark the second-to-last message as cacheable
                        # This allows us to cache most of the conversation while keeping the latest message fresh
                        cache_point_idx = len(cacheable_messages) - 2
                        if cache_point_idx >= 0:
                            msg = cacheable_messages[cache_point_idx]
                            # Handle both string content and structured content
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
                            elif isinstance(msg.get("content"), list):
                                # If already a list, add cache_control to the last block
                                if len(msg["content"]) > 0:
                                    content_blocks = msg["content"].copy()
                                    content_blocks[-1] = {
                                        **content_blocks[-1],
                                        "cache_control": {"type": "ephemeral"}
                                    }
                                    cacheable_messages[cache_point_idx] = {
                                        **msg,
                                        "content": content_blocks
                                    }

                    request_body = {
                        "model": model,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "system": system_blocks,
                        "messages": cacheable_messages,
                    }

                    # Only include tools if we have them
                    if tools:
                        request_body["tools"] = tools

                    response = await client.post(
                        self.api_url,
                        headers=self._get_headers(enable_caching=enable_caching),
                        json=request_body,
                    )
                    
                    if response.status_code != 200:
                        error_text = response.text
                        logger.error(f"Claude API error: {response.status_code} - {error_text}")
                        raise HTTPException(status_code=500, detail="Failed to generate response")
                    
                    data = response.json()
                    content_blocks = data.get("content", [])
                    stop_reason = data.get("stop_reason", "end_turn")
                    usage = data.get("usage", {})

                    # Track all token types including cache metrics
                    total_input_tokens += usage.get("input_tokens", 0)
                    total_output_tokens += usage.get("output_tokens", 0)
                    total_cache_creation_tokens += usage.get("cache_creation_input_tokens", 0)
                    total_cache_read_tokens += usage.get("cache_read_input_tokens", 0)
                    
                    # Log iteration timing
                    iter_ms = (time.perf_counter() - iter_start) * 1000
                    iter_in = usage.get("input_tokens", 0)
                    iter_out = usage.get("output_tokens", 0)
                    logger.info(
                        f"⚡ Iteration {iteration + 1} complete: {iter_ms:.0f}ms | "
                        f"Tokens: {iter_in}in/{iter_out}out | Stop: {stop_reason}"
                    )

                    # Log cache metrics if present
                    if enable_caching:
                        cache_read = usage.get("cache_read_input_tokens", 0)
                        cache_creation = usage.get("cache_creation_input_tokens", 0)
                        if cache_read > 0:
                            logger.info(f"Cache hit: {cache_read} tokens read from cache (90% cost savings)")
                        if cache_creation > 0:
                            logger.info(f"Cache creation: {cache_creation} tokens cached for future use")

                    logger.info(f"Claude stop_reason: {stop_reason}")
                    
                    # Check if Claude wants to use tools
                    if stop_reason == "tool_use":
                        # Extract tool calls
                        tool_calls = extract_tool_calls(content_blocks)
                        
                        if tool_calls:
                            tool_names = [tc.get("name") for tc in tool_calls]
                            logger.info(f"Claude requested {len(tool_calls)} tool(s): {tool_names}")
                            
                            # Track which tools were used
                            for tc in tool_calls:
                                logger.info(f"Tool call: {tc.get('name')} with input: {tc.get('input')}")
                                tools_used.append({
                                    "name": tc.get("name"),
                                    "input": tc.get("input"),
                                })
                            
                            # Execute tools and get results
                            tool_results = await process_tool_calls(tool_calls)

                            # Extract widget data from tool results if present
                            for i, tc in enumerate(tool_calls):
                                tool_name = tc.get("name")

                                # Extract breeding simulation data
                                if tool_name == "create_breeding_simulation" and i < len(tool_results):
                                    try:
                                        # Parse the tool result content (it's JSON string)
                                        result_content = tool_results[i].get("content", "{}")
                                        if isinstance(result_content, str):
                                            result_data = json.loads(result_content)
                                            if result_data.get("widget_type") == "breeding_lab":
                                                breeding_widget_data = result_data
                                                logger.info("Extracted breeding simulation widget data from tool results")
                                    except Exception as e:
                                        logger.warning(f"Failed to extract breeding data: {e}")

                                # Extract DNA/RNA visualization data
                                elif tool_name in ["generate_random_dna_sequence", "transcribe_dna_to_mrna"] and i < len(tool_results):
                                    try:
                                        # Parse the tool result content (it's JSON string)
                                        result_content = tool_results[i].get("content", "{}")
                                        if isinstance(result_content, str):
                                            result_data = json.loads(result_content)
                                            if result_data.get("widget_type") == "dna_rna_visualizer":
                                                dna_rna_widget_data = result_data
                                                logger.info(f"Extracted DNA/RNA widget data from {tool_name}")
                                    except Exception as e:
                                        logger.warning(f"Failed to extract DNA/RNA data: {e}")

                                # Extract GWAS analysis data
                                elif tool_name in ["run_gwas_analysis", "get_gwas_results"] and i < len(tool_results):
                                    try:
                                        # Parse the tool result content (it's JSON string)
                                        result_content = tool_results[i].get("content", "{}")
                                        if isinstance(result_content, str):
                                            result_data = json.loads(result_content)
                                            if result_data.get("widget_type") == "gwas_results":
                                                gwas_widget_data = result_data
                                                logger.info(f"Extracted GWAS widget data from {tool_name}")
                                    except Exception as e:
                                        logger.warning(f"Failed to extract GWAS data: {e}")

                            # Add assistant's response with tool_use to messages
                            working_messages.append({
                                "role": "assistant",
                                "content": content_blocks,
                            })

                            # Add tool results to messages
                            working_messages.append({
                                "role": "user",
                                "content": tool_results,
                            })

                            # Continue the loop to get Claude's final response
                            continue
                    
                    # No tool use or end of conversation - extract final text
                    final_content = extract_text_content(content_blocks)

                    metadata = {
                        "input_tokens": total_input_tokens,
                        "output_tokens": total_output_tokens,
                        "total_tokens": total_input_tokens + total_output_tokens,
                        "cache_creation_input_tokens": total_cache_creation_tokens,
                        "cache_read_input_tokens": total_cache_read_tokens,
                        "model": model,
                        "tools_used": tools_used,
                        "tool_iterations": iteration + 1,
                    }

                    # Add breeding widget data if present
                    if breeding_widget_data:
                        metadata["widget_type"] = "breeding_lab"
                        metadata["breeding_data"] = {
                            "parent1": breeding_widget_data.get("parent1"),
                            "parent2": breeding_widget_data.get("parent2"),
                            "traits": breeding_widget_data.get("traits"),
                            "results": breeding_widget_data.get("results"),
                        }

                    # Add DNA/RNA widget data if present
                    if dna_rna_widget_data:
                        metadata["widget_type"] = "dna_rna_visualizer"
                        metadata["dna_rna_data"] = {
                            "dna_sequence": dna_rna_widget_data.get("dna_rna_data", {}).get("dna_sequence"),
                            "mrna_sequence": dna_rna_widget_data.get("dna_rna_data", {}).get("mrna_sequence"),
                            "operation": dna_rna_widget_data.get("dna_rna_data", {}).get("operation"),
                            "metadata": dna_rna_widget_data.get("dna_rna_data", {}).get("metadata"),
                        }

                    # Add GWAS widget data if present
                    if gwas_widget_data:
                        metadata["widget_type"] = "gwas_results"
                        metadata["gwas_data"] = gwas_widget_data.get("gwas_data", {})

                    if tools_used:
                        logger.info(f"Response completed with {len(tools_used)} tool(s) used: {[t['name'] for t in tools_used]}")
                    else:
                        logger.info("Response completed without tool use (Claude answered directly)")

                    # Log final cache savings
                    if enable_caching and total_cache_read_tokens > 0:
                        savings_pct = (total_cache_read_tokens / (total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens)) * 100 if (total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens) > 0 else 0
                        logger.info(f"Total cache savings: {total_cache_read_tokens} tokens ({savings_pct:.1f}% of input)")

                    return final_content, metadata
                    
            except httpx.HTTPError as e:
                logger.error(f"HTTP error in tool loop: {e}")
                raise HTTPException(status_code=500, detail="Failed to connect to AI service")
        
        # Max iterations reached
        logger.warning(f"Max tool iterations ({max_tool_iterations}) reached")
        return "I apologize, but I encountered an issue processing your request. Please try again.", {
            "input_tokens": total_input_tokens,
            "output_tokens": total_output_tokens,
            "total_tokens": total_input_tokens + total_output_tokens,
            "cache_creation_input_tokens": total_cache_creation_tokens,
            "cache_read_input_tokens": total_cache_read_tokens,
            "model": model,
            "tools_used": tools_used,
            "tool_iterations": max_tool_iterations,
            "max_iterations_reached": True,
        }


# Global singleton instance
_zygotrix_claude_service: Optional[ZygotrixClaudeService] = None


def get_zygotrix_claude_service() -> ZygotrixClaudeService:
    """Get or create the global ZygotrixClaudeService instance."""
    global _zygotrix_claude_service
    if _zygotrix_claude_service is None:
        _zygotrix_claude_service = ZygotrixClaudeService()
    return _zygotrix_claude_service
