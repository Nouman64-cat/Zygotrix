"""
Unified Claude Service.

A single, consolidated service for all Claude API interactions.
Merges functionality from ClaudeAIService and ZygotrixClaudeService.

This service handles:
- Zigi chatbot responses (with page context)
- Zygotrix AI responses (with widget extraction)
- Streaming and non-streaming responses
- Tool calling with MCP integration
- Prompt caching for cost optimization
"""

import json
import time
import logging
from typing import Optional, List, Dict, Tuple, Any, AsyncGenerator
from pydantic import BaseModel
from fastapi import HTTPException
import httpx

from .base_claude_service import BaseClaudeService
from ...mcp import (
    get_claude_tools_schema,
    process_tool_calls,
    extract_tool_calls,
    extract_text_content,
)

logger = logging.getLogger(__name__)


class PageContext(BaseModel):
    """Page context information for generating relevant responses."""
    pageName: str
    description: str
    features: List[str]


class ClaudeService(BaseClaudeService):
    """
    Unified Claude AI service for all Zygotrix features.
    
    This single service replaces both ClaudeAIService and ZygotrixClaudeService,
    providing a consistent interface with configurable options.
    
    Features:
    - Page context handling (for Zigi chatbot)
    - Widget data extraction (for breeding, DNA/RNA, GWAS visualizations)
    - Prompt caching (for cost optimization)
    - Tool calling with MCP integration
    - Streaming and non-streaming responses
    - Dynamic model settings from database
    """
    
    # =========================================================================
    # PAGE CONTEXT HELPERS (from ClaudeAIService)
    # =========================================================================
    
    def _build_page_info(self, page_context: Optional[PageContext]) -> str:
        """
        Build page context information string.
        
        Args:
            page_context: Current page information
            
        Returns:
            Formatted page info string
        """
        if not page_context:
            return ""
        
        features_list = "\n".join([f"- {feature}" for feature in page_context.features])
        return f"""
CURRENT PAGE CONTEXT:
The user is currently on: {page_context.pageName}
Page Description: {page_context.description}
Available Features on this page:
{features_list}
"""
    
    def _build_user_message_content(
        self,
        user_message: str,
        context: str,
        page_info: str
    ) -> str:
        """
        Build the full user message content with context.
        
        Args:
            user_message: The user's current message
            context: RAG context from LlamaCloud
            page_info: Page context information
            
        Returns:
            Full formatted message content
        """
        return f"""{page_info}

Background information (use this to answer, but don't copy it directly):
{context}

Question: {user_message}"""
    
    def _get_system_prompt_and_tools_setting(
        self,
        page_context: Optional[PageContext],
        user_name: str,
        context: str,
        custom_system_prompt: Optional[str] = None
    ) -> Tuple[str, bool]:
        """
        Get appropriate system prompt and tools setting based on context.
        
        Args:
            page_context: Current page information
            user_name: User's display name
            context: RAG context
            custom_system_prompt: Optional custom system prompt to use
            
        Returns:
            Tuple of (system_prompt, use_tools)
        """
        # If custom prompt provided, use it with tools enabled
        if custom_system_prompt:
            return custom_system_prompt, True
        
        from ..chatbot_settings import get_chatbot_settings
        from ...prompt_engineering.prompts import (
            get_simulation_tool_prompt,
            get_zigi_prompt_with_tools
        )
        
        # Check if user is on Simulation Studio page
        is_simulation_studio = page_context and "Simulation Studio" in page_context.pageName
        
        if is_simulation_studio:
            simulation_context = context if context else ""
            system_prompt = get_simulation_tool_prompt(user_name, simulation_context)
            use_tools = False  # Simulation uses command blocks, not MCP tools
        else:
            system_prompt = get_zigi_prompt_with_tools()
            use_tools = True
        
        return system_prompt, use_tools
    
    # =========================================================================
    # MODEL SETTINGS
    # =========================================================================
    
    def _get_model_settings(
        self,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Tuple[str, int, float]:
        """
        Get model settings, using provided values or fetching from database.
        
        Args:
            model: Optional model override
            max_tokens: Optional max_tokens override
            temperature: Optional temperature override
            
        Returns:
            Tuple of (model, max_tokens, temperature)
        """
        from ..chatbot_settings import get_chatbot_settings
        
        # Use provided values or fetch from database
        try:
            settings = get_chatbot_settings()
            resolved_model = model or settings.model
            resolved_max_tokens = max_tokens if max_tokens is not None else settings.max_tokens
            resolved_temperature = temperature if temperature is not None else settings.temperature
            logger.info(f"Using settings: model={resolved_model}, max_tokens={resolved_max_tokens}, temperature={resolved_temperature}")
        except Exception as e:
            logger.warning(f"Failed to fetch chatbot settings, using defaults: {e}")
            resolved_model = model or "claude-3-haiku-20240307"
            resolved_max_tokens = max_tokens if max_tokens is not None else 1024
            resolved_temperature = temperature if temperature is not None else 0.7
        
        return resolved_model, resolved_max_tokens, resolved_temperature
    
    # =========================================================================
    # WIDGET DATA EXTRACTION (from ZygotrixClaudeService)
    # =========================================================================
    
    def _extract_widget_data_from_results(
        self,
        tool_calls: List[Dict],
        tool_results: List[Dict]
    ) -> Dict[str, Optional[Dict]]:
        """
        Extract widget data from tool results.
        
        Args:
            tool_calls: List of tool calls made
            tool_results: Results from tool execution
            
        Returns:
            Dictionary with widget data keyed by type
        """
        widget_data = {
            "breeding": None,
            "dna_rna": None,
            "gwas": None,
        }
        
        for i, tc in enumerate(tool_calls):
            if i >= len(tool_results):
                continue
                
            tool_name = tc.get("name")
            
            try:
                result_content = tool_results[i].get("content", "{}")
                if isinstance(result_content, str):
                    result_data = json.loads(result_content)
                else:
                    result_data = result_content
                
                widget_type = result_data.get("widget_type")
                
                # Breeding simulation data
                if tool_name == "create_breeding_simulation" and widget_type == "breeding_lab":
                    widget_data["breeding"] = result_data
                    logger.info("Extracted breeding simulation widget data from tool results")
                
                # DNA/RNA visualization data
                elif tool_name in ["generate_random_dna_sequence", "transcribe_dna_to_mrna"]:
                    if widget_type == "dna_rna_visualizer":
                        widget_data["dna_rna"] = result_data
                        logger.info(f"Extracted DNA/RNA widget data from {tool_name}")
                
                # GWAS analysis data
                elif tool_name in ["run_gwas_analysis", "get_gwas_results"]:
                    if widget_type == "gwas_results":
                        widget_data["gwas"] = result_data
                        logger.info(f"Extracted GWAS widget data from {tool_name}")
                        
            except Exception as e:
                logger.warning(f"Failed to extract widget data from {tool_name}: {e}")
        
        return widget_data
    
    def _build_metadata_with_widgets(
        self,
        input_tokens: int,
        output_tokens: int,
        model: str,
        tools_used: List[Dict],
        tool_iterations: int,
        cache_creation_tokens: int = 0,
        cache_read_tokens: int = 0,
        widget_data: Optional[Dict] = None,
        extra_fields: Optional[Dict] = None
    ) -> Dict:
        """
        Build metadata including widget data.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model used
            tools_used: List of tools used
            tool_iterations: Number of tool iterations
            cache_creation_tokens: Tokens used for cache creation
            cache_read_tokens: Tokens read from cache
            widget_data: Extracted widget data
            extra_fields: Additional fields
            
        Returns:
            Complete metadata dictionary
        """
        metadata = self._create_token_usage(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            model=model,
            tools_used=tools_used,
            tool_iterations=tool_iterations,
            cache_creation_tokens=cache_creation_tokens,
            cache_read_tokens=cache_read_tokens,
            extra_fields=extra_fields
        )
        
        if widget_data:
            # Add breeding widget data
            if widget_data.get("breeding"):
                breeding = widget_data["breeding"]
                metadata["widget_type"] = "breeding_lab"
                metadata["breeding_data"] = {
                    "parent1": breeding.get("parent1"),
                    "parent2": breeding.get("parent2"),
                    "traits": breeding.get("traits"),
                    "results": breeding.get("results"),
                }
            
            # Add DNA/RNA widget data
            elif widget_data.get("dna_rna"):
                dna_rna = widget_data["dna_rna"]
                metadata["widget_type"] = "dna_rna_visualizer"
                dna_rna_inner = dna_rna.get("dna_rna_data", {})
                metadata["dna_rna_data"] = {
                    "dna_sequence": dna_rna_inner.get("dna_sequence"),
                    "mrna_sequence": dna_rna_inner.get("mrna_sequence"),
                    "operation": dna_rna_inner.get("operation"),
                    "metadata": dna_rna_inner.get("metadata"),
                }
            
            # Add GWAS widget data
            elif widget_data.get("gwas"):
                gwas = widget_data["gwas"]
                metadata["widget_type"] = "gwas_results"
                metadata["gwas_data"] = gwas.get("gwas_data", {})
        
        return metadata
    
    # =========================================================================
    # UNIFIED RESPONSE GENERATION
    # =========================================================================
    
    async def generate_response(
        self,
        user_message: str,
        context: str = "",
        messages: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
        page_context: Optional[PageContext] = None,
        user_name: str = "there",
        conversation_history: Optional[List[Dict]] = None,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        use_tools: bool = True,
        extract_widgets: bool = False,
        enable_caching: bool = True,
        max_tool_iterations: int = 5,
    ) -> Tuple[str, Dict]:
        """
        Generate response using Claude AI with full feature support.
        
        This unified method supports all use cases:
        - Zigi chatbot with page context
        - Zygotrix AI with widget extraction
        - Direct API calls with custom messages
        
        Args:
            user_message: The user's current message
            context: RAG context from LlamaCloud (for Zigi mode)
            messages: Pre-built messages list (bypasses message building)
            system_prompt: Custom system prompt (overrides default)
            page_context: Current page information (for Zigi mode)
            user_name: User's display name
            conversation_history: Previous messages in the conversation
            model: Model to use (defaults to settings)
            max_tokens: Max tokens (defaults to settings)
            temperature: Temperature (defaults to settings)
            use_tools: Whether to enable tool calling
            extract_widgets: Whether to extract widget data from tool results
            enable_caching: Whether to enable prompt caching
            max_tool_iterations: Maximum tool call iterations
        
        Returns:
            tuple: (response_text, metadata_dict)
        """
        try:
            # Get model settings
            resolved_model, resolved_max_tokens, resolved_temp = self._get_model_settings(
                model, max_tokens, temperature
            )
            
            # Get system prompt and determine if tools should be used
            resolved_system_prompt, should_use_tools = self._get_system_prompt_and_tools_setting(
                page_context, user_name, context, system_prompt
            )
            use_tools = use_tools and should_use_tools
            
            # Build messages array
            if messages:
                # Use provided messages directly
                working_messages = messages.copy()
            else:
                # Build messages from conversation history and current message
                working_messages = []
                if conversation_history:
                    for msg in conversation_history:
                        working_messages.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })
                
                # Add current user message with context
                page_info = self._build_page_info(page_context)
                current_message_content = self._build_user_message_content(
                    user_message, context, page_info
                )
                working_messages.append({
                    "role": "user",
                    "content": current_message_content
                })

            # Get MCP tools if enabled
            tools = get_claude_tools_schema() if use_tools else []
            total_input_tokens = 0
            total_output_tokens = 0
            total_cache_creation_tokens = 0
            total_cache_read_tokens = 0
            tools_used = []
            collected_widget_data = {"breeding": None, "dna_rna": None, "gwas": None}

            # Tool calling loop
            for iteration in range(max_tool_iterations):
                iter_start = time.perf_counter()
                logger.info(f"🔄 Claude API iteration {iteration + 1}/{max_tool_iterations}")
                
                # Apply caching to messages if enabled
                cacheable_messages = (
                    self._apply_message_caching(working_messages)
                    if enable_caching
                    else working_messages
                )
                
                # Build request body
                request_body = self._build_request_body(
                    messages=cacheable_messages,
                    system_prompt=resolved_system_prompt,
                    model=resolved_model,
                    max_tokens=resolved_max_tokens,
                    temperature=resolved_temp,
                    tools=tools if tools else None,
                    enable_caching=enable_caching,
                )
                
                # Make API request
                data = await self._make_api_request(
                    request_body,
                    enable_caching=enable_caching
                )
                
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
                logger.info(
                    f"⚡ Iteration {iteration + 1} complete: {iter_ms:.0f}ms | "
                    f"Tokens: {usage.get('input_tokens', 0)}in/{usage.get('output_tokens', 0)}out | Stop: {stop_reason}"
                )

                # Log cache metrics if caching is enabled
                if enable_caching:
                    self._log_cache_metrics(
                        usage.get("cache_read_input_tokens", 0),
                        usage.get("cache_creation_input_tokens", 0),
                        usage.get("input_tokens", 0)
                    )
                
                # Check if Claude wants to use tools
                if stop_reason == "tool_use":
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

                        # Extract widget data if enabled
                        if extract_widgets:
                            iteration_widget_data = self._extract_widget_data_from_results(
                                tool_calls, tool_results
                            )
                            for key, value in iteration_widget_data.items():
                                if value is not None:
                                    collected_widget_data[key] = value

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

                # Build metadata
                if extract_widgets:
                    metadata = self._build_metadata_with_widgets(
                        input_tokens=total_input_tokens,
                        output_tokens=total_output_tokens,
                        model=resolved_model,
                        tools_used=tools_used,
                        tool_iterations=iteration + 1,
                        cache_creation_tokens=total_cache_creation_tokens,
                        cache_read_tokens=total_cache_read_tokens,
                        widget_data=collected_widget_data,
                    )
                else:
                    metadata = self._create_token_usage(
                        input_tokens=total_input_tokens,
                        output_tokens=total_output_tokens,
                        model=resolved_model,
                        tools_used=tools_used,
                        tool_iterations=iteration + 1,
                        cache_creation_tokens=total_cache_creation_tokens,
                        cache_read_tokens=total_cache_read_tokens,
                    )

                if tools_used:
                    logger.info(f"Response completed with {len(tools_used)} tool(s) used: {[t['name'] for t in tools_used]}")
                else:
                    logger.info("Response completed without tool use")

                # Log final cache savings
                if enable_caching and total_cache_read_tokens > 0:
                    total_all = total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens
                    savings_pct = (total_cache_read_tokens / total_all) * 100 if total_all > 0 else 0
                    logger.info(f"Total cache savings: {total_cache_read_tokens} tokens ({savings_pct:.1f}% of input)")

                return final_content or "I'm sorry, I couldn't generate a response.", metadata

            # Max iterations reached
            logger.warning(f"Max tool iterations ({max_tool_iterations}) reached")
            return "I apologize, but I encountered an issue processing your request. Please try again.", {
                "input_tokens": total_input_tokens,
                "output_tokens": total_output_tokens,
                "total_tokens": total_input_tokens + total_output_tokens,
                "model": resolved_model,
                "tools_used": tools_used,
                "tool_iterations": max_tool_iterations,
                "max_iterations_reached": True,
            }

        except httpx.HTTPError as e:
            logger.error(f"HTTP error generating response: {e}")
            raise HTTPException(status_code=500, detail="Failed to connect to AI service")
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise HTTPException(status_code=500, detail="An error occurred while generating response")

    # =========================================================================
    # STREAMING RESPONSE GENERATION
    # =========================================================================

    async def generate_streaming_response(
        self,
        user_message: str,
        context: str = "",
        messages: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
        page_context: Optional[PageContext] = None,
        user_name: str = "there",
        conversation_history: Optional[List[Dict]] = None,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        use_tools: bool = True,
        max_tool_iterations: int = 5,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming version of generate_response.
        
        Yields SSE-formatted strings for streaming to the client.
        
        Args:
            (same as generate_response)
            
        Yields:
            SSE-formatted strings with token data, usage info, or errors
        """
        try:
            # Get model settings
            resolved_model, resolved_max_tokens, resolved_temp = self._get_model_settings(
                model, max_tokens, temperature
            )
            
            # Get system prompt and determine if tools should be used
            resolved_system_prompt, should_use_tools = self._get_system_prompt_and_tools_setting(
                page_context, user_name, context, system_prompt
            )
            use_tools = use_tools and should_use_tools
            
            # Build messages array
            if messages:
                working_messages = messages.copy()
            else:
                working_messages = []
                if conversation_history:
                    for msg in conversation_history:
                        working_messages.append({"role": msg["role"], "content": msg["content"]})
                
                page_info = self._build_page_info(page_context)
                current_message_content = self._build_user_message_content(
                    user_message, context, page_info
                )
                working_messages.append({"role": "user", "content": current_message_content})

            # Get tools
            tools = get_claude_tools_schema() if use_tools else []
            total_input_tokens = 0
            total_output_tokens = 0
            tools_used = []

            # Iteration Loop
            for iteration in range(max_tool_iterations):
                request_body = self._build_request_body(
                    messages=working_messages,
                    system_prompt=resolved_system_prompt,
                    model=resolved_model,
                    max_tokens=resolved_max_tokens,
                    temperature=resolved_temp,
                    tools=tools if tools else None,
                    stream=True,
                )
                
                async with httpx.AsyncClient(timeout=120.0) as client:
                    async with client.stream(
                        "POST",
                        self.api_url,
                        headers=self._get_headers(),
                        json=request_body
                    ) as response:
                        
                        if response.status_code != 200:
                            error_text = await response.aread()
                            logger.error(f"Claude API Streaming Error: {response.status_code} - {error_text}")
                            yield f"event: error\ndata: {json.dumps({'message': 'AI Service Unavailable'})}\n\n"
                            return

                        # Buffers for tool use detection
                        current_tool_call_buffer = {}
                        full_assistant_content_blocks = []
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
                                
                                # Usage Tracking
                                if event_type == "message_start":
                                    msg = event_data.get("message", {})
                                    usage = msg.get("usage", {})
                                    total_input_tokens += usage.get("input_tokens", 0)
                                    
                                elif event_type == "message_delta":
                                    usage = event_data.get("usage", {})
                                    total_output_tokens += usage.get("output_tokens", 0)

                                # Content Handling
                                elif event_type == "content_block_start":
                                    current_block_index = event_data.get("index")
                                    block = event_data.get("content_block", {})
                                    block_type = block.get("type")
                                    
                                    if block_type == "text":
                                        full_assistant_content_blocks.append({"type": "text", "text": ""})
                                    elif block_type == "tool_use":
                                        tool_info = {
                                            "type": "tool_use",
                                            "id": block.get("id"),
                                            "name": block.get("name"),
                                            "input": {}
                                        }
                                        full_assistant_content_blocks.append(tool_info)
                                        current_tool_call_buffer[current_block_index] = {
                                            "id": block.get("id"),
                                            "name": block.get("name"),
                                            "input_json_str": ""
                                        }

                                elif event_type == "content_block_delta":
                                    current_block_index = event_data.get("index")
                                    delta = event_data.get("delta", {})
                                    delta_type = delta.get("type")
                                    
                                    if delta_type == "text_delta":
                                        text_chunk = delta.get("text", "")
                                        if len(full_assistant_content_blocks) > current_block_index:
                                            full_assistant_content_blocks[current_block_index]["text"] += text_chunk
                                        
                                        # Stream to client
                                        payload = {"content": text_chunk, "type": "token"}
                                        yield f"data: {json.dumps(payload)}\n\n"
                                        
                                    elif delta_type == "input_json_delta":
                                        partial_json = delta.get("partial_json", "")
                                        if current_block_index in current_tool_call_buffer:
                                            current_tool_call_buffer[current_block_index]["input_json_str"] += partial_json

                            except json.JSONDecodeError:
                                continue
                        
                        # End of Stream for this iteration
                        collected_tool_calls_list = []
                        if current_tool_call_buffer:
                            for idx, t_data in current_tool_call_buffer.items():
                                try:
                                    inputs = json.loads(t_data["input_json_str"])
                                    tc = {
                                        "id": t_data["id"],
                                        "name": t_data["name"],
                                        "input": inputs,
                                        "type": "tool_use"
                                    }
                                    collected_tool_calls_list.append(tc)
                                    full_assistant_content_blocks[idx]["input"] = inputs
                                except Exception as e:
                                    logger.error(f"Failed to parse tool input JSON: {e}")
                        
                        if collected_tool_calls_list:
                            logger.info(f"Streaming Interrupted for Tools: {[t['name'] for t in collected_tool_calls_list]}")
                            
                            working_messages.append({
                                "role": "assistant",
                                "content": full_assistant_content_blocks
                            })
                            
                            for t in collected_tool_calls_list:
                                tools_used.append({"name": t["name"], "input": t["input"]})

                            tool_results = await process_tool_calls(collected_tool_calls_list)
                            
                            working_messages.append({
                                "role": "user",
                                "content": tool_results
                            })
                            
                            continue
                        
                        else:
                            # No tools used -> Final answer
                            final_usage_payload = {
                                "type": "usage",
                                "usage": {
                                    "input_tokens": total_input_tokens,
                                    "output_tokens": total_output_tokens,
                                    "total_tokens": total_input_tokens + total_output_tokens,
                                    "model": resolved_model,
                                    "tools_used": tools_used
                                }
                            }
                            yield f"data: {json.dumps(final_usage_payload)}\n\n"
                            yield "data: [DONE]\n\n"
                            return

            # Max iterations reached
            yield f"event: error\ndata: {json.dumps({'message': 'Max tool iterations reached'})}\n\n"
        
        except Exception as e:
            logger.error(f"Streaming Error: {e}")
            import traceback
            traceback.print_exc()
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

_claude_service: Optional[ClaudeService] = None


def get_claude_service() -> ClaudeService:
    """Get or create the global ClaudeService instance."""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService()
    return _claude_service

