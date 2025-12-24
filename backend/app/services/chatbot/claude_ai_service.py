"""
Claude AI Service for generating responses.

Extracted from chatbot.py as part of Phase 2.4 refactoring.
Handles API communication with Claude, tool calling orchestration, and token tracking.
"""

import os
import httpx
import logging
from typing import Optional, List, Dict, Tuple, Any
from pydantic import BaseModel
from fastapi import HTTPException
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

# Claude API configuration
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"


class PageContext(BaseModel):
    """Page context information for generating relevant responses."""
    pageName: str
    description: str
    features: List[str]


class ClaudeAIService:
    """
    Service for generating responses using Claude AI.
    
    Features:
    - API communication with Claude
    - Tool calling orchestration
    - Token usage tracking
    - Model selection based on settings
    """
    
    def __init__(self):
        self.api_key = CLAUDE_API_KEY
        self.api_url = CLAUDE_API_URL
    
    async def generate_response(
        self,
        user_message: str,
        context: str,
        page_context: Optional[PageContext] = None,
        user_name: str = "there",
        conversation_history: Optional[List[Dict]] = None,
        use_tools: bool = True,
        max_tool_iterations: int = 5,
    ) -> Tuple[str, Dict]:
        """
        Generate response using Claude AI with MCP tool calling support.
        
        Args:
            user_message: The user's current message
            context: RAG context from LlamaCloud
            page_context: Current page information
            user_name: User's display name
            conversation_history: Previous messages in the conversation
            use_tools: Whether to enable Claude's native tool calling
            max_tool_iterations: Maximum number of tool call iterations
        
        Returns:
            tuple: (response_text, token_usage_dict)
        """
        try:
            # Import here to avoid circular imports
            from ..chatbot_settings import get_chatbot_settings
            from ...prompt_engineering.prompts import (
                get_simulation_tool_prompt,
                get_zigi_prompt_with_tools
            )
            from ...mcp import (
                get_claude_tools_schema,
                process_tool_calls,
                extract_tool_calls,
                extract_text_content,
            )
            
            # Check if user is on Simulation Studio page
            is_simulation_studio = page_context and "Simulation Studio" in page_context.pageName

            # Get appropriate system prompt
            if is_simulation_studio:
                simulation_context = context if context else ""
                system_prompt = get_simulation_tool_prompt(user_name, simulation_context)
                use_tools = False  # Simulation uses command blocks, not MCP tools
            else:
                system_prompt = get_zigi_prompt_with_tools()

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

            # Build messages array with conversation history
            messages = []
            
            if conversation_history:
                for msg in conversation_history:
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            # Add current user message with context
            current_message_content = f"""{page_info}

Background information (use this to answer, but don't copy it directly):
{context}

Question: {user_message}"""
            
            messages.append({
                "role": "user",
                "content": current_message_content
            })

            # Fetch dynamic settings from database
            try:
                settings = get_chatbot_settings()
                model = settings.model
                max_tokens = settings.max_tokens
                temperature = settings.temperature
                logger.info(f"Using settings: model={model}, max_tokens={max_tokens}, temperature={temperature}")
            except Exception as e:
                logger.warning(f"Failed to fetch chatbot settings, using defaults: {e}")
                model = "claude-3-haiku-20240307"
                max_tokens = 1024
                temperature = 0.7

            # Get MCP tools if enabled
            tools = get_claude_tools_schema() if use_tools else []
            total_input_tokens = 0
            total_output_tokens = 0
            tools_used = []
            
            working_messages = messages.copy()

            # Tool calling loop
            for iteration in range(max_tool_iterations):
                async with httpx.AsyncClient(timeout=120.0) as client:
                    request_body = {
                        "model": model,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "system": system_prompt,
                        "messages": working_messages,
                    }
                    
                    if tools:
                        request_body["tools"] = tools
                    
                    response = await client.post(
                        self.api_url,
                        headers={
                            "x-api-key": self.api_key,
                            "content-type": "application/json",
                            "anthropic-version": "2023-06-01",
                        },
                        json=request_body,
                    )

                    if response.status_code != 200:
                        logger.error(f"Claude API error: {response.status_code} - {response.text}")
                        raise HTTPException(
                            status_code=500,
                            detail="Failed to generate response from AI",
                        )

                    data = response.json()
                    content_blocks = data.get("content", [])
                    stop_reason = data.get("stop_reason", "end_turn")
                    usage = data.get("usage", {})
                    
                    total_input_tokens += usage.get("input_tokens", 0)
                    total_output_tokens += usage.get("output_tokens", 0)
                    
                    # Check if Claude wants to use tools
                    if stop_reason == "tool_use":
                        tool_calls = extract_tool_calls(content_blocks)
                        
                        if tool_calls:
                            logger.info(f"Claude requested {len(tool_calls)} tool(s): {[tc.get('name') for tc in tool_calls]}")
                            
                            for tc in tool_calls:
                                tools_used.append({
                                    "name": tc.get("name"),
                                    "input": tc.get("input"),
                                })
                            
                            tool_results = await process_tool_calls(tool_calls)
                            
                            working_messages.append({
                                "role": "assistant",
                                "content": content_blocks,
                            })
                            
                            working_messages.append({
                                "role": "user",
                                "content": tool_results,
                            })
                            
                            continue
                    
                    # No tool use or end of conversation
                    final_content = extract_text_content(content_blocks)
                    
                    token_usage = {
                        "input_tokens": total_input_tokens,
                        "output_tokens": total_output_tokens,
                        "model": model,
                        "tools_used": tools_used,
                        "tool_iterations": iteration + 1,
                    }
                    
                    if tools_used:
                        logger.info(f"Tools used in response: {[t['name'] for t in tools_used]}")
                    
                    return final_content or "I'm sorry, I couldn't generate a response.", token_usage

            # Max iterations reached
            logger.warning(f"Max tool iterations ({max_tool_iterations}) reached")
            return "I apologize, but I encountered an issue processing your request. Please try again.", {
                "input_tokens": total_input_tokens,
                "output_tokens": total_output_tokens,
                "model": model,
                "tools_used": tools_used,
                "tool_iterations": max_tool_iterations,
            }

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


# Global singleton instance
_claude_ai_service: Optional[ClaudeAIService] = None


def get_claude_ai_service() -> ClaudeAIService:
    """Get or create the global ClaudeAIService instance."""
    global _claude_ai_service
    if _claude_ai_service is None:
        _claude_ai_service = ClaudeAIService()
    return _claude_ai_service