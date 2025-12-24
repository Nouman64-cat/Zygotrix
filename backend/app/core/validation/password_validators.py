"""
Password Validation Handlers.

Validators for password strength and security requirements.
"""

import re
from typing import Dict, Any, Set, List

from .chain import ValidationHandler
from ..exceptions.validation import InvalidPasswordError, InvalidInputError


class PasswordLengthValidator(ValidationHandler):
    """
    Validate password length requirements.

    Ensures password meets minimum and maximum length requirements.
    """

    def __init__(
        self, min_length: int = 8, max_length: int = 128, next_handler=None
    ):
        """
        Initialize length validator.

        Args:
            min_length: Minimum password length (default: 8)
            max_length: Maximum password length (default: 128)
            next_handler: Next handler in chain
        """
        super().__init__(next_handler)
        self.min_length = min_length
        self.max_length = max_length

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate password length.

        Args:
            data: Dictionary containing 'password' field

        Returns:
            Unmodified data if valid

        Raises:
            InvalidPasswordError: If password length is invalid
        """
        password = data.get("password", "")

        if len(password) < self.min_length:
            raise InvalidPasswordError(
                requirements=[f"At least {self.min_length} characters long"]
            )

        if len(password) > self.max_length:
            raise InvalidPasswordError(
                requirements=[f"Maximum {self.max_length} characters"]
            )

        return data


class PasswordStrengthValidator(ValidationHandler):
    """
    Validate password strength requirements.

    Checks for uppercase, lowercase, digits, and special characters.
    """

    def __init__(
        self,
        require_uppercase: bool = True,
        require_lowercase: bool = True,
        require_digit: bool = True,
        require_special: bool = True,
        next_handler=None,
    ):
        """
        Initialize strength validator.

        Args:
            require_uppercase: Require at least one uppercase letter
            require_lowercase: Require at least one lowercase letter
            require_digit: Require at least one digit
            require_special: Require at least one special character
            next_handler: Next handler in chain
        """
        super().__init__(next_handler)
        self.require_uppercase = require_uppercase
        self.require_lowercase = require_lowercase
        self.require_digit = require_digit
        self.require_special = require_special

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate password strength.

        Args:
            data: Dictionary containing 'password' field

        Returns:
            Unmodified data if valid

        Raises:
            InvalidPasswordError: If password doesn't meet strength requirements
        """
        password = data.get("password", "")
        requirements: List[str] = []

        if self.require_uppercase and not re.search(r"[A-Z]", password):
            requirements.append("At least one uppercase letter")

        if self.require_lowercase and not re.search(r"[a-z]", password):
            requirements.append("At least one lowercase letter")

        if self.require_digit and not re.search(r"\d", password):
            requirements.append("At least one digit")

        if self.require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            requirements.append("At least one special character")

        if requirements:
            raise InvalidPasswordError(requirements=requirements)

        return data


class PasswordCommonValidator(ValidationHandler):
    """
    Validate against common/weak passwords.

    Prevents use of commonly used passwords that are easily guessed.
    """

    # Top 100 most common passwords (subset for demonstration)
    COMMON_PASSWORDS: Set[str] = {
        "password",
        "123456",
        "123456789",
        "12345678",
        "12345",
        "1234567",
        "password1",
        "qwerty",
        "abc123",
        "111111",
        "123123",
        "admin",
        "letmein",
        "welcome",
        "monkey",
        "dragon",
        "master",
        "sunshine",
        "princess",
        "football",
        "qwerty123",
        "1234567890",
    }

    def __init__(self, additional_blocked: Optional[Set[str]] = None, next_handler=None):
        """
        Initialize common password validator.

        Args:
            additional_blocked: Additional passwords to block
            next_handler: Next handler in chain
        """
        super().__init__(next_handler)
        if additional_blocked:
            self.blocked_passwords = self.COMMON_PASSWORDS.union(additional_blocked)
        else:
            self.blocked_passwords = self.COMMON_PASSWORDS

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate password is not commonly used.

        Args:
            data: Dictionary containing 'password' field

        Returns:
            Unmodified data if valid

        Raises:
            InvalidPasswordError: If password is too common
        """
        password = data.get("password", "")

        # Check lowercase version (common passwords are usually lowercase)
        if password.lower() in self.blocked_passwords:
            raise InvalidPasswordError(
                requirements=["Password is too common, please choose a stronger password"]
            )

        return data
