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

    async def generate_streaming_response(
        self,
        user_message: str,
        context: str,
        page_context: Optional[PageContext] = None,
        user_name: str = "there",
        conversation_history: Optional[List[Dict]] = None,
        use_tools: bool = True,
        max_tool_iterations: int = 5,
    ):
        """Streaming version of generate_response."""
        import json
        
        # Import local dependencies (same as generate_response)
        from ..chatbot_settings import get_chatbot_settings
        from ...prompt_engineering.prompts import (
            get_simulation_tool_prompt,
            get_zigi_prompt_with_tools
        )
        from ...mcp import (
            get_claude_tools_schema,
            process_tool_calls,
            extract_tool_calls, # Not fully used in stream loop but needed if we fallback or helper usage
        )
        
        try:
            # 1. Setup Context & Messages (Identical to generate_response)
            is_simulation_studio = page_context and "Simulation Studio" in page_context.pageName
            if is_simulation_studio:
                simulation_context = context if context else ""
                system_prompt = get_simulation_tool_prompt(user_name, simulation_context)
                use_tools = False
            else:
                system_prompt = get_zigi_prompt_with_tools()

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
            
            messages = []
            if conversation_history:
                for msg in conversation_history:
                    messages.append({"role": msg["role"], "content": msg["content"]})
            
            current_message_content = f"""{page_info}

Background information (use this to answer, but don't copy it directly):
{context}

Question: {user_message}"""
            
            messages.append({"role": "user", "content": current_message_content})

            # Settings
            try:
                settings = get_chatbot_settings()
                model = settings.model
                max_tokens = settings.max_tokens
                temperature = settings.temperature
            except Exception:
                model = "claude-3-haiku-20240307"
                max_tokens = 1024
                temperature = 0.7

            tools = get_claude_tools_schema() if use_tools else []
            total_input_tokens = 0
            total_output_tokens = 0
            tools_used = []
            
            working_messages = messages.copy()

            # 2. Iteration Loop
            for iteration in range(max_tool_iterations):
                async with httpx.AsyncClient(timeout=120.0) as client:
                    request_body = {
                        "model": model,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "system": system_prompt,
                        "messages": working_messages,
                        "stream": True # Enable Streaming
                    }
                    if tools:
                        request_body["tools"] = tools

                    async with client.stream(
                        "POST", 
                        self.api_url, 
                        headers={
                            "x-api-key": self.api_key,
                            "content-type": "application/json",
                            "anthropic-version": "2023-06-01",
                        }, 
                        json=request_body
                    ) as response:
                        
                        if response.status_code != 200:
                            # If direct error, yield error event
                            error_text = await response.aread()
                            logger.error(f"Claude API Streaming Error: {response.status_code} - {error_text}")
                            yield f"event: error\ndata: {json.dumps({'message': 'AI Service Unavailable'})}\n\n"
                            return

                        # Buffers for tool use detection
                        current_content_block_type = None
                        current_tool_call_buffer = {} # index -> {name, inputs_str}
                        
                        # We need to reconstruct the full assistant message if tool use happens
                        # so we can append it to working_messages for the next turn
                        full_assistant_content_blocks = [] # List of blocks: {"type": "text", "text": "..."} or {"type": "tool_use", ...}
                        
                        current_block_index = 0

                        # Processing stream
                        async for line in response.aiter_lines():
                            if not line.startswith("data: "):
                                continue
                            
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            
                            try:
                                event_data = json.loads(data_str)
                                event_type = event_data.get("type")
                                
                                # -- Usage Tracking --
                                if event_type == "message_start":
                                    msg = event_data.get("message", {})
                                    usage = msg.get("usage", {})
                                    total_input_tokens += usage.get("input_tokens", 0)
                                    
                                elif event_type == "message_delta":
                                    usage = event_data.get("usage", {})
                                    total_output_tokens += usage.get("output_tokens", 0)
                                    stop_reason = event_data.get("delta", {}).get("stop_reason")
                                    # If stop_reason is "tool_use", we'll handle it after the loop ends or via state check

                                # -- Content Handling --
                                elif event_type == "content_block_start":
                                    current_block_index = event_data.get("index")
                                    block = event_data.get("content_block", {})
                                    block_type = block.get("type")
                                    
                                    if block_type == "text":
                                        full_assistant_content_blocks.append({"type": "text", "text": ""})
                                        current_content_block_type = "text"
                                    elif block_type == "tool_use":
                                        # Tool detected!
                                        tool_info = {
                                            "type": "tool_use", 
                                            "id": block.get("id"),
                                            "name": block.get("name"),
                                            "input": {} # We'll parse input_json later maybe, or accumulate string
                                        }
                                        full_assistant_content_blocks.append(tool_info)
                                        current_tool_call_buffer[current_block_index] = {
                                            "id": block.get("id"),
                                            "name": block.get("name"),
                                            "input_json_str": ""
                                        }
                                        current_content_block_type = "tool_use"
                                        
                                        # Yield status update to frontend? (Optional, maybe later)
                                        # yield f"event: status\ndata: ...\n\n"

                                elif event_type == "content_block_delta":
                                    current_block_index = event_data.get("index")
                                    delta = event_data.get("delta", {})
                                    delta_type = delta.get("type")
                                    
                                    if delta_type == "text_delta":
                                        text_chunk = delta.get("text", "")
                                        # Append to local buffer for history
                                        if len(full_assistant_content_blocks) > current_block_index:
                                            full_assistant_content_blocks[current_block_index]["text"] += text_chunk
                                        
                                        # Stream to client IF NOT inside a tool use block (which shouldn't happen for text_delta anyway)
                                        # Only stream text content
                                        payload = {"content": text_chunk, "type": "token"}
                                        yield f"data: {json.dumps(payload)}\n\n"
                                        
                                    elif delta_type == "input_json_delta":
                                        partial_json = delta.get("partial_json", "")
                                        if current_block_index in current_tool_call_buffer:
                                            current_tool_call_buffer[current_block_index]["input_json_str"] += partial_json

                                elif event_type == "content_block_stop":
                                    # Block finished
                                    current_content_block_type = None

                            except json.JSONDecodeError:
                                continue
                        
                        # -- End of Stream for this iteration --
                        
                        # Check if we successfully collected tool calls
                        collected_tool_calls_list = []
                        if current_tool_call_buffer:
                            for idx, t_data in current_tool_call_buffer.items():
                                try:
                                    inputs = json.loads(t_data["input_json_str"])
                                    # Construct standard tool call object
                                    tc = {
                                        "id": t_data["id"],
                                        "name": t_data["name"],
                                        "input": inputs,
                                        "type": "tool_use"
                                    }
                                    collected_tool_calls_list.append(tc)
                                    # Update buffer used for history
                                    full_assistant_content_blocks[idx]["input"] = inputs
                                except Exception as e:
                                    logger.error(f"Failed to parse tool input JSON: {e}")
                        
                        if collected_tool_calls_list:
                            # We have tools to execute!
                            logger.info(f"Streaming Interrupted for Tools: {[t['name'] for t in collected_tool_calls_list]}")
                            
                            # 1. Add assistant message to history
                            working_messages.append({
                                "role": "assistant",
                                "content": full_assistant_content_blocks
                            })
                            
                            # 2. Record usage so we don't track it twice? 
                            # Actually, we keep running sum in total variables
                            for t in collected_tool_calls_list:
                                tools_used.append({"name": t["name"], "input": t["input"]})

                            # 3. Execute Tools
                            tool_results = await process_tool_calls(collected_tool_calls_list)
                            
                            # 4. Add tool results to history
                            working_messages.append({
                                "role": "user",
                                "content": tool_results
                            })
                            
                            # 5. CONTINUE loop -> Next iteration will call Claude again with tool results
                            continue
                        
                        else:
                            # No tools used -> This was the final answer!
                            # Send [DONE] with usage
                            final_usage_payload = {
                                "type": "usage",
                                "usage": {
                                    "input_tokens": total_input_tokens,
                                    "output_tokens": total_output_tokens,
                                    "total_tokens": total_input_tokens + total_output_tokens,
                                    "model": model,
                                    "tools_used": tools_used
                                }
                            }
                            yield f"data: {json.dumps(final_usage_payload)}\n\n"
                            yield "data: [DONE]\n\n"
                            return

            # If we exit loop without returning (Max iterations), allow error event
            yield f"event: error\ndata: {json.dumps({'message': 'Max tool iterations reached'})}\n\n"
        
        except Exception as e:
            logger.error(f"Streaming Error: {e}")
            import traceback
            traceback.print_exc()
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"


# Global singleton instance
_claude_ai_service: Optional[ClaudeAIService] = None


def get_claude_ai_service() -> ClaudeAIService:
    """Get or create the global ClaudeAIService instance."""
    global _claude_ai_service
    if _claude_ai_service is None:
        _claude_ai_service = ClaudeAIService()
    return _claude_ai_service