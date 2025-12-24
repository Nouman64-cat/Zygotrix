"""
OTP-based Authentication Strategy.

Authenticates users using email and one-time password (OTP).
"""

from typing import Dict, Any
import logging
from datetime import datetime, timezone

from .base import AuthenticationStrategy
from ....core.exceptions.auth import InvalidCredentialsError, AuthenticationError
from ....core.exceptions.business import (
    OTPExpiredError,
    MaxAttemptsExceededError,
    AccountDeactivatedError,
)
from ....services import auth as auth_services

logger = logging.getLogger(__name__)


class OTPAuthenticationStrategy(AuthenticationStrategy):
    """
    OTP-based authentication strategy.

    Authenticates users by verifying a one-time password sent to their email.
    Includes protection against brute force attacks with attempt limits.
    """

    def authenticate(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """
        Authenticate user with email and OTP code.

        Args:
            credentials: Dictionary containing:
                - email: User email address
                - otp_code: One-time password code

        Returns:
            Dictionary containing authenticated user data

        Raises:
            InvalidCredentialsError: If email or OTP is invalid
            OTPExpiredError: If OTP has expired
            MaxAttemptsExceededError: If too many invalid attempts
            AccountDeactivatedError: If user account is deactivated
            AuthenticationError: If authentication fails for other reasons
        """
        # Validate credentials format
        if not self.validate_credentials(credentials):
            raise InvalidCredentialsError("Email and OTP code are required")

        email = credentials["email"]
        otp_code = credentials["otp_code"]

        try:
            # Get pending signup record
            pending_collection = auth_services.get_pending_signups_collection()
            if not pending_collection:
                raise AuthenticationError("Authentication service unavailable")

            pending = pending_collection.find_one({"email": email.lower().strip()})
            if not pending:
                raise InvalidCredentialsError("No pending signup found for this email")

            # Check if OTP has expired
            otp_expires_at = pending.get("otp_expires_at")
            if otp_expires_at and otp_expires_at < datetime.now(timezone.utc):
                raise OTPExpiredError()

            # Check attempt limit
            otp_attempts = pending.get("otp_attempts", 0)
            max_attempts = 5  # TODO: Move to config
            if otp_attempts >= max_attempts:
                raise MaxAttemptsExceededError(
                    "Too many invalid OTP attempts. Please request a new code.",
                    max_attempts=max_attempts,
                )

            # Verify OTP
            otp_hash = pending.get("otp_hash", "")
            if not auth_services.verify_password(otp_code, otp_hash):
                # Increment attempt counter
                pending_collection.update_one(
                    {"email": email.lower().strip()},
                    {"$inc": {"otp_attempts": 1}},
                )
                raise InvalidCredentialsError("Invalid OTP code")

            # OTP verified - create user account
            user_data = {
                "email": pending.get("email"),
                "name": pending.get("name", ""),
                "password_hash": pending.get("password_hash"),
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "verified": True,
            }

            # Create user in database
            users_collection = auth_services.get_users_collection()
            if not users_collection:
                raise AuthenticationError("User service unavailable")

            result = users_collection.insert_one(user_data)
            user_data["id"] = str(result.inserted_id)

            # Remove pending signup
            pending_collection.delete_one({"email": email.lower().strip()})

            logger.info(f"User {email} authenticated successfully via OTP")
            return user_data

        except (
            InvalidCredentialsError,
            OTPExpiredError,
            MaxAttemptsExceededError,
            AccountDeactivatedError,
        ):
            raise
        except Exception as e:
            logger.error(f"OTP authentication error for {email}: {str(e)}")
            raise AuthenticationError(f"Authentication failed: {str(e)}")

    def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        """
        Validate that credentials contain required fields.

        Args:
            credentials: Dictionary to validate

        Returns:
            True if email and otp_code are present, False otherwise
        """
        return (
            isinstance(credentials, dict)
            and "email" in credentials
            and "otp_code" in credentials
            and credentials["email"]
            and credentials["otp_code"]
        )

    def get_required_fields(self) -> list[str]:
        """Get required fields for OTP authentication."""
        return ["email", "otp_code"]
