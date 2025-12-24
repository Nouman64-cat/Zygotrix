"""
Base Authentication Strategy.

Abstract interface for authentication strategies.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class AuthenticationStrategy(ABC):
    """
    Abstract base class for authentication strategies.

    Defines the interface that all authentication strategies must implement.
    Allows the application to support multiple authentication methods
    (password, OTP, OAuth, etc.) without changing the core authentication logic.
    """

    @abstractmethod
    def authenticate(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """
        Authenticate a user with the provided credentials.

        Args:
            credentials: Dictionary containing authentication credentials.
                        The structure depends on the specific strategy.

        Returns:
            Dictionary containing authenticated user data including:
            - id: User ID
            - email: User email
            - name: User name
            - role: User role
            - is_active: Whether user is active
            - Additional user fields as needed

        Raises:
            InvalidCredentialsError: If credentials are invalid
            AuthenticationError: If authentication fails for other reasons
            AccountDeactivatedError: If user account is deactivated
        """
        pass

    @abstractmethod
    def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        """
        Validate that credentials have the required format/fields.

        Args:
            credentials: Dictionary containing credentials to validate

        Returns:
            True if credentials have valid format, False otherwise

        Note:
            This validates the structure, not the actual credentials.
            Use authenticate() to verify credentials are correct.
        """
        pass

    def get_required_fields(self) -> list[str]:
        """
        Get list of required credential fields for this strategy.

        Returns:
            List of required field names

        Example:
            For password strategy: ["email", "password"]
            For OTP strategy: ["email", "otp_code"]
        """
        return []

    def get_strategy_name(self) -> str:
        """
        Get the name of this authentication strategy.

        Returns:
            Strategy name (e.g., "password", "otp", "oauth")
        """
        return self.__class__.__name__.replace("AuthenticationStrategy", "").lower()
