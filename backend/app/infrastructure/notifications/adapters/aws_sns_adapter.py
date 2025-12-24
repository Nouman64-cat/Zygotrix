"""
AWS SNS Notification Adapter.

Adapter for Amazon Simple Notification Service (SNS).
"""

import logging
from typing import Optional

from ..base import (
    NotificationService,
    NotificationMessage,
    NotificationResult,
    NotificationChannel,
)

logger = logging.getLogger(__name__)


class AWSSNSNotificationAdapter(NotificationService):
    """
    Adapter for AWS SNS notification service.

    Supports SMS delivery through Amazon SNS.
    """

    def __init__(
        self,
        aws_access_key_id: str,
        aws_secret_access_key: str,
        region_name: str = "us-east-1",
    ):
        """
        Initialize AWS SNS adapter.

        Args:
            aws_access_key_id: AWS access key ID
            aws_secret_access_key: AWS secret access key
            region_name: AWS region (default: us-east-1)
        """
        self.aws_access_key_id = aws_access_key_id
        self.aws_secret_access_key = aws_secret_access_key
        self.region_name = region_name

        # Lazy load boto3 client
        self._client = None

    @property
    def client(self):
        """Get or create SNS client."""
        if self._client is None:
            try:
                import boto3

                self._client = boto3.client(
                    "sns",
                    aws_access_key_id=self.aws_access_key_id,
                    aws_secret_access_key=self.aws_secret_access_key,
                    region_name=self.region_name,
                )
            except ImportError:
                logger.error("boto3 not installed. Install with: pip install boto3")
                raise

        return self._client

    def send(self, message: NotificationMessage) -> NotificationResult:
        """
        Send notification via AWS SNS.

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
            # Send SMS via SNS
            response = self.client.publish(
                PhoneNumber=message.recipient,
                Message=message.message,
                MessageAttributes={
                    "AWS.SNS.SMS.SenderID": {
                        "DataType": "String",
                        "StringValue": "Zygotrix",
                    },
                    "AWS.SNS.SMS.SMSType": {
                        "DataType": "String",
                        "StringValue": "Transactional",  # For OTP/verification
                    },
                },
            )

            message_id = response.get("MessageId")
            logger.info(f"Sent SMS to {message.recipient} via AWS SNS (ID: {message_id})")

            return NotificationResult(
                success=True,
                message_id=message_id,
                details={"response_metadata": response.get("ResponseMetadata")},
            )

        except Exception as e:
            logger.error(f"Failed to send SMS via AWS SNS: {str(e)}")
            return NotificationResult(success=False, error=str(e))

    def supports_channel(self, channel: NotificationChannel) -> bool:
        """Check if AWS SNS supports the given channel."""
        # AWS SNS primarily supports SMS for direct publishing
        # (can also do email via topics, but that's a different flow)
        return channel == NotificationChannel.SMS

    def get_service_name(self) -> str:
        """Get service name."""
        return "AWS SNS"

    def validate_recipient(
        self, recipient: str, channel: NotificationChannel
    ) -> bool:
        """
        Validate phone number format for SNS.

        Args:
            recipient: Phone number to validate
            channel: Notification channel

        Returns:
            True if phone number format is valid
        """
        if channel != NotificationChannel.SMS:
            return False

        # AWS SNS requires E.164 format
        import re

        pattern = r"^\+[1-9]\d{1,14}$"
        return bool(re.match(pattern, recipient))
