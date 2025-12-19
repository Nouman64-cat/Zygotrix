"""
Zygotrix AI API Routes
=======================
Professional chatbot API with streaming, conversation management,
folders, sharing, export, and search capabilities.
"""

import logging
import os
import json
import asyncio
from datetime import datetime, timezone
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

from ..schema.zygotrix_ai import (
    # Conversations
    Conversation, ConversationCreate, ConversationUpdate,
    ConversationListResponse, ConversationStatus, ConversationSettings,
    # Messages
    Message, MessageCreate, MessageUpdate, MessageRole, MessageStatus,
    MessageMetadata, MessageListResponse, FeedbackType,
    # Folders
    Folder, FolderCreate, FolderUpdate, FolderListResponse,
    # Chat
    ChatRequest, ChatResponse, StreamChunk,
    # Sharing
    ShareConversationRequest, ShareConversationResponse,
    # Export
    ExportRequest, ExportResponse, ExportFormat,
    # Search
    SearchRequest, SearchResponse,
    # Analytics
    UserChatAnalytics,
    # Prompt Templates
    PromptTemplate, PromptTemplateCreate, PromptTemplateUpdate,
)

from ..services.zygotrix_ai_service import (
    ConversationService, MessageService, FolderService,
    SharingService, ExportService, SearchService,
    AnalyticsService, PromptTemplateService,
)

from ..services.chatbot_settings import get_chatbot_settings
from ..dependencies import get_current_user, get_current_admin
from ..schema.auth import UserProfile
from ..prompt_engineering.prompts import get_zigi_system_prompt, get_simulation_tool_prompt
from ..chatbot_tools import (
    get_traits_count, search_traits, get_trait_details,
    calculate_punnett_square, parse_cross_from_message
)
from .chatbot import _rate_limiter, _log_token_usage  # Import the rate limiter instance and token logging function

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/zygotrix-ai", tags=["Zygotrix AI"])

# Environment variables
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")
LLAMA_CLOUD_BASE_URL = "https://api.cloud.eu.llamaindex.ai"


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_user_id_from_profile(current_user: UserProfile = Depends(get_current_user)) -> str:
    """Extract user ID from authenticated user profile."""
    return current_user.id


def get_traits_context(message: str) -> str:
    """Get traits-specific context for the message."""
    import re
    message_lower = message.lower()
    context_parts = []

    # Check for Punnett square queries
    cross_keywords = ["cross", "punnett", "×", "offspring", "genotype", "phenotype"]
    if any(keyword in message_lower for keyword in cross_keywords):
        cross_data = parse_cross_from_message(message)
        if cross_data.get("found"):
            p1 = cross_data["parent1"]
            p2 = cross_data["parent2"]
            result = calculate_punnett_square(p1, p2)

            if result.get("success"):
                genotype_info = [
                    f"  - {g['genotype']}: {g['percentage']} ({g['phenotype']})"
                    for g in result["offspring_genotypes"]
                ]

                context_parts.append(f"""
PUNNETT SQUARE CALCULATION:
Cross: {p1} × {p2}
Cross Type: {result['cross_type']}

Offspring Genotypes:
{chr(10).join(genotype_info)}

Genotype Ratio: {result['genotype_ratio']}
Phenotype Ratio: {result['phenotype_ratio']}

Summary: {result['summary']}
""")

    # Check for count queries
    count_patterns = [
        r"how many traits", r"number of traits", r"total traits",
        r"traits.*count", r"count.*traits"
    ]
    if any(re.search(pattern, message_lower) for pattern in count_patterns):
        count_data = get_traits_count()
        if not count_data.get("error"):
            context_parts.append(f"""
TRAITS DATABASE:
{count_data['message']}
- Total: {count_data['total_traits']}
- Monogenic: {count_data['monogenic_traits']}
- Polygenic: {count_data['polygenic_traits']}
""")

    # Search for related traits
    if not context_parts:
        search_result = search_traits(message_lower, limit=3)
        if search_result.get("found") and search_result.get("count", 0) > 0:
            results = search_result.get("results", [])[:3]
            traits_info = [f"- {r['name']} ({r['type']}, {r['inheritance']})" for r in results]
            context_parts.append(f"""
RELATED TRAITS:
{chr(10).join(traits_info)}
""")

    return "\n".join(context_parts)


