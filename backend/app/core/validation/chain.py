"""
Validation Chain Base Classes.

Chain of Responsibility pattern for validation pipelines.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class ValidationHandler(ABC):
    """
    Base validation handler in the chain of responsibility.

    Each handler can validate data and pass it to the next handler in the chain.
    If validation fails, raises a ValidationError.
    """

    def __init__(self, next_handler: Optional["ValidationHandler"] = None):
        """
        Initialize validation handler.

        Args:
            next_handler: Next handler in the chain (optional)
        """
        self._next_handler = next_handler

    def set_next(self, handler: "ValidationHandler") -> "ValidationHandler":
        """
        Set the next handler in the chain.

        Args:
            handler: Next validation handler

        Returns:
            The handler that was set (for chaining)
        """
        self._next_handler = handler
        return handler

    def handle(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle validation for the data.

        Args:
            data: Data dictionary to validate

        Returns:
            Validated data (possibly modified)

        Raises:
            ValidationError: If validation fails
        """
        # Validate current handler
        validated_data = self.validate(data)

        # Pass to next handler if exists
        if self._next_handler:
            return self._next_handler.handle(validated_data)

        return validated_data

    @abstractmethod
    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate the data.

        Args:
            data: Data to validate

        Returns:
            Validated data (possibly modified/sanitized)

        Raises:
            ValidationError: If validation fails
        """
        pass


class ValidationChain:
    """
    Helper class for building validation chains.

    Provides a fluent interface for constructing validation pipelines.

    Example:
        chain = (ValidationChain()
            .add(EmailFormatValidator())
            .add(EmailDomainValidator())
            .add(PasswordStrengthValidator())
            .build())

        validated_data = chain.handle(user_data)
    """

    def __init__(self):
        """Initialize empty validation chain."""
        self._handlers: List[ValidationHandler] = []

    def add(self, handler: ValidationHandler) -> "ValidationChain":
        """
        Add a validation handler to the chain.

        Args:
            handler: Validation handler to add

        Returns:
            Self for method chaining
        """
        self._handlers.append(handler)
        return self

    def build(self) -> ValidationHandler:
        """
        Build the validation chain by linking handlers.

        Returns:
            First handler in the chain

        Raises:
            ValueError: If no handlers were added
        """
        if not self._handlers:
            raise ValueError("Cannot build empty validation chain")

        # Link handlers together
        for i in range(len(self._handlers) - 1):
            self._handlers[i].set_next(self._handlers[i + 1])

        # Return first handler
        return self._handlers[0]
