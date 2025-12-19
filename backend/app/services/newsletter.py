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

from app.config import get_settings
from .common import get_mongo_client

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
