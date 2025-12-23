"""
Authentication Services Module.

This module contains all authentication-related services,
following the Single Responsibility Principle.
"""
from typing import Dict, Any, Optional, Mapping
from .password_service import PasswordService
from .otp_service import OTPService
from .user_serializer import UserSerializer, get_user_serializer
from .activity_tracking_service import ActivityTrackingService
from .authentication_service import AuthenticationService
from .user_service import UserService, get_user_service
from .signup_service import SignupService

# Compatibility functions for backward compatibility with old code
# These are wrappers around the new service methods

def _serialize_user(document: Mapping[str, Any]) -> Dict[str, Any]:
    """
    Serialize user document (compatibility wrapper).

    Args:
        document: User document from MongoDB

    Returns:
        Serialized user dictionary
    """
    serializer = get_user_serializer()
    return serializer.serialize_user(document)


def _normalize_email(email: str) -> str:
    """
    Normalize email address (compatibility wrapper).

    Args:
        email: Email address

    Returns:
        Normalized email
    """
    serializer = get_user_serializer()
    return serializer._normalize_email(email)


def clear_user_cache(user_id: Optional[str] = None) -> None:
    """
    Clear user cache (compatibility wrapper).

    Args:
        user_id: User ID to clear, or None to clear all
    """
    user_service = get_user_service()
    user_service._clear_user_cache(user_id)


# Keep get_users_collection in services/common.py for now
from app.services.common import get_users_collection

__all__ = [
    "PasswordService",
    "OTPService",
    "UserSerializer",
    "ActivityTrackingService",
    "AuthenticationService",
    "UserService",
    "SignupService",
    # Compatibility exports
    "_serialize_user",
    "_normalize_email",
    "clear_user_cache",
    "get_users_collection",
]
