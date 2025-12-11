from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError
import jinja2
from pathlib import Path
import resend

from app.config import get_settings
from .common import get_mongo_client

# Setup Jinja2 for email templates
template_dir = Path(__file__).parent.parent / "templates" / "emails"
jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(template_dir), autoescape=True
)


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


def send_newsletter_email(
    recipient_emails: List[str],
    template_type: str,
    subject: str,
    content: str
) -> dict:
    """
    Send newsletter email to selected recipients.

    Args:
        recipient_emails: List of email addresses to send to
        template_type: Type of email template (changelog, release, news, update)
        subject: Email subject line
        content: Email content (can include HTML)

    Returns:
        dict: Result with success and failure counts
    """
    settings = get_settings()

    if not settings.resend_api_key:
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Please set RESEND_API_KEY."
        )

    # Initialize Resend
    resend.api_key = settings.resend_api_key

    # Validate template type
    valid_templates = ["changelog", "release", "news", "update"]
    if template_type not in valid_templates:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid template type. Must be one of: {', '.join(valid_templates)}"
        )

    # Load and render template
    template_name = f"newsletter_{template_type}.html"
    try:
        template = jinja_env.get_template(template_name)
    except jinja2.TemplateNotFound:
        raise HTTPException(
            status_code=500,
            detail=f"Email template '{template_name}' not found."
        )

    # Prepare template context
    context = {
        "subject": subject,
        "content": content,
        "current_year": datetime.now().year,
        "unsubscribe_url": f"{settings.university_url}/newsletter/unsubscribe",
    }

    html_body = template.render(context)

    # Send emails
    success_count = 0
    failed_emails = []

    for email in recipient_emails:
        try:
            params = {
                "from": settings.resend_from_email,
                "to": [email],
                "subject": subject,
                "html": html_body,
            }
            resend.Emails.send(params)
            success_count += 1
        except Exception as e:
            failed_emails.append({"email": email, "error": str(e)})

    return {
        "total": len(recipient_emails),
        "success": success_count,
        "failed": len(failed_emails),
        "failed_emails": failed_emails,
    }
