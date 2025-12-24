"""
Zygotrix AI API Routes
=======================
Professional chatbot API with streaming, conversation management,
folders, sharing, export, and search capabilities.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Request

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
from ..services import auth as auth_services

from ..services.chatbot.rate_limiting_service import get_rate_limiter
from ..services.zygotrix_ai.admin_service import get_zygotrix_admin_service
from ..services.zygotrix_ai.chat_service import get_zygotrix_chat_service
from ..services.zygotrix_ai.status_service import get_zygotrix_status_service

from ..mcp.claude_tools import get_claude_tools_schema

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

    # Delegate to chat service
    response, conversation_id, message_id = await get_zygotrix_chat_service().process_chat_request(
        chat_request, current_user
    )
    return response


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
    return await get_zygotrix_chat_service().regenerate_message_response(
        conversation_id, message_id, current_user
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
    return get_zygotrix_status_service().get_status()


@router.get("/models")
async def get_available_models():
    """Get list of available AI models with accurate 2025 pricing."""
    return get_zygotrix_status_service().get_available_models()


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

