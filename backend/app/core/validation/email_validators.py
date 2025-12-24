"""
Email Validation Handlers.

Validators for email address format and domain validation.
"""

import re
from typing import Dict, Any, Set, Optional

from .chain import ValidationHandler
from ..exceptions.validation import InvalidEmailFormatError, InvalidInputError


class EmailFormatValidator(ValidationHandler):
    """
    Validate email address format.

    Checks that email matches a valid format pattern.
    """

    # RFC 5322 simplified email regex
    EMAIL_REGEX = re.compile(
        r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
    )

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate email format.

        Args:
            data: Dictionary containing 'email' field

        Returns:
            Data with sanitized email (lowercase, trimmed)

        Raises:
            InvalidEmailFormatError: If email format is invalid
        """
        email = data.get("email", "")

        if not email:
            raise InvalidEmailFormatError("")

        # Sanitize: trim and lowercase
        email = email.strip().lower()

        # Validate format
        if not self.EMAIL_REGEX.match(email):
            raise InvalidEmailFormatError(email)

        # Update data with sanitized email
        data["email"] = email
        return data


class EmailDomainValidator(ValidationHandler):
    """
    Validate email domain against blocklist.

    Prevents registration from disposable email services or blocked domains.
    """

    # Common disposable email domains (extensible)
    BLOCKED_DOMAINS: Set[str] = {
        "tempmail.com",
        "throwaway.email",
        "guerrillamail.com",
        "10minutemail.com",
        "mailinator.com",
        "maildrop.cc",
        "trashmail.com",
    }

    def __init__(
        self, blocked_domains: Optional[Set[str]] = None, next_handler=None
    ):
        """
        Initialize domain validator.

        Args:
            blocked_domains: Additional domains to block (optional)
            next_handler: Next handler in chain
        """
        super().__init__(next_handler)
        if blocked_domains:
            self.blocked_domains = self.BLOCKED_DOMAINS.union(blocked_domains)
        else:
            self.blocked_domains = self.BLOCKED_DOMAINS

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate email domain.

        Args:
            data: Dictionary containing 'email' field

        Returns:
            Unmodified data if valid

        Raises:
            InvalidInputError: If domain is blocked
        """
        email = data.get("email", "")

        if not email or "@" not in email:
            # Let EmailFormatValidator handle this
            return data

        domain = email.split("@")[-1].lower()

        if domain in self.blocked_domains:
            raise InvalidInputError(
                "email", f"Email domain '{domain}' is not allowed"
            )

        return data
