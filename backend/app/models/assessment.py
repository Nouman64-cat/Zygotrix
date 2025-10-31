from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class AssessmentOption(BaseModel):

    text: str = Field(..., description="Option text")
    is_correct: bool = Field(
        ..., alias="isCorrect", description="Whether this is the correct answer"
    )

    class Config:
        populate_by_name = True
        json_schema_extra = {"example": {"text": "Python", "isCorrect": True}}


class AssessmentQuestion(BaseModel):

    prompt: str = Field(..., description="Question prompt in markdown")
    explanation: str = Field(..., description="Explanation in markdown")
    options: List[AssessmentOption] = Field(..., description="Answer options")

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "What is the best programming language?",
                "explanation": "Python is widely used for AI and data science.",
                "options": [
                    {"text": "Python", "isCorrect": True},
                    {"text": "JavaScript", "isCorrect": False},
                ],
            }
        }


class Assessment(BaseModel):

    assessment_questions: List[AssessmentQuestion] = Field(
        ..., alias="assessmentQuestions", description="List of assessment questions"
    )

    class Config:
        populate_by_name = True


class AssessmentAttempt(BaseModel):

    id: str = Field(..., description="Unique attempt ID")
    user_id: str = Field(..., description="User ID")
    course_slug: str = Field(..., description="Course slug")
    module_id: str = Field(..., description="Module ID")
    attempt_number: int = Field(..., ge=1, description="Attempt number")
    answers: List[dict] = Field(..., description="User's answers")
    score: float = Field(..., ge=0, le=100, description="Score percentage")
    total_questions: int = Field(..., ge=1, description="Total questions")
    passed: bool = Field(..., description="Whether the user passed")
    completed_at: datetime = Field(..., description="Completion timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "attempt-123",
                "user_id": "user-456",
                "course_slug": "intro-ai",
                "module_id": "module-1",
                "attempt_number": 1,
                "answers": [],
                "score": 85.0,
                "total_questions": 10,
                "passed": True,
                "completed_at": "2025-10-24T12:00:00Z",
            }
        }
