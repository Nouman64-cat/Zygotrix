from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError
import jinja2
from pathlib import Path
import resend
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from app.config import get_settings
from .common import get_mongo_client

logger = logging.getLogger(__name__)

# Setup Jinja2 for email templates
template_dir = Path(__file__).parent.parent / "templates" / "emails"
jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(template_dir), autoescape=True
)



def get_all_recipients() -> dict:
    """
    Get all potential email recipients (newsletter subscribers + system users).

    Returns:
        dict: Dictionary with newsletter_subscribers and system_users lists
    """
    from .auth import get_users_collection

    # Get newsletter subscribers
    newsletter_collection = get_newsletter_collection(required=True)
    newsletter_subs = list(newsletter_collection.find({"is_active": True}))
    newsletter_emails = set()

    newsletter_subscribers = []
    for sub in newsletter_subs:
        email = sub["email"]
        newsletter_emails.add(email)
        newsletter_subscribers.append({
            "_id": str(sub["_id"]),
            "email": email,
            "subscribed_at": sub.get("subscribed_at"),
            "source": sub.get("source", "newsletter"),
            "type": "newsletter_subscriber"
        })

    # Get system users
    users_collection = get_users_collection(required=True)
    users = list(users_collection.find({"is_active": {"$ne": False}}))

    system_users = []
    for user in users:
        email = user.get("email")
        if email and email not in newsletter_emails:
            system_users.append({
                "_id": str(user["_id"]),
                "email": email,
                "full_name": user.get("full_name"),
                "user_role": user.get("user_role", "user"),
                "created_at": user.get("created_at"),
                "type": "system_user"
            })

    return {
        "newsletter_subscribers": newsletter_subscribers,
        "system_users": system_users
    }



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

    if not settings.aws_ses_username or not settings.aws_ses_password:
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Please set AWS_SES_USERNAME and AWS_SES_PASSWORD."
        )
    # Validate template type
    valid_templates = ["changelog", "release", "news", "update", "marketing"]
    if template_type not in valid_templates:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid template type. Must be one of: {', '.join(valid_templates)}"
        )

    # Load template
    template_name = f"newsletter_{template_type}.html"
    try:
        template = jinja_env.get_template(template_name)
    except jinja2.TemplateNotFound:
        raise HTTPException(
            status_code=500,
            detail=f"Email template '{template_name}' not found."
        )

    # Send emails with personalized unsubscribe URLs
    success_count = 0
    failed_emails = []

    smtp_host = f"email-smtp.{settings.aws_ses_region}.amazonaws.com"
    smtp_port = settings.aws_smtp_port

    for email in recipient_emails:
        try:
            # Prepare personalized template context for each recipient
            from urllib.parse import quote
            context = {
                "subject": subject,
                "content": content,
                "current_year": datetime.now().year,
                "unsubscribe_url": f"{settings.backend_url}/api/newsletter/unsubscribe/{quote(email)}",
            }

            # Render template with personalized unsubscribe link
            html_body = template.render(context)
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = settings.aws_ses_from_email
            msg['To'] = email

            # Attach HTML body
            html_part = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(html_part)

            # Send email using appropriate method based on port
            import ssl
            ssl_context = ssl.create_default_context()
            
            if smtp_port in (587, 2587):
                # Use STARTTLS for port 587/2587
                with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
                    server.starttls(context=ssl_context)
                    server.login(settings.aws_ses_username, settings.aws_ses_password)
                    server.send_message(msg)
            else:
                # Use SMTP_SSL for port 465 (SSL from start)
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ssl_context, timeout=30) as server:
                    server.login(settings.aws_ses_username, settings.aws_ses_password)
                    server.send_message(msg)
            success_count += 1
        except smtplib.SMTPException as e:
            failed_emails.append({"email": email, "error": str(e)})
        except Exception as e:
            failed_emails.append({"email": email, "error": str(e)})

    return {
        "total": len(recipient_emails),
        "success": success_count,
        "failed": len(failed_emails),
        "failed_emails": failed_emails,
    }


def get_custom_templates_collection(required: bool = False):
    """Get the custom email templates MongoDB collection."""
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=500, detail="Database connection not available")
        return None
    db = client.get_database("zygotrix")
    return db.get_collection("custom_email_templates")