async def retrieve_llama_context(query: str) -> str:
    """Retrieve context from LlamaCloud RAG."""
    if not LLAMA_CLOUD_API_KEY:
        return ""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get pipeline ID first
            response = await client.get(
                f"{LLAMA_CLOUD_BASE_URL}/api/v1/pipelines",
                headers={
                    "Accept": "application/json",
                    "Authorization": f"Bearer {LLAMA_CLOUD_API_KEY}",
                },
                params={
                    "project_name": "Default",
                    "pipeline_name": "Zygotrix",
                }
            )

            if response.status_code != 200:
                return ""

            data = response.json()
            pipelines = data if isinstance(data, list) else data.get("pipelines", [])
            pipeline_id = None
            for pipeline in pipelines:
                if pipeline.get("name") == "Zygotrix":
                    pipeline_id = pipeline.get("id")
                    break

            if not pipeline_id:
                return ""

            # Retrieve context
            response = await client.post(
                f"{LLAMA_CLOUD_BASE_URL}/api/v1/pipelines/{pipeline_id}/retrieve",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {LLAMA_CLOUD_API_KEY}",
                },
                json={"query": query, "similarity_top_k": 3}
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("retrievals"):
                    return "\n\n".join([r.get("text", "") for r in data["retrievals"]])

    except Exception as e:
        logger.error(f"Error retrieving LlamaCloud context: {e}")

    return ""


async def stream_claude_response(
    messages: list,
    system_prompt: str,
    model: str,
    max_tokens: int,
    temperature: float
) -> AsyncGenerator[dict, None]:
    """Stream response from Claude API."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": CLAUDE_API_KEY,
                    "content-type": "application/json",
                    "anthropic-version": "2023-06-01",
                },
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


async def generate_claude_response(
    messages: list,
    system_prompt: str,
    model: str,
    max_tokens: int,
    temperature: float
) -> tuple[str, dict]:
    """Generate non-streaming response from Claude."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": CLAUDE_API_KEY,
                    "content-type": "application/json",
                    "anthropic-version": "2023-06-01",
                },
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


# =============================================================================
# CHAT ENDPOINTS
# =============================================================================

@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Send a message and get a response. Supports streaming.

    If conversation_id is not provided, creates a new conversation.
    Set stream=True for Server-Sent Events streaming response.
    """
    # Check if chatbot is enabled
    try:
        settings = get_chatbot_settings()
        if not settings.enabled:
            raise HTTPException(status_code=503, detail="Chatbot is currently disabled")
    except Exception as e:
        logger.warning(f"Failed to check chatbot status: {e}")

    # Extract user_id and user_name for convenience
    user_id = current_user.id
    user_name = current_user.name if hasattr(current_user, 'name') else None

    # Check rate limit
    allowed, usage = _rate_limiter.check_limit(user_id)
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
    conversation = None
    if request.conversation_id:
        conversation = ConversationService.get_conversation(
            request.conversation_id, user_id
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation
        conv_data = ConversationCreate(
            title=request.message[:50] + ("..." if len(request.message) > 50 else ""),
            page_context=request.page_context,
        )
        conversation = ConversationService.create_conversation(user_id, conv_data)

    # Get conversation settings
    conv_settings = conversation.settings
    model = request.model or conv_settings.model
    temperature = request.temperature if request.temperature is not None else conv_settings.temperature
    max_tokens = request.max_tokens or conv_settings.max_tokens

    # Save user message
    user_message = MessageService.create_message(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=request.message,
        parent_message_id=request.parent_message_id,
        attachments=[a.model_dump() for a in request.attachments] if request.attachments else []
    )

    # Build context
    traits_context = get_traits_context(request.message)
    llama_context = await retrieve_llama_context(request.message)

    combined_context = traits_context
    if llama_context:
        combined_context = f"{traits_context}\n\n{llama_context}" if traits_context else llama_context

    # Get conversation history
    history = MessageService.get_conversation_context(
        conversation.id,
        max_messages=conv_settings.context_window_messages
    )

    # Build messages for Claude
    claude_messages = []
    for msg in history[:-1]:  # Exclude the just-added user message
        claude_messages.append({"role": msg["role"], "content": msg["content"]})

    # Add current message with context
    current_content = request.message
    if combined_context:
        current_content = f"""Background information:
{combined_context}

