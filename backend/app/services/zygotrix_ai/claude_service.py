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
        
        if not self.api_key:
            logger.warning("CLAUDE_API_KEY not configured")
    
    def _get_headers(self) -> dict:
        """Get headers for Claude API requests."""
        return {
            "x-api-key": self.api_key,
            "content-type": "application/json",
            "anthropic-version": self.anthropic_version,
        }
    
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
    
    async def generate_response_with_tools(
        self,
        messages: list,
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        use_tools: bool = True,
        max_tool_iterations: int = 5,
    ) -> tuple[str, dict]:
        """
        Generate response from Claude with native tool calling support.
        
        This function allows Claude to autonomously decide when to use tools.
        It handles the tool-use loop automatically.
        
        Args:
            messages: Conversation messages
            system_prompt: System prompt
            model: Claude model to use
            max_tokens: Maximum tokens for response
            temperature: Temperature setting
            use_tools: Whether to enable tool use
            max_tool_iterations: Maximum number of tool call iterations
            
        Returns:
            Tuple of (final_content, metadata)
        """
        tools = get_claude_tools_schema() if use_tools else []
        total_input_tokens = 0
        total_output_tokens = 0
        tools_used = []
        
        # Log tool availability for debugging
        if tools:
            tool_names = [t.get("name") for t in tools]
            logger.info(f"MCP tools enabled: {len(tools)} tools available: {tool_names}")
        else:
            logger.info("MCP tools disabled for this request")
        
        working_messages = messages.copy()
        
        for iteration in range(max_tool_iterations):
            logger.info(f"Claude API iteration {iteration + 1}/{max_tool_iterations}")
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    request_body = {
                        "model": model,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "system": system_prompt,
                        "messages": working_messages,
                    }
                    
                    # Only include tools if we have them
                    if tools:
                        request_body["tools"] = tools
                    
                    response = await client.post(
                        self.api_url,
                        headers=self._get_headers(),
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
                    
                    total_input_tokens += usage.get("input_tokens", 0)
                    total_output_tokens += usage.get("output_tokens", 0)
                    
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
                        "model": model,
                        "tools_used": tools_used,
                        "tool_iterations": iteration + 1,
                    }
                    
                    if tools_used:
                        logger.info(f"Response completed with {len(tools_used)} tool(s) used: {[t['name'] for t in tools_used]}")
                    else:
                        logger.info("Response completed without tool use (Claude answered directly)")
                    
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
