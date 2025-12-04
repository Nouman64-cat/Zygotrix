"""Admin routes for user management."""
from typing import Optional
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query

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
from ..services import admin as admin_services

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

    # Debug: check what last_accessed_at looks like
    for u in users:
        print(
            f"[DEBUG ADMIN] {u.get('email')}: last_accessed_at = {u.get('last_accessed_at')} (type: {type(u.get('last_accessed_at'))})")

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
