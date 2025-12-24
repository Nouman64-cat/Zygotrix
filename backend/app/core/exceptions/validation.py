"""
Validation Exception Classes.

Exceptions related to input validation.
"""

from typing import Optional, Dict, Any, List
from .base import BaseApplicationError


class ValidationError(BaseApplicationError):
    """Base validation error."""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        error_details = details or {}
        if field:
            error_details["field"] = field
        super().__init__(message, status_code=400, details=error_details)


class InvalidInputError(ValidationError):
    """Invalid input provided."""

    def __init__(self, field: str, reason: str):
        message = f"Invalid {field}: {reason}"
        super().__init__(message, field=field)


class MissingRequiredFieldError(ValidationError):
    """Required field is missing."""

    def __init__(self, field: str):
        message = f"Required field '{field}' is missing"
        super().__init__(message, field=field)


class InvalidEmailFormatError(ValidationError):
    """Email format is invalid."""

    def __init__(self, email: str):
        message = "Invalid email format"
        super().__init__(message, field="email", details={"provided": email})


class InvalidPasswordError(ValidationError):
    """Password does not meet requirements."""

    def __init__(self, requirements: Optional[List[str]] = None):
        message = "Password does not meet security requirements"
        details = {"requirements": requirements} if requirements else {}
        super().__init__(message, field="password", details=details)


class ValidationErrorList(ValidationError):
    """Multiple validation errors occurred."""

    def __init__(self, errors: List[Dict[str, str]]):
        message = f"{len(errors)} validation error(s) occurred"
        super().__init__(message, details={"errors": errors})
