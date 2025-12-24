"""
Notifications Infrastructure.

External notification service integrations using Adapter Pattern.
"""

from .base import NotificationService, NotificationMessage
from .adapters.twilio_adapter import TwilioNotificationAdapter
from .adapters.aws_sns_adapter import AWSSNSNotificationAdapter

__all__ = [
    "NotificationService",
    "NotificationMessage",
    "TwilioNotificationAdapter",
    "AWSSNSNotificationAdapter",
]
