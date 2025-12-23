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
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

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
from ..prompt_engineering.prompts import get_zigi_system_prompt, get_simulation_tool_prompt, get_zigi_prompt_with_tools
from ..chatbot_tools import (
    get_traits_count, search_traits, get_trait_details,
    calculate_punnett_square, parse_cross_from_message
)

from ..services.chatbot.rate_limiting_service import get_rate_limiter
from ..services.chatbot.token_analytics_service import get_token_analytics_service
from ..services import auth as auth_services 

from ..services.zygotrix_ai.claude_service import get_zygotrix_claude_service
from ..services.zygotrix_ai.admin_service import get_zygotrix_admin_service

from ..services.chatbot.rag_service import get_rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/zygotrix-ai", tags=["Zygotrix AI"])

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    # Check for forwarded headers (when behind proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Get the first IP in the chain (original client)
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    # Fall back to direct client IP
    return request.client.host if request.client else "Unknown"


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

# =============================================================================
# TOOLS ENDPOINT
# =============================================================================

@router.get("/tools")
async def list_available_tools():
    """
    List all available MCP tools that the AI can use.
    
    Returns the tools in Claude's native format.
    """
    tools = get_claude_tools_schema()
    return {
        "tools": tools,
        "count": len(tools),
        "description": "These are the tools available to Zigi (Zygotrix AI) for answering genetics questions.",
    }


# =============================================================================
# CHAT ENDPOINTS
# =============================================================================

