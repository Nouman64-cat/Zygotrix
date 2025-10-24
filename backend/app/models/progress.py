"""Course progress data models."""

from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class ModuleItem(BaseModel):
    """Progress for a single module item/lesson."""

    module_item_id: str = Field(..., description="Item ID")
    title: Optional[str] = Field(None, description="Item title")
    completed: bool = Field(False, description="Whether completed")


class ModuleProgress(BaseModel):
    """Progress for a single module."""

    module_id: str = Field(..., description="Module ID")
    title: Optional[str] = Field(None, description="Module title")
    status: Literal["locked", "in-progress", "completed"] = Field(
        "in-progress", description="Module status"
    )
    duration: Optional[str] = Field(None, description="Module duration")
    completion: float = Field(0, ge=0, le=100, description="Completion percentage")

    # Assessment-related fields
    assessment_status: Optional[Literal["not_started", "attempted", "passed"]] = Field(
        None, description="Assessment completion status"
    )
    best_score: Optional[float] = Field(
        None, ge=0, le=100, description="Best assessment score"
    )
    attempt_count: Optional[int] = Field(None, ge=0, description="Number of attempts")

    items: List[ModuleItem] = Field(default_factory=list, description="Module items")

    class Config:
        json_schema_extra = {
            "example": {
                "module_id": "module-1",
                "title": "Introduction",
                "status": "in-progress",
                "duration": "2 weeks",
                "completion": 50.0,
                "assessment_status": "passed",
                "best_score": 95.0,
                "attempt_count": 2,
                "items": [],
            }
        }


class ProgressMetrics(BaseModel):
    """Learning metrics."""

    hours_spent: Optional[float] = Field(None, ge=0, description="Hours spent")
    practice_accuracy: Optional[float] = Field(
        None, ge=0, le=100, description="Practice accuracy"
    )
    mcq_attempts: Optional[int] = Field(None, ge=0, description="MCQ attempts")
    last_score: Optional[float] = Field(None, ge=0, le=100, description="Last score")
    streak: Optional[int] = Field(None, ge=0, description="Current streak")


class CourseProgress(BaseModel):
    """User's progress in a course."""

    user_id: str = Field(..., description="User ID")
    course_slug: str = Field(..., description="Course slug")
    enrolled_at: datetime = Field(..., description="Enrollment timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    modules: List[ModuleProgress] = Field(
        default_factory=list, description="Module progress"
    )
    metrics: Optional[ProgressMetrics] = Field(None, description="Learning metrics")

    next_session: Optional[str] = Field(None, description="Next session date")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user-123",
                "course_slug": "intro-ai",
                "enrolled_at": "2025-10-01T00:00:00Z",
                "updated_at": "2025-10-24T12:00:00Z",
                "modules": [],
                "metrics": None,
                "next_session": None,
            }
        }
