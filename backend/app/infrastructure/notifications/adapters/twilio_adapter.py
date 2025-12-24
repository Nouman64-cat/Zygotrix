"""
Twilio Notification Adapter.

Adapter for Twilio SMS and WhatsApp notifications.
"""

import logging
import re
from typing import Optional

from ..base import (
    NotificationService,
    NotificationMessage,
    NotificationResult,
    NotificationChannel,
)

logger = logging.getLogger(__name__)


class TwilioNotificationAdapter(NotificationService):
    """
    Adapter for Twilio notification service.

    Supports SMS and WhatsApp message delivery through Twilio API.
    """

    def __init__(
        self,
        account_sid: str,
        auth_token: str,
        from_phone: str,
        from_whatsapp: Optional[str] = None,
    ):
        """
        Initialize Twilio adapter.

        Args:
            account_sid: Twilio account SID
            auth_token: Twilio auth token
            from_phone: Twilio phone number for SMS
            from_whatsapp: Twilio WhatsApp number (optional)
        """
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_phone = from_phone
        self.from_whatsapp = from_whatsapp or from_phone

        # Lazy load Twilio client
        self._client = None

    @property
    def client(self):
        """Get or create Twilio client."""
        if self._client is None:
            try:
                from twilio.rest import Client

                self._client = Client(self.account_sid, self.auth_token)
            except ImportError:
                logger.error("Twilio SDK not installed. Install with: pip install twilio")
                raise

        return self._client

    def send(self, message: NotificationMessage) -> NotificationResult:
        """
        Send notification via Twilio.

        Args:
            message: Notification message to send

        Returns:
            Result of send operation
        """
        if not self.supports_channel(message.channel):
            return NotificationResult(
                success=False, error=f"Channel {message.channel.value} not supported"
            )

        try:
            # Determine from and to numbers based on channel
            if message.channel == NotificationChannel.WHATSAPP:
                from_number = f"whatsapp:{self.from_whatsapp}"
                to_number = f"whatsapp:{message.recipient}"
            else:  # SMS
                from_number = self.from_phone
                to_number = message.recipient

            # Send message via Twilio
            twilio_message = self.client.messages.create(
                from_=from_number, to=to_number, body=message.message
            )

            logger.info(
                f"Sent {message.channel.value} to {message.recipient} via Twilio (SID: {twilio_message.sid})"
            )

            return NotificationResult(
                success=True,
                message_id=twilio_message.sid,
                details={
                    "status": twilio_message.status,
                    "direction": twilio_message.direction,
                },
            )

        except Exception as e:
            logger.error(
                f"Failed to send {message.channel.value} via Twilio: {str(e)}"
            )
            return NotificationResult(success=False, error=str(e))

    def supports_channel(self, channel: NotificationChannel) -> bool:
        """Check if Twilio supports the given channel."""
        supported = {NotificationChannel.SMS, NotificationChannel.WHATSAPP}
        return channel in supported

    def get_service_name(self) -> str:
        """Get service name."""
        return "Twilio"

    def validate_recipient(
        self, recipient: str, channel: NotificationChannel
    ) -> bool:
        """
        Validate phone number format.

        Args:
            recipient: Phone number to validate
            channel: Notification channel

        Returns:
            True if phone number format is valid
        """
        if channel not in [NotificationChannel.SMS, NotificationChannel.WHATSAPP]:
            return False

        # Basic E.164 format validation: +[country code][number]
        # Example: +14155552671
        pattern = r"^\+[1-9]\d{1,14}$"
        return bool(re.match(pattern, recipient))
