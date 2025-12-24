"""Admin service for user management."""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple, cast
from bson import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
from fastapi import HTTPException

from app.config import get_settings
from app.repositories.builders.mongo_query_builder import MongoQueryBuilder
from app.services.auth import (
    get_users_collection,
    _serialize_user,
    _normalize_email,
    clear_user_cache,
)


def get_all_users(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    role_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Get all users with pagination and optional filters.

    Args:
        page: Page number (1-indexed)
        page_size: Number of users per page
        search: Search term for email or name
        role_filter: Filter by user role (user, admin, super_admin)
        status_filter: Filter by status (active, inactive)

    Returns:
        Tuple of (list of users, total count)
    """
    collection = cast(Collection, get_users_collection(required=True))

    # Build query using MongoQueryBuilder
    builder = MongoQueryBuilder()

    # Add search filter
    if search:
        builder.with_or([
            {"email": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}},
        ])

    # Add role filter
    if role_filter:
        builder.with_field("user_role", role_filter)

    # Add status filter
    if status_filter:
        if status_filter == "active":
            builder.with_ne("is_active", False)
        elif status_filter == "inactive":
            builder.with_field("is_active", False)

    # Add sorting and pagination
    builder.sorted_by("created_at", descending=True).paginated(page, page_size)

    # Build the query components
    query_components = builder.build()
    query = query_components["filter"]
    sort = query_components.get("sort")
    skip = query_components.get("skip", 0)
    limit = query_components.get("limit")

    # Get total count
    total = collection.count_documents(query)

    # Get paginated results
    cursor = collection.find(query)
    if sort:
        cursor = cursor.sort(sort)
    if skip:
        cursor = cursor.skip(skip)
    if limit:
        cursor = cursor.limit(limit)

    users = [_serialize_user(doc) for doc in cursor]

    return users, total


def get_user_by_id_admin(user_id: str) -> Dict[str, Any]:
    """Get a user by ID for admin purposes."""
    collection = cast(Collection, get_users_collection(required=True))

    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail="Invalid user ID format."
        ) from exc

    user = collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return _serialize_user(user)


def deactivate_user(
    user_id: str,
    admin_id: str,
    reason: Optional[str] = None
) -> Dict[str, Any]:
    """
    Deactivate a user account.

    Args:
        user_id: ID of user to deactivate
        admin_id: ID of admin performing the action
        reason: Optional reason for deactivation

    Returns:
        Updated user data
    """
    collection = cast(Collection, get_users_collection(required=True))

    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail="Invalid user ID format."
        ) from exc

    # Check if user exists
    user = collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Prevent deactivating super admins
    if user.get("user_role") == "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Cannot deactivate a super admin account."
        )

    # Update user
    update_data = {
        "is_active": False,
        "deactivated_at": datetime.now(timezone.utc),
        "deactivated_by": admin_id,
    }
    if reason:
        update_data["deactivation_reason"] = reason

    try:
        collection.update_one({"_id": object_id}, {"$set": update_data})
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to deactivate user: {exc}"
        ) from exc

    # Clear cache
    clear_user_cache(user_id)

    return get_user_by_id_admin(user_id)


def reactivate_user(user_id: str, admin_id: str) -> Dict[str, Any]:
    """
    Reactivate a deactivated user account.

    Args:
        user_id: ID of user to reactivate
        admin_id: ID of admin performing the action

    Returns:
        Updated user data
    """
    collection = cast(Collection, get_users_collection(required=True))

    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail="Invalid user ID format."
        ) from exc

    # Check if user exists
    user = collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Update user
    update_data = {
        "is_active": True,
        "reactivated_at": datetime.now(timezone.utc),
        "reactivated_by": admin_id,
    }

    try:
        collection.update_one(
            {"_id": object_id},
            {
                "$set": update_data,
                "$unset": {
                    "deactivated_at": "",
                    "deactivated_by": "",
                    "deactivation_reason": "",
                }
            }
        )
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to reactivate user: {exc}"
        ) from exc

    # Clear cache
    clear_user_cache(user_id)

    return get_user_by_id_admin(user_id)


def delete_user(user_id: str, admin_id: str) -> bool:
    """
    Permanently delete a user account.

    Args:
        user_id: ID of user to delete
        admin_id: ID of admin performing the action

    Returns:
        True if deleted successfully
    """
    collection = cast(Collection, get_users_collection(required=True))

    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail="Invalid user ID format."
        ) from exc

    # Check if user exists
    user = collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Prevent deleting super admins
    if user.get("user_role") == "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Cannot delete a super admin account."
        )

    # Prevent self-deletion
    if str(user.get("_id")) == admin_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete your own account through admin panel."
        )

    try:
        result = collection.delete_one({"_id": object_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found.")
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete user: {exc}"
        ) from exc

    # Clear cache
    clear_user_cache(user_id)

    return True


def update_user_role(
    user_id: str,
    new_role: str,
    admin_id: str
) -> Dict[str, Any]:
    """
    Update a user's role.

    Args:
        user_id: ID of user to update
        new_role: New role (user, admin, super_admin)
        admin_id: ID of admin performing the action

    Returns:
        Updated user data
    """
    collection = cast(Collection, get_users_collection(required=True))

    valid_roles = ["user", "admin", "super_admin"]
    if new_role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )

    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail="Invalid user ID format."
        ) from exc

    # Check if user exists
    user = collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Prevent changing own role to non-super-admin (self-demotion protection)
    if str(user.get("_id")) == admin_id and new_role != "super_admin":
        # Allow if there's another super admin
        other_super_admins = collection.count_documents({
            "user_role": "super_admin",
            "_id": {"$ne": object_id}
        })
        if other_super_admins == 0:
            raise HTTPException(
                status_code=403,
                detail="Cannot demote the only super admin account."
            )

    try:
        collection.update_one(
            {"_id": object_id},
            {"$set": {"user_role": new_role}}
        )
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to update user role: {exc}"
        ) from exc

    # Clear cache
    clear_user_cache(user_id)

    return get_user_by_id_admin(user_id)


def get_user_stats() -> Dict[str, Any]:
    """Get statistics about users."""
    collection = cast(Collection, get_users_collection(required=True))

    total_users = collection.count_documents({})
    active_users = collection.count_documents({"is_active": {"$ne": False}})
    inactive_users = collection.count_documents({"is_active": False})

    # Count by role
    super_admins = collection.count_documents({"user_role": "super_admin"})
    admins = collection.count_documents({"user_role": "admin"})
    regular_users = collection.count_documents({
        "$or": [
            {"user_role": "user"},
            {"user_role": {"$exists": False}},
        ]
    })

    # Count by onboarding status
    onboarded_web = collection.count_documents({"onboarding_completed": True})
    onboarded_university = collection.count_documents(
        {"university_onboarding_completed": True})

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "by_role": {
            "super_admin": super_admins,
            "admin": admins,
            "user": regular_users,
        },
        "onboarding": {
            "web_completed": onboarded_web,
            "university_completed": onboarded_university,
        }
    }


def is_super_admin(user_id: str) -> bool:
    """Check if a user is a super admin."""
    collection = get_users_collection()
    if collection is None:
        return False

    try:
        object_id = ObjectId(user_id)
    except Exception:
        return False

    user = collection.find_one({"_id": object_id})
    if not user:
        return False

    return user.get("user_role") == "super_admin"


def is_admin_or_super_admin(user_id: str) -> bool:
    """Check if a user is an admin or super admin."""
    collection = get_users_collection()
    if collection is None:
        return False

    try:
        object_id = ObjectId(user_id)
    except Exception:
        return False

    user = collection.find_one({"_id": object_id})
    if not user:
        return False

    return user.get("user_role") in ["admin", "super_admin"]


def promote_to_super_admin(email: str) -> Optional[Dict[str, Any]]:
    """
    Promote an existing user to super admin by email.
    This is typically called during initialization if SUPER_ADMIN_EMAIL is set.

    Args:
        email: Email of user to promote

    Returns:
        Updated user data or None if user not found
    """
    collection = cast(Collection, get_users_collection(required=True))

    user = collection.find_one({"email": _normalize_email(email)})
    if not user:
        return None

    if user.get("user_role") == "super_admin":
        return _serialize_user(user)

    try:
        collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"user_role": "super_admin"}}
        )
    except PyMongoError:
        return None

    # Clear cache
    clear_user_cache(str(user["_id"]))

    user["user_role"] = "super_admin"
    return _serialize_user(user)
