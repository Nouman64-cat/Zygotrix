"""Notification service for sending WhatsApp messages via Twilio."""
from datetime import datetime, timezone
from typing import Optional
import logging

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from ..config import get_settings

logger = logging.getLogger(__name__)


def _get_twilio_client() -> Optional[Client]:
    """Get Twilio client if credentials are configured."""
    settings = get_settings()
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.warning("Twilio credentials not configured")
        return None
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def send_new_user_whatsapp_notification(
    email: str,
    full_name: Optional[str] = None,
) -> bool:
    """
    Send WhatsApp notification to admin when a new user registers.

    Args:
        email: The new user's email address
        full_name: The new user's full name (optional)

    Returns:
        True if message was sent successfully, False otherwise
    """
    settings = get_settings()

    # Check if WhatsApp notifications are configured
    if not settings.twilio_whatsapp_from or not settings.admin_whatsapp_to:
        logger.info("WhatsApp notification skipped: not configured")
        return False

    client = _get_twilio_client()
    if not client:
        return False

    # Format the notification message
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Build the message
    name_display = full_name if full_name else "Not provided"
    message_body = (
        f"🎉 *New Zygotrix User Registration*\n\n"
        f"👤 *Name:* {name_display}\n"
        f"📧 *Email:* {email}\n"
        f"🕐 *Registered:* {timestamp}\n\n"
        f"_A new user has joined Zygotrix!_"
    )

    try:
        # Format phone numbers for WhatsApp
        from_number = settings.twilio_whatsapp_from
        to_number = settings.admin_whatsapp_to

        # Ensure numbers have whatsapp: prefix
        if not from_number.startswith("whatsapp:"):
            from_number = f"whatsapp:{from_number}"
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"

        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=to_number
        )

        logger.info(
            f"WhatsApp notification sent successfully. SID: {message.sid}")
        return True

    except TwilioRestException as e:
        logger.error(f"Twilio error sending WhatsApp notification: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending WhatsApp notification: {e}")
        return False


def send_custom_whatsapp_notification(
    message: str,
    to_number: Optional[str] = None,
) -> bool:
    """
    Send a custom WhatsApp notification.

    Args:
        message: The message to send
        to_number: Optional recipient number (defaults to admin number)

    Returns:
        True if message was sent successfully, False otherwise
    """
    settings = get_settings()

    if not settings.twilio_whatsapp_from:
        logger.info("WhatsApp notification skipped: not configured")
        return False

    recipient = to_number or settings.admin_whatsapp_to
    if not recipient:
        logger.warning(
            "No recipient number provided for WhatsApp notification")
        return False

    client = _get_twilio_client()
    if not client:
        return False

    try:
        from_number = settings.twilio_whatsapp_from

        if not from_number.startswith("whatsapp:"):
            from_number = f"whatsapp:{from_number}"
        if not recipient.startswith("whatsapp:"):
            recipient = f"whatsapp:{recipient}"

        message_obj = client.messages.create(
            body=message,
            from_=from_number,
            to=recipient
        )

        logger.info(
            f"Custom WhatsApp notification sent. SID: {message_obj.sid}")
        return True

    except TwilioRestException as e:
        logger.error(f"Twilio error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False


    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False