@router.post("/chat")
async def chat(
    chat_request: ChatRequest,
    http_request: Request,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Send a message and get a response. Supports streaming.

    If conversation_id is not provided, creates a new conversation.
    Set stream=True for Server-Sent Events streaming response.
    """
    # Track user activity (login tracking for zygotrix_ai)
    try:
        ip_address = _get_client_ip(http_request)
        user_agent = http_request.headers.get("User-Agent")
        auth_services.update_user_activity(
            user_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as e:
        logger.warning(f"Failed to update user activity: {e}")

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

    # Check if user is admin or super admin
    is_admin = hasattr(current_user, 'user_role') and current_user.user_role in ["admin", "super_admin"]

    # Check rate limit
    allowed, usage = get_rate_limiter().check_limit(user_id, is_admin=is_admin)
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
    if chat_request.conversation_id:
        conversation = ConversationService.get_conversation(
            chat_request.conversation_id, user_id
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation
        conv_data = ConversationCreate(
            title=chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else ""),
            page_context=chat_request.page_context,
        )
        conversation = ConversationService.create_conversation(user_id, conv_data)

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
    traits_context = get_traits_context(chat_request.message)
    llama_context = await get_rag_service().retrieve_context(chat_request.message)

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
    current_content = chat_request.message
    if combined_context:
        current_content = f"""Background information:
{combined_context}

Question: {chat_request.message}"""

    claude_messages.append({"role": "user", "content": current_content})

    # Get system prompt (use tool-aware prompt for better tool calling)
    is_simulation = chat_request.page_context and "Simulation" in chat_request.page_context
    if is_simulation:
        system_prompt = get_simulation_tool_prompt("User", combined_context)
    else:
        system_prompt = get_zigi_prompt_with_tools()  # Use tool-aware prompt

    if chat_request.stream:
        logger.info("Using STREAMING mode (MCP tools NOT available in streaming)")
        # Streaming response
        async def event_generator():
            assistant_content = ""
            metadata = None

            async for chunk in get_zygotrix_claude_service().stream_response(
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
                                ConversationUpdate(title=chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else ""))
                            )

                        # Record token usage for rate limiting (same as non-streaming path)
                        total_tokens = metadata.get("total_tokens", 0) if metadata else 0
                        if total_tokens > 0:
                            get_rate_limiter().record_usage(user_id, total_tokens)

                        # Log token usage to MongoDB for analytics
                        get_token_analytics_service().log_usage(
                            user_id=user_id,
                            user_name=user_name,
                            input_tokens=metadata.get("input_tokens", 0) if metadata else 0,
                            output_tokens=metadata.get("output_tokens", 0) if metadata else 0,
                            cached=False,
                            message_preview=chat_request.message[:100],
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
        logger.info("Using NON-STREAMING mode with MCP tools enabled")
        # Non-streaming response with tool support
        content, metadata = await get_zygotrix_claude_service().generate_response_with_tools(
            claude_messages, system_prompt, model, max_tokens, temperature,
            use_tools=True,  # Enable MCP tools
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

        # Record token usage for rate limiting
        total_tokens = metadata.get("total_tokens", 0)
        if total_tokens > 0:
            get_rate_limiter().record_usage(user_id, total_tokens)

        # Log token usage to MongoDB for analytics
        get_token_analytics_service().log_usage(
            user_id=user_id,
            user_name=user_name,
            input_tokens=metadata.get("input_tokens", 0),
            output_tokens=metadata.get("output_tokens", 0),
            cached=False,
            message_preview=chat_request.message[:100],
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
    current_user: UserProfile = Depends(get_current_user)
):
    """Get the current rate limit status for the authenticated user."""
    user_id = current_user.id

    # Check if user is admin or super admin
    is_admin = hasattr(current_user, 'user_role') and current_user.user_role in ["admin", "super_admin"]

    # Use check_limit to get proper usage with admin unlimited tokens support
    _, usage = get_rate_limiter().check_limit(user_id, is_admin=is_admin)

    return {
        "tokens_used": usage.get("tokens_used", 0),
        "tokens_remaining": usage.get("tokens_remaining", 25000),
        "max_tokens": get_rate_limiter().max_tokens,
        "reset_time": usage.get("reset_time"),
        "is_limited": usage.get("is_limited", False),
        "cooldown_active": usage.get("cooldown_active", False),
        "cooldown_hours": get_rate_limiter().cooldown_seconds / 3600,
        "admin_unlimited": usage.get("admin_unlimited", False)
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
    llama_context = await get_rag_service().retrieve_context(user_message.content)
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
    content, metadata = await get_zygotrix_claude_service().generate_response(
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
        get_rate_limiter().record_usage(user_id, total_tokens)

    # Log token usage to MongoDB for analytics
    get_token_analytics_service().log_usage(
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
    """Get list of available AI models with accurate 2025 pricing."""
    return {
        "models": [
            {
                "id": "claude-3-haiku-20240307",
                "name": "Claude 3 Haiku",
                "provider": "anthropic",
                "description": "Fast and efficient for simple tasks",
                "context_window": 200000,
                "max_output": 4096,
                "input_cost_per_1k": 0.00025,  # $0.25 per MTok
                "output_cost_per_1k": 0.00125,  # $1.25 per MTok
            },
            {
                "id": "claude-3-sonnet-20240229",
                "name": "Claude 3 Sonnet",
                "provider": "anthropic",
                "description": "Balanced performance and cost",
                "context_window": 200000,
                "max_output": 4096,
                "input_cost_per_1k": 0.003,  # $3 per MTok
                "output_cost_per_1k": 0.015,  # $15 per MTok
            },
            {
                "id": "claude-3-opus-20240229",
                "name": "Claude 3 Opus",
                "provider": "anthropic",
                "description": "Most capable for complex tasks",
                "context_window": 200000,
                "max_output": 4096,
                "input_cost_per_1k": 0.015,  # $15 per MTok
                "output_cost_per_1k": 0.075,  # $75 per MTok
            },
            {
                "id": "claude-3-5-sonnet-20241022",
                "name": "Claude 3.5 Sonnet",
                "provider": "anthropic",
                "description": "Latest model with improved reasoning",
                "context_window": 200000,
                "max_output": 8192,
                "input_cost_per_1k": 0.003,  # $3 per MTok
                "output_cost_per_1k": 0.015,  # $15 per MTok
            },
            {
                "id": "claude-3-5-haiku-20241022",
                "name": "Claude 3.5 Haiku",
                "provider": "anthropic",
                "description": "Faster and more affordable than 3.0",
                "context_window": 200000,
                "max_output": 8192,
                "input_cost_per_1k": 0.0008,  # $0.80 per MTok
                "output_cost_per_1k": 0.004,  # $4 per MTok
            },
            {
                "id": "claude-sonnet-4-5-20250514",
                "name": "Claude Sonnet 4.5",
                "provider": "anthropic",
                "description": "Advanced reasoning and performance (2025)",
                "context_window": 200000,
                "max_output": 8192,
                "input_cost_per_1k": 0.003,  # $3 per MTok
                "output_cost_per_1k": 0.015,  # $15 per MTok
            },
            {
                "id": "claude-opus-4-5-20251101",
                "name": "Claude Opus 4.5",
                "provider": "anthropic",
                "description": "Most capable Claude model (2025)",
                "context_window": 200000,
                "max_output": 8192,
                "input_cost_per_1k": 0.005,  # $5 per MTok
                "output_cost_per_1k": 0.025,  # $25 per MTok
            },
            {
                "id": "claude-haiku-4-5-20250514",
                "name": "Claude Haiku 4.5",
                "provider": "anthropic",
                "description": "Fast and affordable (2025)",
                "context_window": 200000,
                "max_output": 8192,
                "input_cost_per_1k": 0.001,  # $1 per MTok
                "output_cost_per_1k": 0.005,  # $5 per MTok
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
    return get_zygotrix_admin_service().get_overall_stats()



@router.get("/admin/users")
async def get_admin_user_stats(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin: UserProfile = Depends(get_current_admin)
):
    """Get per-user Zygotrix AI statistics (admin only)."""
    return get_zygotrix_admin_service().get_user_stats(page, page_size)



@router.get("/admin/conversations")
async def get_admin_conversations(
    user_id: Optional[str] = None,
    status: Optional[ConversationStatus] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin: UserProfile = Depends(get_current_admin)
):
    """List all conversations (admin only)."""
    status_value = status.value if status else None
    return get_zygotrix_admin_service().get_conversations(user_id, status_value, page, page_size)



@router.delete("/admin/conversations/{conversation_id}")
async def admin_delete_conversation(
    conversation_id: str,
    permanent: bool = Query(default=False),
    admin: UserProfile = Depends(get_current_admin)
):
    """Delete any conversation (admin only)."""
    try:
        return get_zygotrix_admin_service().delete_conversation(conversation_id, permanent)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))



@router.get("/admin/feedback")
async def get_admin_feedback(
    feedback_type: Optional[FeedbackType] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    admin: UserProfile = Depends(get_current_admin)
):
    """Get all message feedback (admin only)."""
    fb_type = feedback_type.value if feedback_type else None
    return get_zygotrix_admin_service().get_feedback(fb_type, page, page_size)

