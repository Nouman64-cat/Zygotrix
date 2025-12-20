"""Admin routes for user management."""
from typing import Optional, List
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from ..dependencies import get_current_admin, get_current_super_admin
from ..schema.auth import (
    UserProfile,
    AdminUserListItem,
    AdminUserListResponse,
    AdminUserActionRequest,
    AdminUserActionResponse,
    AdminUpdateUserRoleRequest,
    UserRole,
    MessageResponse,
)
from ..schema.chatbot_settings import (
    ChatbotSettings,
    ChatbotSettingsUpdate,
    ChatbotSettingsResponse,
    ChatbotSettingsHistoryResponse,
)
from ..models.prompt_template import (
    PromptTemplateUpdate,
    PromptTemplateResponse,
)
from ..services import admin as admin_services
from ..services import chatbot_settings as chatbot_settings_service
from ..services import prompt_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100,
                           description="Items per page"),
    search: Optional[str] = Query(
        default=None, description="Search by email or name"),
    role: Optional[str] = Query(default=None, description="Filter by role"),
    status: Optional[str] = Query(
        default=None, description="Filter by status (active/inactive)"),
    current_admin: UserProfile = Depends(get_current_admin),
) -> AdminUserListResponse:
    """Get list of all users with pagination and filtering."""
    users, total = admin_services.get_all_users(
        page=page,
        page_size=page_size,
        search=search,
        role_filter=role,
        status_filter=status,
    )

    user_items = [
        AdminUserListItem(
            id=u["id"],
            email=u["email"],
            full_name=u.get("full_name"),
            user_role=u.get("user_role", "user"),
            is_active=u.get("is_active", True),
            created_at=u["created_at"],
            organization=u.get("organization"),
            onboarding_completed=u.get("onboarding_completed", False),
            university_onboarding_completed=u.get(
                "university_onboarding_completed", False),
            deactivated_at=u.get("deactivated_at"),
            # Activity tracking fields
            last_accessed_at=u.get("last_accessed_at"),
            last_ip_address=u.get("last_ip_address"),
            last_location=u.get("last_location"),
            last_browser=u.get("last_browser"),
            login_history=u.get("login_history"),
        )
        for u in users
    ]

    total_pages = ceil(total / page_size) if total > 0 else 1

    return AdminUserListResponse(
        users=user_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/users/{user_id}", response_model=UserProfile)
def get_user(
    user_id: str,
    current_admin: UserProfile = Depends(get_current_admin),
) -> UserProfile:
    """Get detailed information about a specific user."""
    user = admin_services.get_user_by_id_admin(user_id)
    return UserProfile(**user)


@router.post("/users/{user_id}/deactivate", response_model=AdminUserActionResponse)
def deactivate_user(
    user_id: str,
    reason: Optional[str] = Query(
        default=None, description="Reason for deactivation"),
    current_admin: UserProfile = Depends(get_current_admin),
) -> AdminUserActionResponse:
    """Deactivate a user account."""
    user = admin_services.deactivate_user(
        user_id=user_id,
        admin_id=current_admin.id,
        reason=reason,
    )
    return AdminUserActionResponse(
        message="User account has been deactivated.",
        user=UserProfile(**user),
    )


@router.post("/users/{user_id}/reactivate", response_model=AdminUserActionResponse)
def reactivate_user(
    user_id: str,
    current_admin: UserProfile = Depends(get_current_admin),
) -> AdminUserActionResponse:
    """Reactivate a deactivated user account."""
    user = admin_services.reactivate_user(
        user_id=user_id,
        admin_id=current_admin.id,
    )
    return AdminUserActionResponse(
        message="User account has been reactivated.",
        user=UserProfile(**user),
    )


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: str,
    current_admin: UserProfile = Depends(get_current_super_admin),
) -> MessageResponse:
    """Permanently delete a user account. Requires super admin privileges."""
    admin_services.delete_user(
        user_id=user_id,
        admin_id=current_admin.id,
    )
    return MessageResponse(message="User account has been permanently deleted.")


@router.patch("/users/{user_id}/role", response_model=AdminUserActionResponse)
def update_user_role(
    user_id: str,
    new_role: UserRole = Query(..., description="New role for the user"),
    current_admin: UserProfile = Depends(get_current_super_admin),
) -> AdminUserActionResponse:
    """Update a user's role. Requires super admin privileges."""
    user = admin_services.update_user_role(
        user_id=user_id,
        new_role=new_role.value,
        admin_id=current_admin.id,
    )
    return AdminUserActionResponse(
        message=f"User role has been updated to {new_role.value}.",
        user=UserProfile(**user),
    )


@router.get("/stats")
def get_user_stats(
    current_admin: UserProfile = Depends(get_current_admin),
):
    """Get statistics about users."""
    return admin_services.get_user_stats()


# Chatbot Settings Endpoints
@router.get("/chatbot/settings", response_model=ChatbotSettings)
def get_chatbot_settings(
    current_admin: UserProfile = Depends(get_current_admin),
) -> ChatbotSettings:
    """
    Get current chatbot configuration settings.
    Returns default settings if none exist in database.
    """
    return chatbot_settings_service.get_chatbot_settings()