Question: {request.message}"""

    claude_messages.append({"role": "user", "content": current_content})

    # Get system prompt
    is_simulation = request.page_context and "Simulation" in request.page_context
    if is_simulation:
        system_prompt = get_simulation_tool_prompt("User", combined_context)
    else:
        system_prompt = get_zigi_system_prompt()

    if request.stream:
        # Streaming response
        async def event_generator():
            assistant_content = ""
            metadata = None

            async for chunk in stream_claude_response(
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
                                ConversationUpdate(title=request.message[:50] + ("..." if len(request.message) > 50 else ""))
                            )

                        # Record token usage for rate limiting (same as non-streaming path)
                        total_tokens = metadata.get("total_tokens", 0) if metadata else 0
                        if total_tokens > 0:
                            _rate_limiter.record_usage(user_id, total_tokens)

                        # Log token usage to MongoDB for analytics
                        _log_token_usage(
                            user_id=user_id,
                            user_name=user_name,
                            input_tokens=metadata.get("input_tokens", 0) if metadata else 0,
                            output_tokens=metadata.get("output_tokens", 0) if metadata else 0,
                            cached=False,
                            message_preview=request.message[:100],
                            model=model
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
        )
    else:
        # Non-streaming response
        content, metadata = await generate_claude_response(
            claude_messages, system_prompt, model, max_tokens, temperature
        )

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
                ConversationUpdate(title=request.message[:50] + ("..." if len(request.message) > 50 else ""))
            )

        # Record token usage for rate limiting
        total_tokens = metadata.get("total_tokens", 0)
        if total_tokens > 0:
            _rate_limiter.record_usage(user_id, total_tokens)

        # Log token usage to MongoDB for analytics
        _log_token_usage(
            user_id=user_id,
            user_name=user_name,
            input_tokens=metadata.get("input_tokens", 0),
            output_tokens=metadata.get("output_tokens", 0),
            cached=False,
            message_preview=request.message[:100],
            model=model
        )

        return ChatResponse(
            conversation_id=conversation.id,
            message=assistant_message,
            conversation_title=conversation.title,
            usage=msg_metadata,
        )


@router.get("/rate-limit")
async def get_rate_limit_status(
    user_id: str = Depends(get_user_id_from_profile)
):
    """Get the current rate limit status for the authenticated user."""
    usage = _rate_limiter.get_usage(user_id)
    return {
        "tokens_used": usage.get("tokens_used", 0),
        "tokens_remaining": usage.get("tokens_remaining", 25000),
        "max_tokens": _rate_limiter.max_tokens,
        "reset_time": usage.get("reset_time"),
        "is_limited": usage.get("is_limited", False),
        "cooldown_active": usage.get("cooldown_active", False),
        "cooldown_hours": _rate_limiter.cooldown_seconds / 3600,
    }


@router.post("/chat/{conversation_id}/regenerate/{message_id}")
async def regenerate_response(
    conversation_id: str,
    message_id: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Regenerate a response for a message."""
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
    messages = MessageService.get_messages(conversation_id, limit=100)
    user_message = None
    for i, msg in enumerate(messages.messages):
        if msg.id == message_id and i > 0:
            user_message = messages.messages[i - 1]
            break

    if not user_message or user_message.role != MessageRole.USER:
        raise HTTPException(status_code=400, detail="Could not find preceding user message")

    # Get settings
    conv_settings = conversation.settings
    model = conv_settings.model
    temperature = conv_settings.temperature
    max_tokens = conv_settings.max_tokens

    # Build context and messages
    traits_context = get_traits_context(user_message.content)
    llama_context = await retrieve_llama_context(user_message.content)
    combined_context = f"{traits_context}\n\n{llama_context}" if llama_context else traits_context

    # Get history up to the user message
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

    system_prompt = get_zigi_system_prompt()

    # Generate new response
    content, metadata = await generate_claude_response(
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
    from ..services.zygotrix_ai_service import get_messages_collection
    collection = get_messages_collection()
    if collection and new_message:
        collection.update_one(
            {"id": new_message.id},
            {"$set": {"metadata": msg_metadata.model_dump()}}
        )

    # Record token usage for rate limiting
    total_tokens = metadata.get("total_tokens", 0)
    if total_tokens > 0:
        _rate_limiter.record_usage(user_id, total_tokens)

    # Log token usage to MongoDB for analytics
    _log_token_usage(
        user_id=user_id,
        user_name=user_name,
        input_tokens=metadata.get("input_tokens", 0),
        output_tokens=metadata.get("output_tokens", 0),
        cached=False,
        message_preview=user_message.content[:100],
        model=model
    )

    return ChatResponse(
        conversation_id=conversation_id,
        message=new_message,
        conversation_title=conversation.title,
        usage=msg_metadata,
    )


# =============================================================================
# CONVERSATION ENDPOINTS
# =============================================================================

@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    status: Optional[ConversationStatus] = None,
    folder_id: Optional[str] = None,
    is_starred: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_user_id_from_profile)
):
    """List all conversations for the authenticated user."""
    return ConversationService.list_conversations(
        user_id=user_id,
        status=status,
        folder_id=folder_id,
        is_starred=is_starred,
        page=page,
        page_size=page_size,
        search_query=search,
    )


