"""
Zygotrix AI Chat Service.

Handles chat orchestration, context building, and response generation.
"""

import logging
import json
from typing import Optional, AsyncGenerator, Dict, Any, Tuple
from fastapi import HTTPException

from ...schema.zygotrix_ai import (
    ChatRequest, ChatResponse, MessageRole, MessageMetadata,
    ConversationCreate, ConversationUpdate,
)
from ...services.zygotrix_ai_service import (
    ConversationService, MessageService,
)
from ...schema.auth import UserProfile
from ...prompt_engineering.prompts import (
    get_zigi_system_prompt, get_simulation_tool_prompt, get_zigi_prompt_with_tools
)

from ..chatbot.rate_limiting_service import get_rate_limiter
from ..chatbot.token_analytics_service import get_token_analytics_service
from ..chatbot.rag_service import get_rag_service
from ..chatbot.traits_enrichment_service import get_traits_service
from .claude_service import get_zygotrix_claude_service

logger = logging.getLogger(__name__)


class ZygotrixChatService:
    """Service for handling Zygotrix AI chat operations."""

    def __init__(self):
        self.claude_service = get_zygotrix_claude_service()
        self.rate_limiter = get_rate_limiter()
        self.token_analytics = get_token_analytics_service()
        self.rag_service = get_rag_service()
        self.traits_service = get_traits_service()

    async def process_chat_request(
        self,
        chat_request: ChatRequest,
        current_user: UserProfile,
    ) -> Tuple[Any, Optional[str], Optional[str]]:
        """
        Process a chat request and return response data.

        Returns:
            Tuple of (response, conversation_id, message_id) where response is either
            StreamingResponse or ChatResponse
        """
        user_id = current_user.id
        user_name = current_user.name if hasattr(current_user, 'name') else None
        is_admin = hasattr(current_user, 'user_role') and current_user.user_role in ["admin", "super_admin"]

        # Check rate limit
        allowed, usage = self.rate_limiter.check_limit(user_id, is_admin=is_admin)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Rate limit exceeded. Please wait for the cooldown period.",
                    "tokens_used": usage.get("tokens_used", 0),
                    "tokens_remaining": 0,
                    "reset_time": usage.get("reset_time"),
                    "cooldown_active": True
                }
            )

        # Get or create conversation
        conversation = await self._get_or_create_conversation(chat_request, user_id)

        # Get conversation settings
        conv_settings = conversation.settings
        model = chat_request.model or conv_settings.model
        temperature = chat_request.temperature if chat_request.temperature is not None else conv_settings.temperature
        max_tokens = chat_request.max_tokens or conv_settings.max_tokens

        # Save user message
        user_message = MessageService.create_message(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=chat_request.message,
            parent_message_id=chat_request.parent_message_id,
            attachments=[a.model_dump() for a in chat_request.attachments] if chat_request.attachments else []
        )

        # Build context
        combined_context = await self._build_context(chat_request.message)

        # Get conversation history and build Claude messages
        claude_messages = self._build_claude_messages(
            conversation.id,
            conv_settings.context_window_messages,
            chat_request.message,
            combined_context
        )

        # Get system prompt
        system_prompt = self._get_system_prompt(chat_request.page_context, combined_context)

        # Handle streaming vs non-streaming
        if chat_request.stream:
            return await self._handle_streaming_chat(
                claude_messages, system_prompt, model, max_tokens, temperature,
                conversation, user_message, chat_request, user_id, user_name
            )
        else:
            return await self._handle_non_streaming_chat(
                claude_messages, system_prompt, model, max_tokens, temperature,
                conversation, user_message, chat_request, user_id, user_name
            )

    async def regenerate_message_response(
        self,
        conversation_id: str,
        message_id: str,
        current_user: UserProfile,
    ) -> ChatResponse:
        """Regenerate a response for a specific message."""
        user_id = current_user.id
        user_name = current_user.name if hasattr(current_user, 'name') else None

        conversation = ConversationService.get_conversation(conversation_id, user_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get the original message
        original_message = MessageService.get_message(message_id)
        if not original_message or original_message.role != MessageRole.ASSISTANT:
            raise HTTPException(status_code=400, detail="Can only regenerate assistant messages")

        # Get the user message that preceded this response
        user_message = self._find_preceding_user_message(conversation_id, message_id)
        if not user_message:
            raise HTTPException(status_code=400, detail="Could not find preceding user message")

        # Get settings
        conv_settings = conversation.settings
        model = conv_settings.model
        temperature = conv_settings.temperature
        max_tokens = conv_settings.max_tokens

        # Build context and messages
        combined_context = await self._build_context(user_message.content)
        claude_messages = self._build_claude_messages_for_regeneration(
            conversation_id, user_message, combined_context
        )

        system_prompt = get_zigi_system_prompt()

        # Generate new response
        content, metadata = await self.claude_service.generate_response(
            claude_messages, system_prompt, model, max_tokens, temperature
        )

        msg_metadata = MessageMetadata(
            input_tokens=metadata.get("input_tokens", 0),
            output_tokens=metadata.get("output_tokens", 0),
            total_tokens=metadata.get("total_tokens", 0),
            model=model,
        )

        # Create as a new version/sibling
        new_message = MessageService.update_message(
            message_id,
            content,
            create_new_version=True
        )

        # Update with metadata
        from ...services.zygotrix_ai_service import get_messages_collection
        collection = get_messages_collection()
        if collection and new_message:
            collection.update_one(
                {"id": new_message.id},
                {"$set": {"metadata": msg_metadata.model_dump()}}
            )

        # Record token usage
        self._record_token_usage(
            user_id, user_name, metadata, user_message.content, model
        )

        return ChatResponse(
            conversation_id=conversation_id,
            message=new_message,
            conversation_title=conversation.title,
            usage=msg_metadata,
        )

    # =========================================================================
    # PRIVATE HELPER METHODS
    # =========================================================================

    async def _get_or_create_conversation(self, chat_request: ChatRequest, user_id: str):
        """Get existing conversation or create a new one."""
        if chat_request.conversation_id:
            conversation = ConversationService.get_conversation(
                chat_request.conversation_id, user_id
            )
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            return conversation
        else:
            # Create new conversation
            conv_data = ConversationCreate(
                title=chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else ""),
                page_context=chat_request.page_context,
            )
            return ConversationService.create_conversation(user_id, conv_data)

    async def _build_context(self, message: str) -> str:
        """Build combined context from traits and RAG."""
        traits_context = self.traits_service.get_traits_context(message)
        llama_context = await self.rag_service.retrieve_context(message)

        if llama_context:
            return f"{traits_context}\n\n{llama_context}" if traits_context else llama_context
        return traits_context

    def _build_claude_messages(
        self,
        conversation_id: str,
        max_messages: int,
        current_message: str,
        combined_context: str
    ) -> list:
        """Build message history for Claude."""
        history = MessageService.get_conversation_context(
            conversation_id,
            max_messages=max_messages
        )

        claude_messages = []
        for msg in history[:-1]:  # Exclude the just-added user message
            claude_messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current message with context
        current_content = current_message
        if combined_context:
            current_content = f"""Background information:
{combined_context}

Question: {current_message}"""

        claude_messages.append({"role": "user", "content": current_content})
        return claude_messages

    def _build_claude_messages_for_regeneration(
        self,
        conversation_id: str,
        user_message,
        combined_context: str
    ) -> list:
        """Build message history for regeneration."""
        history = MessageService.get_conversation_context(conversation_id, max_messages=20)

        claude_messages = []
        for msg in history:
            if msg.get("content") == user_message.content:
                break
            claude_messages.append(msg)

        current_content = user_message.content
        if combined_context:
            current_content = f"""Background information:
{combined_context}

Question: {user_message.content}"""

        claude_messages.append({"role": "user", "content": current_content})
        return claude_messages

    def _get_system_prompt(self, page_context: Optional[str], combined_context: str) -> str:
        """Get appropriate system prompt based on context."""
        is_simulation = page_context and "Simulation" in page_context
        if is_simulation:
            return get_simulation_tool_prompt("User", combined_context)
        else:
            return get_zigi_prompt_with_tools()

    def _find_preceding_user_message(self, conversation_id: str, message_id: str):
        """Find the user message that preceded an assistant message."""
        messages = MessageService.get_messages(conversation_id, limit=100)
        for i, msg in enumerate(messages.messages):
            if msg.id == message_id and i > 0:
                prev_msg = messages.messages[i - 1]
                if prev_msg.role == MessageRole.USER:
                    return prev_msg
        return None

    def _record_token_usage(
        self,
        user_id: str,
        user_name: Optional[str],
        metadata: Dict[str, Any],
        message_preview: str,
        model: str
    ):
        """Record token usage for rate limiting and analytics."""
        total_tokens = metadata.get("total_tokens", 0)
        if total_tokens > 0:
            self.rate_limiter.record_usage(user_id, total_tokens)

        # Check if prompt caching was used
        cache_read_tokens = metadata.get("cache_read_input_tokens", 0)
        prompt_cache_used = cache_read_tokens > 0

        self.token_analytics.log_usage(
            user_id=user_id,
            user_name=user_name,
            input_tokens=metadata.get("input_tokens", 0),
            output_tokens=metadata.get("output_tokens", 0),
            cached=prompt_cache_used,
            message_preview=message_preview[:100],
            model=model,
            cache_creation_input_tokens=metadata.get("cache_creation_input_tokens", 0),
            cache_read_input_tokens=cache_read_tokens
        )

    async def _handle_streaming_chat(
        self,
        claude_messages: list,
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        conversation,
        user_message,
        chat_request: ChatRequest,
        user_id: str,
        user_name: Optional[str]
    ):
        """Handle streaming chat response."""
        from fastapi.responses import StreamingResponse

        logger.info("Using STREAMING mode (MCP tools NOT available in streaming)")

        async def event_generator():
            assistant_content = ""
            metadata = None

            async for chunk in self.claude_service.stream_response(
                claude_messages, system_prompt, model, max_tokens, temperature
            ):
                if chunk["type"] == "content":
                    assistant_content += chunk.get("content", "")
                    yield f"data: {json.dumps(chunk)}\n\n"

                elif chunk["type"] == "metadata":
                    metadata = chunk.get("metadata", {})

                elif chunk["type"] == "error":
                    yield f"data: {json.dumps(chunk)}\n\n"

                elif chunk["type"] == "done":
                    # Save assistant message
                    assistant_message = None
                    if assistant_content:
                        msg_metadata = MessageMetadata(
                            input_tokens=metadata.get("input_tokens", 0) if metadata else 0,
                            output_tokens=metadata.get("output_tokens", 0) if metadata else 0,
                            total_tokens=metadata.get("total_tokens", 0) if metadata else 0,
                            model=model,
                        )
                        assistant_message = MessageService.create_message(
                            conversation_id=conversation.id,
                            role=MessageRole.ASSISTANT,
                            content=assistant_content,
                            metadata=msg_metadata,
                            parent_message_id=user_message.id,
                        )

                        # Update conversation title if first message
                        if conversation.message_count <= 2:
                            ConversationService.update_conversation(
                                conversation.id,
                                user_id,
                                ConversationUpdate(title=chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else ""))
                            )

                        # Record token usage
                        self._record_token_usage(
                            user_id, user_name, metadata if metadata else {}, chat_request.message, model
                        )

                    yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation.id, 'message_id': assistant_message.id if assistant_content else None})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        ), conversation.id, None

    async def _handle_non_streaming_chat(
        self,
        claude_messages: list,
        system_prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        conversation,
        user_message,
        chat_request: ChatRequest,
        user_id: str,
        user_name: Optional[str]
    ) -> Tuple[ChatResponse, str, str]:
        """Handle non-streaming chat response with tool support."""
        logger.info("Using NON-STREAMING mode with MCP tools enabled")

        # Non-streaming response with tool support
        content, metadata = await self.claude_service.generate_response_with_tools(
            claude_messages, system_prompt, model, max_tokens, temperature,
            use_tools=True,
        )

        # Log tool usage if any tools were used
        tools_used = metadata.get("tools_used", [])
        if tools_used:
            logger.info(f"Tools used in response: {[t['name'] for t in tools_used]}")

        msg_metadata = MessageMetadata(
            input_tokens=metadata.get("input_tokens", 0),
            output_tokens=metadata.get("output_tokens", 0),
            total_tokens=metadata.get("total_tokens", 0),
            model=model,
        )

        assistant_message = MessageService.create_message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=content,
            metadata=msg_metadata,
            parent_message_id=user_message.id,
        )

        # Update conversation title if first message
        if conversation.message_count <= 2:
            ConversationService.update_conversation(
                conversation.id,
                user_id,
                ConversationUpdate(title=chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else ""))
            )

        # Record token usage
        self._record_token_usage(
            user_id, user_name, metadata, chat_request.message, model
        )

        return ChatResponse(
            conversation_id=conversation.id,
            message=assistant_message,
            conversation_title=conversation.title,
            usage=msg_metadata,
        ), conversation.id, assistant_message.id


# Singleton instance
_chat_service_instance: Optional[ZygotrixChatService] = None


def get_zygotrix_chat_service() -> ZygotrixChatService:
    """Get singleton instance of ZygotrixChatService."""
    global _chat_service_instance
    if _chat_service_instance is None:
        _chat_service_instance = ZygotrixChatService()
    return _chat_service_instance
