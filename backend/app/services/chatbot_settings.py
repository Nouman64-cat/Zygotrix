from datetime import datetime
from typing import Optional
from fastapi import HTTPException
from ..schema.chatbot_settings import ChatbotSettings, ChatbotSettingsUpdate


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
    admin_user_id: str
) -> ChatbotSettings:
    """
    Update chatbot settings with provided values.
    Only updates fields that are not None.

    Args:
        updates: ChatbotSettingsUpdate with new values
        admin_user_id: ID of admin user making the update

    Returns:
        Updated ChatbotSettings

    Raises:
        HTTPException if update fails
    """
    collection = get_chatbot_settings_collection(required=True)

    # Get current settings
    current_settings = get_chatbot_settings()

    # Build update dict with only non-None fields
    update_dict = {}
    for field, value in updates.model_dump(exclude_none=True).items():
        update_dict[field] = value

    # Add metadata
    update_dict["updated_at"] = datetime.utcnow().isoformat()
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

    # Return updated settings
    return get_chatbot_settings()


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
