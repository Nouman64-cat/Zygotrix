from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException
from ..schema.chatbot_settings import (
    ChatbotSettings,
    ChatbotSettingsUpdate,
    ChatbotSettingsHistory,
    SettingChange,
    ChatbotSettingsHistoryResponse
)


SETTINGS_DOCUMENT_ID = "global_chatbot_settings"


def get_chatbot_settings_collection(required: bool = False):
    """Get chatbot_settings collection from MongoDB."""
    from .common import get_mongo_client, get_settings

    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503,
                detail="MongoDB client not available"
            )
        return None

    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["chatbot_settings"]

    # Create index on id field
    try:
        collection.create_index("id", unique=True, sparse=True)
    except Exception:
        pass  # Index may already exist

    return collection


def get_chatbot_settings_history_collection(required: bool = False):
    """Get chatbot_settings_history collection from MongoDB."""
    from .common import get_mongo_client, get_settings

    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(
                status_code=503,
                detail="MongoDB client not available"
            )
        return None

    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["chatbot_settings_history"]

    # Create indexes
    try:
        collection.create_index("timestamp", background=True)
        collection.create_index("updated_by", background=True)
    except Exception:
        pass  # Indexes may already exist

    return collection


def get_default_settings() -> ChatbotSettings:
    """Return default chatbot settings."""
    return ChatbotSettings(
        id=SETTINGS_DOCUMENT_ID,
        token_limit_per_session=25000,
        max_tokens=1024,
        temperature=0.7,
        reset_limit_hours=5,
        model="claude-3-haiku-20240307",
        enabled=True,
        response_caching=True,
        admin_unlimited_tokens=False,
        new_user_registration_email_enabled=True,
        created_at=datetime.utcnow().isoformat(),
        updated_at=datetime.utcnow().isoformat(),
        updated_by=None
    )


def get_chatbot_settings() -> ChatbotSettings:
    """
    Retrieve chatbot settings from database.
    If not found, return and save default settings.
    """
    collection = get_chatbot_settings_collection(required=True)

    # Try to find existing settings
    doc = collection.find_one({"id": SETTINGS_DOCUMENT_ID})

    if doc:
        # Remove MongoDB _id field
        doc.pop("_id", None)
        return ChatbotSettings(**doc)

    # No settings found, create default
    default_settings = get_default_settings()
    settings_dict = default_settings.model_dump()

    try:
        collection.insert_one(settings_dict)
    except Exception as e:
        # If insert fails, still return defaults
        print(f"Failed to save default chatbot settings: {e}")

    return default_settings


def update_chatbot_settings(
    updates: ChatbotSettingsUpdate,
    admin_user_id: str,
    admin_user_name: Optional[str] = None,
    admin_user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> ChatbotSettings:
    """
    Update chatbot settings with provided values.
    Only updates fields that are not None.

    Args:
        updates: ChatbotSettingsUpdate with new values
        admin_user_id: ID of admin user making the update
        admin_user_name: Name of admin user
        admin_user_email: Email of admin user
        ip_address: IP address of request
        user_agent: User agent of request

    Returns:
        Updated ChatbotSettings

    Raises:
        HTTPException if update fails
    """
    collection = get_chatbot_settings_collection(required=True)

    # Get current settings
    current_settings = get_chatbot_settings()

    # Build update dict with only non-None fields and track changes
    update_dict = {}
    changes = []

    for field, value in updates.model_dump(exclude_none=True).items():
        # Get the old value from current settings
        old_value = getattr(current_settings, field, None)

        # Only add to update if value actually changed
        if old_value != value:
            update_dict[field] = value
            changes.append(SettingChange(
                field_name=field,
                old_value=old_value,
                new_value=value
            ))

    # Only proceed if there are actual changes
    if not changes:
        return current_settings

    # Add metadata
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_dict["updated_by"] = admin_user_id

    # Perform update
    try:
        result = collection.update_one(
            {"id": SETTINGS_DOCUMENT_ID},
            {"$set": update_dict},
            upsert=True
        )

        if result.modified_count == 0 and result.upserted_id is None:
            # Document exists but no changes made
            pass

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update chatbot settings: {str(e)}"
        )

    # Log changes to history
    _log_settings_change(
        admin_user_id=admin_user_id,
        admin_user_name=admin_user_name,
        admin_user_email=admin_user_email,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent
    )

    # Return updated settings
    return get_chatbot_settings()


def _log_settings_change(
    admin_user_id: str,
    admin_user_name: Optional[str],
    admin_user_email: Optional[str],
    changes: list[SettingChange],
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log chatbot settings changes to history collection."""
    try:
        history_collection = get_chatbot_settings_history_collection(required=False)
        if history_collection is None:
            return  # Can't log if MongoDB not available

        history_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "updated_by": admin_user_id,
            "updated_by_name": admin_user_name,
            "updated_by_email": admin_user_email,
            "changes": [change.model_dump() for change in changes],
            "ip_address": ip_address,
            "user_agent": user_agent
        }

        history_collection.insert_one(history_entry)
    except Exception as e:
        # Don't fail the main operation if logging fails
        print(f"Failed to log settings change: {e}")


def get_chatbot_settings_history(
    limit: int = 50,
    skip: int = 0
) -> ChatbotSettingsHistoryResponse:
    """
    Get chatbot settings change history.

    Args:
        limit: Maximum number of history entries to return
        skip: Number of entries to skip (for pagination)

    Returns:
        ChatbotSettingsHistoryResponse with history entries
    """
    history_collection = get_chatbot_settings_history_collection(required=False)

    if history_collection is None:
        return ChatbotSettingsHistoryResponse(history=[], total_count=0)

    try:
        # Get total count
        total_count = history_collection.count_documents({})

        # Get history entries, sorted by timestamp descending
        cursor = history_collection.find().sort("timestamp", -1).skip(skip).limit(limit)

        history_entries = []
        for doc in cursor:
            # Remove MongoDB _id field
            doc.pop("_id", None)

            history_entries.append(ChatbotSettingsHistory(**doc))

        return ChatbotSettingsHistoryResponse(
            history=history_entries,
            total_count=total_count
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chatbot settings history: {str(e)}"
        )


def delete_chatbot_settings() -> bool:
    """
    Delete chatbot settings (mainly for testing).
    Settings will be recreated with defaults on next get.

    Returns:
        True if deleted, False if not found
    """
    collection = get_chatbot_settings_collection(required=True)

    result = collection.delete_one({"id": SETTINGS_DOCUMENT_ID})
    return result.deleted_count > 0
