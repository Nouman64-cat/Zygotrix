"""
Base Notification Service Interface.

Abstract interface for notification services using Adapter Pattern.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any
from enum import Enum


class NotificationChannel(Enum):
    """Notification delivery channels."""

    SMS = "sms"
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    PUSH = "push"


@dataclass
class NotificationMessage:
    """
    Notification message data.

    Attributes:
        recipient: Recipient identifier (phone, email, device token, etc.)
        message: Message content
        channel: Delivery channel
        subject: Message subject (for email, optional)
        metadata: Additional message metadata
    """

    recipient: str
    message: str
    channel: NotificationChannel
    subject: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class NotificationResult:
    """
    Result of a notification send attempt.

    Attributes:
        success: Whether notification was sent successfully
        message_id: External service message ID (if available)
        error: Error message if failed
        details: Additional details from the service
    """

    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class NotificationService(ABC):
    """
    Abstract notification service interface.

    Defines the contract that all notification adapters must implement.
    Allows swapping notification providers without changing business logic.
    """

    @abstractmethod
    def send(self, message: NotificationMessage) -> NotificationResult:
        """
        Send a notification message.

        Args:
            message: Notification message to send

        Returns:
            Result of the send operation

        Raises:
            NotificationError: If sending fails critically
        """
        pass

    @abstractmethod
    def supports_channel(self, channel: NotificationChannel) -> bool:
        """
        Check if this service supports a specific channel.

        Args:
            channel: Notification channel to check

        Returns:
            True if channel is supported, False otherwise
        """
        pass

    @abstractmethod
    def get_service_name(self) -> str:
        """
        Get the name of this notification service.

        Returns:
            Service name (e.g., "Twilio", "AWS SNS")
        """
        pass

    def validate_recipient(
        self, recipient: str, channel: NotificationChannel
    ) -> bool:
        """
        Validate recipient format for the given channel.

        Args:
            recipient: Recipient identifier
            channel: Delivery channel

        Returns:
            True if recipient format is valid, False otherwise

        Note:
            Default implementation always returns True.
            Override for channel-specific validation.
        """
        return bool(recipient)
