from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError

from app.config import get_settings
from .common import get_mongo_client


def get_newsletter_collection(required: bool = False):
    """Get the newsletter subscriptions collection."""
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["newsletter_subscriptions"]

    # Create unique index on email
    try:
        collection.create_index("email", unique=True)
    except Exception:
        pass

    return collection


def subscribe_to_newsletter(email: str) -> dict:
    """
    Subscribe an email to the newsletter.

    Args:
        email: The email address to subscribe

    Returns:
        dict: Subscription data including email and timestamp

    Raises:
        HTTPException: If email is already subscribed or database error occurs
    """
    collection = get_newsletter_collection(required=True)

    now = datetime.now(timezone.utc)

    subscription_doc = {
        "email": email.lower().strip(),
        "subscribed_at": now,
        "is_active": True,
        "source": "website_footer",
    }

    try:
        result = collection.insert_one(subscription_doc)
        subscription_doc["_id"] = str(result.inserted_id)
        return subscription_doc
    except DuplicateKeyError:
        # Check if the email exists and is active
        existing = collection.find_one({"email": email.lower().strip()})
        if existing and existing.get("is_active", True):
            raise HTTPException(
                status_code=409,
                detail="This email is already subscribed to our newsletter."
            )
        else:
            # Reactivate the subscription
            collection.update_one(
                {"email": email.lower().strip()},
                {"$set": {"is_active": True, "resubscribed_at": now}}
            )
            return collection.find_one({"email": email.lower().strip()})
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to subscribe to newsletter: {str(e)}"
        )


def get_all_subscriptions() -> list:
    """
    Get all newsletter subscriptions (admin only).

    Returns:
        list: All active newsletter subscriptions
    """
    collection = get_newsletter_collection(required=True)
    subscriptions = list(collection.find({"is_active": True}))

    # Convert ObjectId to string
    for sub in subscriptions:
        sub["_id"] = str(sub["_id"])

    return subscriptions


def unsubscribe_from_newsletter(email: str) -> bool:
    """
    Unsubscribe an email from the newsletter.

    Args:
        email: The email address to unsubscribe

    Returns:
        bool: True if unsubscribed successfully
    """
    collection = get_newsletter_collection(required=True)

    result = collection.update_one(
        {"email": email.lower().strip()},
        {"$set": {"is_active": False, "unsubscribed_at": datetime.now(timezone.utc)}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Email not found in newsletter subscriptions."
        )

    return True