async def generate_email_template_with_ai(
    description: str,
    template_type: str = "custom",
    user_id: Optional[str] = None,
    user_name: Optional[str] = None
) -> dict:
    """
    Generate an email template using Claude AI based on user description.

    Args:
        description: Natural language description of desired email template
        template_type: Type/category of template (custom, marketing, announcement, etc.)
        user_id: ID of user generating the template (for token tracking)
        user_name: Name of user generating the template (for token tracking)

    Returns:
        dict: Generated template with HTML content and metadata
    """
    import httpx
    import os

    CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
    if not CLAUDE_API_KEY:
        raise HTTPException(status_code=500, detail="Claude API key not configured")

    system_prompt = """You are an expert email template designer. Generate beautiful, responsive HTML email templates based on user descriptions.

Requirements:
1. Use inline CSS styles (email clients don't support external CSS)
2. Use table-based layouts for maximum email client compatibility
3. Make it mobile-responsive using media queries
4. Include professional color schemes and gradients
5. Use proper email-safe fonts (Arial, Helvetica, Georgia, etc.)
6. Ensure good contrast and readability
7. Add proper padding, margins, and spacing
8. Include placeholder content that matches the description
9. Make it visually appealing with modern design trends
10. For logos/images: Use text-based headers with styled company names instead of image placeholders (they often don't load in email clients)
11. If images are essential, include HTML comments with instructions like <!-- Replace with your logo URL -->

Return ONLY the HTML code without any markdown formatting or explanation."""

    user_prompt = f"""Create an email template with the following characteristics:

{description}

Template Type: {template_type}

Generate a complete, production-ready HTML email template that I can use immediately."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": CLAUDE_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 4096,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": user_prompt}
                    ],
                },
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Claude API error: {response.text}"
                )

            result = response.json()
            html_content = result["content"][0]["text"]

            # Clean up any markdown code blocks if present
            html_content = html_content.replace("```html", "").replace("```", "").strip()

            # Extract token usage
            input_tokens = result["usage"]["input_tokens"]
            output_tokens = result["usage"]["output_tokens"]

            # Log token usage for analytics
            try:
                from .chatbot.token_analytics_service import TokenAnalyticsService
                analytics = TokenAnalyticsService()
                analytics.log_usage(
                    user_id=user_id,
                    user_name=user_name,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    cached=False,
                    message_preview=f"Email template: {description[:100]}",
                    model="claude-3-haiku-20240307",
                    cache_creation_input_tokens=0,
                    cache_read_input_tokens=0
                )
                logger.info(f"Logged AI template generation: {input_tokens + output_tokens} tokens for user {user_id or 'anonymous'}")
            except Exception as e:
                logger.warning(f"Failed to log token usage for AI template generation: {e}")

            return {
                "html": html_content,
                "description": description,
                "template_type": template_type,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "token_usage": {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                }
            }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Template generation timed out")
    except Exception as e:
        logger.error(f"Error generating email template: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate template: {str(e)}")


def save_custom_template(
    name: str,
    html: str,
    description: str,
    template_type: str,
    created_by: str,
    thumbnail_url: Optional[str] = None
) -> dict:
    """
    Save a custom email template to the database.

    Args:
        name: Template name
        html: HTML content of the template
        description: Template description
        template_type: Type/category of template
        created_by: User ID who created the template
        thumbnail_url: Optional thumbnail image URL

    Returns:
        dict: Saved template document
    """
    collection = get_custom_templates_collection(required=True)

    template_doc = {
        "name": name,
        "html": html,
        "description": description,
        "template_type": template_type,
        "created_by": created_by,
        "thumbnail_url": thumbnail_url,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "is_active": True,
        "usage_count": 0,
    }

    result = collection.insert_one(template_doc)
    template_doc["_id"] = str(result.inserted_id)

    return template_doc


def get_custom_templates(created_by: Optional[str] = None, template_type: Optional[str] = None) -> List[dict]:
    """
    Get custom email templates from the database.

    Args:
        created_by: Optional filter by creator user ID
        template_type: Optional filter by template type

    Returns:
        List of template documents
    """
    collection = get_custom_templates_collection(required=True)

    query = {"is_active": True}
    if created_by:
        query["created_by"] = created_by
    if template_type:
        query["template_type"] = template_type

    templates = list(collection.find(query).sort("created_at", -1))

    for template in templates:
        template["_id"] = str(template["_id"])

    return templates


def delete_custom_template(template_id: str, user_id: str) -> bool:
    """
    Delete (soft delete) a custom email template.

    Args:
        template_id: Template ID to delete
        user_id: User ID requesting deletion (must be creator or admin)

    Returns:
        bool: True if deleted successfully
    """
    from bson import ObjectId

    collection = get_custom_templates_collection(required=True)

    # Check if template exists and user has permission
    template = collection.find_one({"_id": ObjectId(template_id)})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template["created_by"] != user_id:
        # Check if user is admin (you can implement admin check here)
        raise HTTPException(status_code=403, detail="Not authorized to delete this template")

    # Soft delete
    collection.update_one(
        {"_id": ObjectId(template_id)},
        {"$set": {"is_active": False, "deleted_at": datetime.now(timezone.utc)}}
    )

    return True
