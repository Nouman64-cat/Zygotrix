from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException
from bson import ObjectId

from app.config import get_settings
from .common import get_mongo_client
from . import newsletter as newsletter_service


def get_contact_submissions_collection(required: bool = False):
    """Get the contact form submissions collection."""
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["contact_submissions"]

    # Create index on submitted_at for sorting
    try:
        collection.create_index([("submitted_at", -1)])
    except Exception:
        pass

    return collection


def submit_contact_form(
    name: Optional[str],
    email: str,
    phone: Optional[str],
    message: str
) -> dict:
    """
    Submit a contact form and automatically subscribe email to newsletter.

    Args:
        name: Contact name (optional)
        email: Contact email address
        phone: Contact phone number (optional)
        message: Contact message

    Returns:
        dict: Submission data with id and timestamp
    """
    collection = get_contact_submissions_collection(required=True)

    now = datetime.now(timezone.utc)

    submission_doc = {
        "name": name,
        "email": email.lower().strip(),
        "phone": phone,
        "message": message,
        "submitted_at": now,
        "is_read": False,
    }

    try:
        result = collection.insert_one(submission_doc)
        submission_doc["_id"] = result.inserted_id

        # Automatically subscribe email to newsletter
        try:
            newsletter_service.subscribe_to_newsletter(email=email)
        except HTTPException as e:
            # If already subscribed, that's fine - continue
            if e.status_code != 409:
                # Log other errors but don't fail the contact form submission
                print(f"Failed to subscribe {email} to newsletter: {e.detail}")
        except Exception as e:
            # Log but don't fail contact form submission
            print(f"Unexpected error subscribing {email} to newsletter: {str(e)}")

        return {
            "id": str(result.inserted_id),
            "name": name,
            "email": email,
            "phone": phone,
            "message": message,
            "submitted_at": now,
            "is_read": False,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit contact form: {str(e)}"
        )


def get_all_submissions() -> List[dict]:
    """
    Get all contact form submissions (super admin only).

    Returns:
        list: All contact form submissions, newest first
    """
    collection = get_contact_submissions_collection(required=True)
    submissions = list(collection.find().sort("submitted_at", -1))

    # Convert ObjectId to string
    for sub in submissions:
        sub["id"] = str(sub["_id"])
        del sub["_id"]

    return submissions


def mark_as_read(submission_id: str) -> bool:
    """
    Mark a contact form submission as read.

    Args:
        submission_id: The ID of the submission

    Returns:
        bool: True if marked as read successfully
    """
    collection = get_contact_submissions_collection(required=True)

    try:
        result = collection.update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": {"is_read": True}}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Contact submission not found."
            )

        return True
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark submission as read: {str(e)}"
        )


def delete_submission(submission_id: str) -> bool:
    """
    Delete a contact form submission.

    Args:
        submission_id: The ID of the submission to delete

    Returns:
        bool: True if deleted successfully
    """
    collection = get_contact_submissions_collection(required=True)

    try:
        result = collection.delete_one({"_id": ObjectId(submission_id)})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Contact submission not found."
            )

        return True
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete submission: {str(e)}"
        )
