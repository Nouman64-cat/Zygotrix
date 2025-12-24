"""
Newsletter Validation Handlers.

Custom validators for newsletter operations.
"""
from typing import Dict, Any
from ...core.exceptions.validation import ValidationError
from .chain import ValidationHandler


class NewsletterEmailValidator(ValidationHandler):
    """Validate newsletter email subscriptions."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate newsletter email."""
        email = data.get("email")

        if not email:
            raise ValidationError("Email is required for newsletter subscription")

        if not isinstance(email, str):
            raise ValidationError("Email must be a string")

        # Additional newsletter-specific validations
        email_lower = email.lower().strip()

        # Block role-based emails for newsletter
        role_prefixes = ["noreply@", "no-reply@", "admin@", "postmaster@", "abuse@"]
        if any(email_lower.startswith(prefix) for prefix in role_prefixes):
            raise ValidationError(
                "Role-based email addresses cannot subscribe to newsletter"
            )

        # Ensure email isn't too long
        if len(email) > 254:  # RFC 5321
            raise ValidationError("Email address is too long")

        return data


class NewsletterContentValidator(ValidationHandler):
    """Validate newsletter content for sending."""

    MIN_SUBJECT_LENGTH = 5
    MAX_SUBJECT_LENGTH = 200
    MIN_BODY_LENGTH = 50
    MAX_BODY_LENGTH = 100000

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate newsletter content."""
        subject = data.get("subject")
        body = data.get("body") or data.get("content")

        # Validate subject
        if not subject:
            raise ValidationError("Newsletter subject is required")

        if not isinstance(subject, str):
            raise ValidationError("Newsletter subject must be a string")

        subject_stripped = subject.strip()

        if len(subject_stripped) < self.MIN_SUBJECT_LENGTH:
            raise ValidationError(
                f"Newsletter subject must be at least {self.MIN_SUBJECT_LENGTH} characters"
            )

        if len(subject_stripped) > self.MAX_SUBJECT_LENGTH:
            raise ValidationError(
                f"Newsletter subject must not exceed {self.MAX_SUBJECT_LENGTH} characters"
            )

        # Validate body
        if not body:
            raise ValidationError("Newsletter body/content is required")

        if not isinstance(body, str):
            raise ValidationError("Newsletter body must be a string")

        body_stripped = body.strip()

        if len(body_stripped) < self.MIN_BODY_LENGTH:
            raise ValidationError(
                f"Newsletter body must be at least {self.MIN_BODY_LENGTH} characters"
            )

        if len(body_stripped) > self.MAX_BODY_LENGTH:
            raise ValidationError(
                f"Newsletter body must not exceed {self.MAX_BODY_LENGTH} characters"
            )

        # Check for spam patterns
        spam_words = ["click here now", "100% free", "act now!", "limited time only"]
        body_lower = body_stripped.lower()
        subject_lower = subject_stripped.lower()

        spam_count = sum(
            1
            for word in spam_words
            if word in body_lower or word in subject_lower
        )

        if spam_count >= 2:
            raise ValidationError(
                "Newsletter content contains too many spam-like phrases"
            )

        return data


class RecipientListValidator(ValidationHandler):
    """Validate newsletter recipient list."""

    MAX_RECIPIENTS = 10000

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate recipient list."""
        recipients = data.get("recipients") or data.get("recipient_emails")

        if recipients is not None:
            if not isinstance(recipients, list):
                raise ValidationError("Recipients must be a list")

            if len(recipients) == 0:
                raise ValidationError("At least one recipient is required")

            if len(recipients) > self.MAX_RECIPIENTS:
                raise ValidationError(
                    f"Cannot send to more than {self.MAX_RECIPIENTS} recipients at once"
                )

            # Validate each recipient email format (basic check)
            for idx, email in enumerate(recipients):
                if not isinstance(email, str):
                    raise ValidationError(f"Recipient {idx + 1} must be a string")

                if "@" not in email:
                    raise ValidationError(
                        f"Recipient {idx + 1} is not a valid email format"
                    )

        return data