@router.post("/conversations", response_model=Conversation)
async def create_conversation(
    data: ConversationCreate,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Create a new conversation."""
    return ConversationService.create_conversation(user_id, data)


@router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Get a specific conversation."""
    conversation = ConversationService.get_conversation(conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.patch("/conversations/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: str,
    data: ConversationUpdate,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Update a conversation (title, pinned, starred, folder, tags)."""
    conversation = ConversationService.update_conversation(conversation_id, user_id, data)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    permanent: bool = Query(default=False),
    user_id: str = Depends(get_user_id_from_profile)
):
    """Delete a conversation (soft delete by default)."""
    success = ConversationService.delete_conversation(
        conversation_id, user_id, soft_delete=not permanent
    )
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted"}


@router.post("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: str,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Archive a conversation."""
    success = ConversationService.archive_conversation(conversation_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation archived"}


@router.post("/conversations/{conversation_id}/restore")
async def restore_conversation(
    conversation_id: str,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Restore an archived or deleted conversation."""
    success = ConversationService.restore_conversation(conversation_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation restored"}


# =============================================================================
# MESSAGE ENDPOINTS
# =============================================================================

@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
async def get_messages(
    conversation_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    before_id: Optional[str] = None,
    after_id: Optional[str] = None,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Get messages for a conversation."""
    # Verify ownership
    conversation = ConversationService.get_conversation(conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return MessageService.get_messages(
        conversation_id=conversation_id,
        limit=limit,
        before_id=before_id,
        after_id=after_id,
    )


@router.patch("/messages/{message_id}")
async def update_message(
    message_id: str,
    data: MessageUpdate,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Edit a message (creates new version)."""
    message = MessageService.get_message(message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Verify ownership
    conversation = ConversationService.get_conversation(message.conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    updated = MessageService.update_message(message_id, data.content)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update message")

    return updated


@router.post("/messages/{message_id}/feedback")
async def add_message_feedback(
    message_id: str,
    feedback_type: FeedbackType,
    comment: Optional[str] = None,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Add feedback (like/dislike) to a message."""
    message = MessageService.get_message(message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    success = MessageService.add_feedback(message_id, feedback_type, comment)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add feedback")

    return {"message": "Feedback added"}


# =============================================================================
# FOLDER ENDPOINTS
# =============================================================================

@router.get("/folders", response_model=FolderListResponse)
async def list_folders(user_id: str = Depends(get_user_id_from_profile)):
    """List all folders for the authenticated user."""
    return FolderService.list_folders(user_id)


@router.post("/folders", response_model=Folder)
async def create_folder(
    data: FolderCreate,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Create a new folder."""
    return FolderService.create_folder(user_id, data)


@router.get("/folders/{folder_id}", response_model=Folder)
async def get_folder(
    folder_id: str,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Get a specific folder."""
    folder = FolderService.get_folder(folder_id, user_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder


@router.patch("/folders/{folder_id}", response_model=Folder)
async def update_folder(
    folder_id: str,
    data: FolderUpdate,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Update a folder."""
    folder = FolderService.update_folder(folder_id, user_id, data)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder


@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: str,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Delete a folder (conversations moved to root)."""
    success = FolderService.delete_folder(folder_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"message": "Folder deleted"}


# =============================================================================
# SHARING ENDPOINTS
# =============================================================================

@router.post("/conversations/{conversation_id}/share", response_model=ShareConversationResponse)
async def share_conversation(
    conversation_id: str,
    data: ShareConversationRequest = ShareConversationRequest(),
    user_id: str = Depends(get_user_id_from_profile)
):
    """Share a conversation and get a public link."""
    return SharingService.share_conversation(conversation_id, user_id, data)


@router.delete("/conversations/{conversation_id}/share")
async def unshare_conversation(
    conversation_id: str,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Remove sharing from a conversation."""
    success = SharingService.unshare_conversation(conversation_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Sharing removed"}


@router.get("/shared/{share_id}")
async def get_shared_conversation(share_id: str):
    """Get a shared conversation (public endpoint)."""
    conversation, messages = SharingService.get_shared_conversation(share_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Shared conversation not found or expired")

    return {
        "conversation": conversation,
        "messages": messages,
    }


# =============================================================================
# EXPORT ENDPOINTS
# =============================================================================

@router.post("/conversations/{conversation_id}/export", response_model=ExportResponse)
async def export_conversation(
    conversation_id: str,
    data: ExportRequest = ExportRequest(),
    user_id: str = Depends(get_user_id_from_profile)
):
    """Export a conversation in various formats."""
    return ExportService.export_conversation(conversation_id, user_id, data)


# =============================================================================
# SEARCH ENDPOINTS
# =============================================================================

@router.post("/search", response_model=SearchResponse)
async def search_conversations(
    data: SearchRequest,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Search conversations and messages."""
    return SearchService.search(user_id, data)


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/analytics", response_model=UserChatAnalytics)
async def get_analytics(user_id: str = Depends(get_user_id_from_profile)):
    """Get chat usage analytics for the authenticated user."""
    return AnalyticsService.get_user_analytics(user_id)


# =============================================================================
# PROMPT TEMPLATE ENDPOINTS
# =============================================================================

@router.get("/templates")
async def list_templates(
    category: Optional[str] = None,
    include_public: bool = True,
    user_id: str = Depends(get_user_id_from_profile)
):
    """List prompt templates."""
    templates = PromptTemplateService.list_templates(user_id, include_public, category)
    return {"templates": templates, "total": len(templates)}


@router.post("/templates", response_model=PromptTemplate)
async def create_template(
    data: PromptTemplateCreate,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Create a new prompt template."""
    return PromptTemplateService.create_template(user_id, data)


@router.get("/templates/{template_id}", response_model=PromptTemplate)
async def get_template(
    template_id: str,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Get a specific template."""
    template = PromptTemplateService.get_template(template_id, user_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/templates/{template_id}/use")
async def use_template(template_id: str):
    """Mark a template as used (increments use count)."""
    success = PromptTemplateService.use_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template use recorded"}


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    user_id: str = Depends(get_user_id_from_profile)
):
    """Delete a template."""
    success = PromptTemplateService.delete_template(template_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}


# =============================================================================
# SETTINGS & STATUS ENDPOINTS
# =============================================================================

@router.get("/status")
async def get_status():
    """Get chatbot status and available models."""
    try:
        settings = get_chatbot_settings()
        return {
            "enabled": settings.enabled,
            "default_model": settings.model,
            "available_models": [
                {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "description": "Fast and efficient"},
                {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet", "description": "Balanced performance"},
                {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "description": "Most capable"},
                {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "description": "Latest and most intelligent"},
            ],
            "features": {
                "streaming": True,
                "conversation_history": True,
                "message_editing": True,
                "regeneration": True,
                "folders": True,
                "sharing": True,
                "export": True,
                "search": True,
                "prompt_templates": True,
            }
        }
    except Exception as e:
        logger.warning(f"Failed to get chatbot status: {e}")
        return {"enabled": True}


@router.get("/models")
async def get_available_models():
    """Get list of available AI models."""
    return {
        "models": [
            {
                "id": "claude-3-haiku-20240307",
                "name": "Claude 3 Haiku",
                "provider": "anthropic",
                "description": "Fast and efficient for simple tasks",
                "context_window": 200000,
                "max_output": 4096,
                "input_cost_per_1k": 0.00025,
                "output_cost_per_1k": 0.00125,
            },
            {
                "id": "claude-3-sonnet-20240229",
                "name": "Claude 3 Sonnet",
                "provider": "anthropic",
                "description": "Balanced performance and cost",
                "context_window": 200000,
                "max_output": 4096,
                "input_cost_per_1k": 0.003,
                "output_cost_per_1k": 0.015,
            },
            {
                "id": "claude-3-opus-20240229",
                "name": "Claude 3 Opus",
                "provider": "anthropic",
                "description": "Most capable for complex tasks",
                "context_window": 200000,
                "max_output": 4096,
                "input_cost_per_1k": 0.015,
                "output_cost_per_1k": 0.075,
            },
            {
                "id": "claude-3-5-sonnet-20241022",
                "name": "Claude 3.5 Sonnet",
                "provider": "anthropic",
                "description": "Latest model with improved reasoning",
                "context_window": 200000,
                "max_output": 8192,
                "input_cost_per_1k": 0.003,
                "output_cost_per_1k": 0.015,
            },
        ]
    }


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================

@router.get("/admin/stats")
async def get_admin_stats(
    admin: UserProfile = Depends(get_current_admin)
):
    """Get overall Zygotrix AI statistics (admin only)."""
    from ..services.zygotrix_ai_service import (
        get_conversations_collection,
        get_messages_collection,
        get_folders_collection,
        get_shared_conversations_collection,
    )

    conversations_collection = get_conversations_collection()
    messages_collection = get_messages_collection()
    folders_collection = get_folders_collection()
    shared_collection = get_shared_conversations_collection()

    stats = {
        "total_conversations": 0,
        "active_conversations": 0,
        "archived_conversations": 0,
        "deleted_conversations": 0,
        "total_messages": 0,
        "total_folders": 0,
        "total_shared": 0,
        "total_users": 0,
        "conversations_today": 0,
        "messages_today": 0,
    }

    if conversations_collection:
        stats["total_conversations"] = conversations_collection.count_documents({})
        stats["active_conversations"] = conversations_collection.count_documents({
            "status": ConversationStatus.ACTIVE.value
        })
        stats["archived_conversations"] = conversations_collection.count_documents({
            "status": ConversationStatus.ARCHIVED.value
        })
        stats["deleted_conversations"] = conversations_collection.count_documents({
            "status": ConversationStatus.DELETED.value
        })

        # Unique users
        unique_users = conversations_collection.distinct("user_id")
        stats["total_users"] = len(unique_users)

        # Today's conversations
        from datetime import datetime, timedelta
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        stats["conversations_today"] = conversations_collection.count_documents({
            "created_at": {"$gte": today.isoformat()}
        })

    if messages_collection:
        stats["total_messages"] = messages_collection.count_documents({})

        # Today's messages
        stats["messages_today"] = messages_collection.count_documents({
            "created_at": {"$gte": today.isoformat()}
        })

    if folders_collection:
        stats["total_folders"] = folders_collection.count_documents({})

    if shared_collection:
        stats["total_shared"] = shared_collection.count_documents({})

    return stats


@router.get("/admin/users")
async def get_admin_user_stats(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin: UserProfile = Depends(get_current_admin)
):
    """Get per-user Zygotrix AI statistics (admin only)."""
    from ..services.zygotrix_ai_service import get_conversations_collection

    conversations_collection = get_conversations_collection()
    if not conversations_collection:
        return {"users": [], "total": 0}

    # Aggregate by user
    pipeline = [
        {"$group": {
            "_id": "$user_id",
            "conversation_count": {"$sum": 1},
            "total_tokens": {"$sum": "$total_tokens_used"},
            "total_messages": {"$sum": "$message_count"},
            "first_conversation": {"$min": "$created_at"},
            "last_conversation": {"$max": "$updated_at"},
        }},
        {"$sort": {"total_tokens": -1}},
        {"$skip": (page - 1) * page_size},
        {"$limit": page_size},
    ]

    results = list(conversations_collection.aggregate(pipeline))

    # Get total count
    total_pipeline = [
        {"$group": {"_id": "$user_id"}},
        {"$count": "total"}
    ]
    total_result = list(conversations_collection.aggregate(total_pipeline))
    total = total_result[0]["total"] if total_result else 0

    users = []
    for r in results:
        users.append({
            "user_id": r["_id"],
            "conversation_count": r["conversation_count"],
            "total_tokens": r.get("total_tokens", 0),
            "total_messages": r.get("total_messages", 0),
            "first_conversation": r.get("first_conversation"),
            "last_conversation": r.get("last_conversation"),
        })

    return {
        "users": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/admin/conversations")
async def get_admin_conversations(
    user_id: Optional[str] = None,
    status: Optional[ConversationStatus] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin: UserProfile = Depends(get_current_admin)
):
    """List all conversations (admin only)."""
    from ..services.zygotrix_ai_service import get_conversations_collection

    conversations_collection = get_conversations_collection()
    if not conversations_collection:
        return {"conversations": [], "total": 0}

    query = {}
    if user_id:
        query["user_id"] = user_id
    if status:
        query["status"] = status.value

    total = conversations_collection.count_documents(query)

    docs = list(
        conversations_collection.find(query)
        .sort("updated_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )

    conversations = []
    for doc in docs:
        doc.pop("_id", None)
        conversations.append({
            "id": doc["id"],
            "user_id": doc["user_id"],
            "title": doc["title"],
            "status": doc.get("status"),
            "message_count": doc.get("message_count", 0),
            "total_tokens_used": doc.get("total_tokens_used", 0),
            "is_shared": doc.get("is_shared", False),
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"],
        })

    return {
        "conversations": conversations,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.delete("/admin/conversations/{conversation_id}")
async def admin_delete_conversation(
    conversation_id: str,
    permanent: bool = Query(default=False),
    admin: UserProfile = Depends(get_current_admin)
):
    """Delete any conversation (admin only)."""
    from ..services.zygotrix_ai_service import (
        get_conversations_collection,
        get_messages_collection,
    )

    conversations_collection = get_conversations_collection()
    messages_collection = get_messages_collection()

    if not conversations_collection:
        raise HTTPException(status_code=503, detail="Database not available")

    if permanent:
        # Hard delete
        conversations_collection.delete_one({"id": conversation_id})
        if messages_collection:
            messages_collection.delete_many({"conversation_id": conversation_id})
    else:
        # Soft delete
        conversations_collection.update_one(
            {"id": conversation_id},
            {"$set": {
                "status": ConversationStatus.DELETED.value,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )

    return {"message": "Conversation deleted"}


@router.get("/admin/feedback")
async def get_admin_feedback(
    feedback_type: Optional[FeedbackType] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    admin: UserProfile = Depends(get_current_admin)
):
    """Get all message feedback (admin only)."""
    from ..services.zygotrix_ai_service import get_messages_collection

    messages_collection = get_messages_collection()
    if not messages_collection:
        return {"feedback": [], "total": 0}

    query = {"feedback": {"$exists": True, "$ne": None}}
    if feedback_type:
        query["feedback.type"] = feedback_type.value

    total = messages_collection.count_documents(query)

    docs = list(
        messages_collection.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )

    feedback_items = []
    for doc in docs:
        feedback_items.append({
            "message_id": doc["id"],
            "conversation_id": doc["conversation_id"],
            "content_preview": doc["content"][:200] if doc.get("content") else "",
            "role": doc["role"],
            "feedback": doc["feedback"],
            "created_at": doc["created_at"],
        })

    return {
        "feedback": feedback_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }
