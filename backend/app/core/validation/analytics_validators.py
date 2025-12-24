"""
Analytics Validation Handlers.

Custom validators for analytics operations.
"""
from datetime import datetime, timedelta
from typing import Dict, Any
from ...core.exceptions.validation import ValidationError
from .chain import ValidationHandler


class DateRangeValidator(ValidationHandler):
    """Validate date range for analytics queries."""

    MAX_DAYS = 366  # Maximum 1 year + 1 day for leap years

    def __init__(self, max_days: int = MAX_DAYS):
        """
        Initialize date range validator.

        Args:
            max_days: Maximum number of days allowed in date range
        """
        super().__init__()
        self.max_days = max_days

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate date range."""
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        # If no dates provided, skip validation (will use defaults)
        if not start_date or not end_date:
            return data

        # Ensure dates are datetime objects
        if isinstance(start_date, str):
            try:
                start_date = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                data["start_date"] = start_date
            except (ValueError, AttributeError):
                raise ValidationError("Invalid start_date format. Use ISO 8601 format")

        if isinstance(end_date, str):
            try:
                end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                data["end_date"] = end_date
            except (ValueError, AttributeError):
                raise ValidationError("Invalid end_date format. Use ISO 8601 format")

        # Validate that end_date is after start_date
        if end_date <= start_date:
            raise ValidationError("end_date must be after start_date")

        # Validate date range doesn't exceed maximum
        date_diff = end_date - start_date

        if date_diff.days > self.max_days:
            raise ValidationError(
                f"Date range cannot exceed {self.max_days} days. "
                f"Requested range is {date_diff.days} days"
            )

        # Validate dates aren't in the future
        now = datetime.now(start_date.tzinfo) if start_date.tzinfo else datetime.now()
        if end_date > now:
            raise ValidationError("end_date cannot be in the future")

        return data


class TimeRangeValidator(ValidationHandler):
    """Validate predefined time ranges."""

    VALID_RANGES = [
        "LAST_7_DAYS",
        "LAST_30_DAYS",
        "LAST_90_DAYS",
        "LAST_365_DAYS",
        "ALL_TIME",
    ]

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate time range enum."""
        time_range = data.get("time_range")

        if time_range is None:
            return data

        # Handle enum objects
        if hasattr(time_range, "value"):
            time_range_value = time_range.value
        else:
            time_range_value = str(time_range)

        if time_range_value not in self.VALID_RANGES:
            raise ValidationError(
                f"Invalid time_range. Must be one of: {', '.join(self.VALID_RANGES)}"
            )

        return data


class AnalyticsFiltersValidator(ValidationHandler):
    """Validate analytics filters."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate analytics filter parameters."""
        # Validate include_time_series
        include_time_series = data.get("include_time_series")
        if include_time_series is not None and not isinstance(include_time_series, bool):
            raise ValidationError("include_time_series must be a boolean")

        # Validate include_popular_traits
        include_popular_traits = data.get("include_popular_traits")
        if include_popular_traits is not None and not isinstance(
            include_popular_traits, bool
        ):
            raise ValidationError("include_popular_traits must be a boolean")

        # Validate trait_keys if present
        trait_keys = data.get("trait_keys")
        if trait_keys is not None:
            if not isinstance(trait_keys, list):
                raise ValidationError("trait_keys must be a list")

            if len(trait_keys) > 50:
                raise ValidationError(
                    "trait_keys cannot contain more than 50 items"
                )

            for idx, key in enumerate(trait_keys):
                if not isinstance(key, str):
                    raise ValidationError(f"trait_keys[{idx}] must be a string")

                if len(key) > 100:
                    raise ValidationError(
                        f"trait_keys[{idx}] exceeds maximum length of 100 characters"
                    )

        return data
