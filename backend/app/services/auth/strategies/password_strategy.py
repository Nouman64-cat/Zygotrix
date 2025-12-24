"""
Password-based Authentication Strategy.

Authenticates users using email and password.
"""

from typing import Dict, Any
import logging

from .base import AuthenticationStrategy
from ....core.exceptions.auth import InvalidCredentialsError, AuthenticationError
from ....core.exceptions.business import AccountDeactivatedError
from ....services import auth as auth_services

logger = logging.getLogger(__name__)


class PasswordAuthenticationStrategy(AuthenticationStrategy):
    """
    Password-based authentication strategy.

    Authenticates users by verifying email and password against stored credentials.
    Uses bcrypt for password hashing and verification.
    """

    def authenticate(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """
        Authenticate user with email and password.

        Args:
            credentials: Dictionary containing:
                - email: User email address
                - password: User password (plain text)

        Returns:
            Dictionary containing authenticated user data

        Raises:
            InvalidCredentialsError: If email or password is invalid
            AccountDeactivatedError: If user account is deactivated
            AuthenticationError: If authentication fails for other reasons
        """
        # Validate credentials format
        if not self.validate_credentials(credentials):
            raise InvalidCredentialsError("Email and password are required")

        email = credentials["email"]
        password = credentials["password"]

        try:
            # Use existing auth service to authenticate
            user = auth_services.authenticate_user(email, password)

            if not user:
                raise InvalidCredentialsError("Invalid email or password")

            # Check if account is active
            if not user.get("is_active", True):
                raise AccountDeactivatedError()

            logger.info(f"User {email} authenticated successfully via password")
            return user

        except InvalidCredentialsError:
            raise
        except AccountDeactivatedError:
            raise
        except Exception as e:
            logger.error(f"Authentication error for {email}: {str(e)}")
            raise AuthenticationError(f"Authentication failed: {str(e)}")

    def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        """
        Validate that credentials contain required fields.

        Args:
            credentials: Dictionary to validate

        Returns:
            True if email and password are present, False otherwise
        """
        return (
            isinstance(credentials, dict)
            and "email" in credentials
            and "password" in credentials
            and credentials["email"]
            and credentials["password"]
        )

    def get_required_fields(self) -> list[str]:
        """Get required fields for password authentication."""
        return ["email", "password"]
