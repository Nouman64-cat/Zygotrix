"""
University Validation Handlers.

Custom validators for university course operations.
"""
from typing import Dict, Any, List, Optional
from ...core.exceptions.validation import ValidationError
from .chain import ValidationHandler


class CourseSlugValidator(ValidationHandler):
    """Validate course slug format."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate course slug."""
        course_slug = data.get("course_slug") or data.get("slug")

        if not course_slug:
            raise ValidationError("Course slug is required")

        if not isinstance(course_slug, str):
            raise ValidationError("Course slug must be a string")

        # Slugs should be lowercase, alphanumeric with hyphens
        if not course_slug.replace("-", "").replace("_", "").isalnum():
            raise ValidationError(
                "Course slug must contain only letters, numbers, hyphens, and underscores"
            )

        if len(course_slug) < 3:
            raise ValidationError("Course slug must be at least 3 characters long")

        if len(course_slug) > 100:
            raise ValidationError("Course slug must not exceed 100 characters")

        return data


class AssessmentAnswerFormatValidator(ValidationHandler):
    """Validate assessment submission answer format."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate assessment answers."""
        answers = data.get("answers")

        if not answers:
            raise ValidationError("Assessment answers are required")

        if not isinstance(answers, list):
            raise ValidationError("Answers must be a list")

        if len(answers) == 0:
            raise ValidationError("At least one answer is required")

        if len(answers) > 100:
            raise ValidationError("Too many answers (maximum 100)")

        # Validate each answer
        for idx, answer in enumerate(answers):
            if not isinstance(answer, dict):
                raise ValidationError(f"Answer {idx + 1} must be an object")

            if "question_id" not in answer:
                raise ValidationError(f"Answer {idx + 1} missing question_id")

            if "answer" not in answer and "selected_option" not in answer:
                raise ValidationError(
                    f"Answer {idx + 1} must have either 'answer' or 'selected_option'"
                )

            # Validate answer content if present
            if "answer" in answer:
                answer_text = answer["answer"]
                if isinstance(answer_text, str) and len(answer_text) > 10000:
                    raise ValidationError(
                        f"Answer {idx + 1} text too long (maximum 10,000 characters)"
                    )

        return data


class ModuleProgressValidator(ValidationHandler):
    """Validate module progress data."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate module progress."""
        module_id = data.get("module_id")
        completed = data.get("completed")

        if module_id and not isinstance(module_id, str):
            raise ValidationError("Module ID must be a string")

        if module_id and len(module_id) > 100:
            raise ValidationError("Module ID too long")

        if completed is not None and not isinstance(completed, bool):
            raise ValidationError("Completed field must be a boolean")

        # Validate progress percentage if present
        progress = data.get("progress")
        if progress is not None:
            if not isinstance(progress, (int, float)):
                raise ValidationError("Progress must be a number")

            if progress < 0 or progress > 100:
                raise ValidationError("Progress must be between 0 and 100")

        return data


class CourseEnrollmentValidator(ValidationHandler):
    """Validate course enrollment request."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate enrollment request."""
        course_slug = data.get("course_slug")

        if not course_slug:
            raise ValidationError("Course slug is required for enrollment")

        if not isinstance(course_slug, str):
            raise ValidationError("Course slug must be a string")

        # Additional enrollment-specific validations
        # Could check prerequisites here if needed

        return data
