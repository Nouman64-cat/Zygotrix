"""
Project Validation Handlers.

Custom validators for project operations.
"""
from typing import Dict, Any, List
from ...core.exceptions.validation import ValidationError
from .chain import ValidationHandler


class ProjectNameValidator(ValidationHandler):
    """Validate project name."""

    # List of prohibited words (profanity, spam, etc.)
    PROHIBITED_WORDS = [
        "test123",
        "asdf",
        "qwerty",
        # Add more as needed
    ]

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate project name."""
        name = data.get("name")

        if not name:
            raise ValidationError("Project name is required")

        if not isinstance(name, str):
            raise ValidationError("Project name must be a string")

        # Strip whitespace for validation
        name_stripped = name.strip()

        if len(name_stripped) < 3:
            raise ValidationError("Project name must be at least 3 characters long")

        if len(name_stripped) > 100:
            raise ValidationError("Project name must not exceed 100 characters")

        # Check for prohibited words
        name_lower = name_stripped.lower()
        for word in self.PROHIBITED_WORDS:
            if word in name_lower:
                raise ValidationError(
                    f"Project name contains prohibited content"
                )

        # Check for special characters that might cause issues
        if any(char in name for char in ['<', '>', '&', '"', "'"]):
            raise ValidationError(
                "Project name contains invalid characters"
            )

        return data


class ProjectDescriptionValidator(ValidationHandler):
    """Validate project description."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate project description."""
        description = data.get("description")

        # Description is optional
        if description is None or description == "":
            return data

        if not isinstance(description, str):
            raise ValidationError("Project description must be a string")

        if len(description) > 5000:
            raise ValidationError(
                "Project description must not exceed 5,000 characters"
            )

        # Check for XSS patterns
        dangerous_patterns = ['<script', 'javascript:', 'onerror=', 'onclick=']
        description_lower = description.lower()
        for pattern in dangerous_patterns:
            if pattern in description_lower:
                raise ValidationError(
                    "Project description contains potentially unsafe content"
                )

        return data


class ProjectTagsValidator(ValidationHandler):
    """Validate project tags."""

    MAX_TAGS = 10
    MAX_TAG_LENGTH = 30

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate project tags."""
        tags = data.get("tags")

        # Tags are optional
        if tags is None:
            return data

        if not isinstance(tags, list):
            raise ValidationError("Project tags must be a list")

        if len(tags) > self.MAX_TAGS:
            raise ValidationError(
                f"Project cannot have more than {self.MAX_TAGS} tags"
            )

        # Validate each tag
        for idx, tag in enumerate(tags):
            if not isinstance(tag, str):
                raise ValidationError(f"Tag {idx + 1} must be a string")

            tag_stripped = tag.strip()

            if len(tag_stripped) == 0:
                raise ValidationError(f"Tag {idx + 1} cannot be empty")

            if len(tag_stripped) > self.MAX_TAG_LENGTH:
                raise ValidationError(
                    f"Tag {idx + 1} must not exceed {self.MAX_TAG_LENGTH} characters"
                )

            # Tags should be alphanumeric with some allowed characters
            if not all(c.isalnum() or c in ['-', '_', ' '] for c in tag_stripped):
                raise ValidationError(
                    f"Tag {idx + 1} contains invalid characters. Use only letters, numbers, hyphens, underscores, and spaces"
                )

        return data


class ProjectTypeValidator(ValidationHandler):
    """Validate project type."""

    VALID_TYPES = ["dna", "protein", "general", "research"]

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate project type."""
        project_type = data.get("type") or data.get("project_type")

        if project_type and project_type not in self.VALID_TYPES:
            raise ValidationError(
                f"Invalid project type. Must be one of: {', '.join(self.VALID_TYPES)}"
            )

        return data
