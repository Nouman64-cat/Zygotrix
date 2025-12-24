"""
Admin Serializers.

Utilities for transforming database documents to admin API response models.
"""
from typing import Dict, Any, List

from ...schema.auth import AdminUserListItem


def serialize_admin_user_list_item(user_doc: Dict[str, Any]) -> AdminUserListItem:
    """
    Serialize a user document to AdminUserListItem.

    Args:
        user_doc: User document from database (already serialized with _serialize_user)

    Returns:
        AdminUserListItem model
    """
    return AdminUserListItem(
        id=user_doc["id"],
        email=user_doc["email"],
        full_name=user_doc.get("full_name"),
        user_role=user_doc.get("user_role", "user"),
        is_active=user_doc.get("is_active", True),
        created_at=user_doc["created_at"],
        organization=user_doc.get("organization"),
        onboarding_completed=user_doc.get("onboarding_completed", False),
        university_onboarding_completed=user_doc.get(
            "university_onboarding_completed", False
        ),
        deactivated_at=user_doc.get("deactivated_at"),
        # Activity tracking fields
        last_accessed_at=user_doc.get("last_accessed_at"),
        last_ip_address=user_doc.get("last_ip_address"),
        last_location=user_doc.get("last_location"),
        last_browser=user_doc.get("last_browser"),
        login_history=user_doc.get("login_history"),
    )


def serialize_admin_user_list(users: List[Dict[str, Any]]) -> List[AdminUserListItem]:
    """
    Serialize a list of user documents to AdminUserListItem models.

    Args:
        users: List of user documents from database

    Returns:
        List of AdminUserListItem models
    """
    return [serialize_admin_user_list_item(user) for user in users]