@router.put("/chatbot/settings", response_model=ChatbotSettingsResponse)
def update_chatbot_settings(
    settings_update: ChatbotSettingsUpdate,
    request: Request,
    current_admin: UserProfile = Depends(get_current_admin),
) -> ChatbotSettingsResponse:
    """
    Update chatbot configuration settings.
    Only provided fields will be updated.
    Logs changes to audit history.
    """
    # Extract IP address and user agent for audit trail
    ip_address = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                 request.headers.get("X-Real-IP", "").strip() or \
                 (request.client.host if request.client else "Unknown")
    user_agent = request.headers.get("User-Agent")

    updated_settings = chatbot_settings_service.update_chatbot_settings(
        updates=settings_update,
        admin_user_id=current_admin.id,
        admin_user_name=current_admin.name if hasattr(current_admin, 'name') else None,
        admin_user_email=current_admin.email,
        ip_address=ip_address,
        user_agent=user_agent
    )

    return ChatbotSettingsResponse(
        message="Chatbot settings updated successfully",
        settings=updated_settings
    )


@router.get("/chatbot/settings/history", response_model=ChatbotSettingsHistoryResponse)
def get_chatbot_settings_history(
    limit: int = Query(default=50, ge=1, le=200, description="Maximum number of history entries"),
    skip: int = Query(default=0, ge=0, description="Number of entries to skip"),
    current_admin: UserProfile = Depends(get_current_super_admin),
) -> ChatbotSettingsHistoryResponse:
    """
    Get chatbot settings change history.
    **SUPER ADMIN ONLY** - View audit trail of all chatbot settings changes.

    Returns detailed history including:
    - Who made the change (admin name, email, ID)
    - When the change was made (timestamp)
    - What was changed (field name, old value, new value)
    - Where the change came from (IP address, user agent)
    """
    return chatbot_settings_service.get_chatbot_settings_history(
        limit=limit,
        skip=skip
    )


# Prompt Template Management Endpoints
@router.get("/prompts", response_model=List[PromptTemplateResponse])
def get_all_prompts(
    current_admin: UserProfile = Depends(get_current_admin),
) -> List[PromptTemplateResponse]:
    """
    Get all prompt templates.
    Requires admin privileges.
    """
    return prompt_service.get_all_prompts()


# NOTE: This route must come BEFORE /prompts/{prompt_type} to avoid 'history' being matched as a prompt_type
@router.get("/prompts/history")
def get_prompt_history(
    prompt_type: Optional[str] = Query(default=None, description="Filter by prompt type"),
    limit: int = Query(default=50, ge=1, le=200, description="Maximum number of history entries"),
    skip: int = Query(default=0, ge=0, description="Number of entries to skip"),
    current_admin: UserProfile = Depends(get_current_super_admin),
):
    """
    Get prompt template change history.
    **SUPER ADMIN ONLY** - View audit trail of all prompt changes.

    Returns detailed history including:
    - Who made the change (admin name, email, ID)
    - When the change was made (timestamp)
    - What was changed (field name, old value, new value)
    - What action was taken (update, reset)
    - Where the change came from (IP address, user agent)
    """
    return prompt_service.get_prompt_history(
        prompt_type=prompt_type,
        limit=limit,
        skip=skip
    )


@router.get("/prompts/{prompt_type}", response_model=PromptTemplateResponse)
def get_prompt(
    prompt_type: str,
    current_admin: UserProfile = Depends(get_current_admin),
) -> PromptTemplateResponse:
    """
    Get a specific prompt template by type.
    Requires admin privileges.
    """
    prompt = prompt_service.get_prompt_by_type(prompt_type)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt template not found")
    return prompt


@router.put("/prompts/{prompt_type}", response_model=PromptTemplateResponse)
def update_prompt(
    prompt_type: str,
    prompt_update: PromptTemplateUpdate,
    request: Request,
    current_admin: UserProfile = Depends(get_current_admin),
) -> PromptTemplateResponse:
    """
    Update a prompt template.
    Requires admin privileges.
    Logs changes to audit history.
    """
    # Extract IP address and user agent for audit trail
    ip_address = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                 request.headers.get("X-Real-IP", "").strip() or \
                 (request.client.host if request.client else "Unknown")
    user_agent = request.headers.get("User-Agent")

    updated_prompt = prompt_service.update_prompt(
        prompt_type=prompt_type,
        prompt_update=prompt_update,
        admin_user_id=current_admin.id,
        admin_user_name=current_admin.full_name if hasattr(current_admin, 'full_name') else None,
        admin_user_email=current_admin.email,
        ip_address=ip_address,
        user_agent=user_agent
    )
    if not updated_prompt:
        raise HTTPException(status_code=404, detail="Prompt template not found")
    return updated_prompt


@router.post("/prompts/{prompt_type}/reset", response_model=MessageResponse)
def reset_prompt_to_default(
    prompt_type: str,
    request: Request,
    current_admin: UserProfile = Depends(get_current_admin),
) -> MessageResponse:
    """
    Reset a prompt template to its default value.
    Requires admin privileges.
    Logs changes to audit history.
    """
    # Extract IP address and user agent for audit trail
    ip_address = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                 request.headers.get("X-Real-IP", "").strip() or \
                 (request.client.host if request.client else "Unknown")
    user_agent = request.headers.get("User-Agent")

    success = prompt_service.reset_to_default(
        prompt_type=prompt_type,
        admin_user_id=current_admin.id,
        admin_user_name=current_admin.full_name if hasattr(current_admin, 'full_name') else None,
        admin_user_email=current_admin.email,
        ip_address=ip_address,
        user_agent=user_agent
    )
    if not success:
        raise HTTPException(status_code=404, detail="Prompt template not found")
    return MessageResponse(message=f"Prompt template '{prompt_type}' reset to default successfully")


