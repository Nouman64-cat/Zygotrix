"""Community feature schemas for questions and answers."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class QuestionCreate(BaseModel):
    """Schema for creating a new question."""

    title: str = Field(..., min_length=10, max_length=200, description="Question title")
    content: str = Field(..., min_length=20, description="Question details/body")
    tags: List[str] = Field(default_factory=list, description="Question tags (max 5)")
    image_url: Optional[str] = Field(None, description="Optional image URL for the question")
    image_thumbnail_url: Optional[str] = Field(
        None, description="Optional thumbnail image URL for the question"
    )

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        if len(v) > 5:
            raise ValueError("Maximum 5 tags allowed")
        return v


class QuestionUpdate(BaseModel):
    """Schema for updating a question."""

    title: Optional[str] = Field(None, min_length=10, max_length=200)
    content: Optional[str] = Field(None, min_length=20)
    tags: Optional[List[str]] = None
    image_url: Optional[str] = Field(None, description="Optional image URL for the question")
    image_thumbnail_url: Optional[str] = Field(
        None, description="Optional thumbnail image URL for the question"
    )

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None and len(v) > 5:
            raise ValueError("Maximum 5 tags allowed")
        return v


class AnswerCreate(BaseModel):
    """Schema for creating an answer."""

    content: str = Field(..., min_length=10, description="Answer content")


class AnswerUpdate(BaseModel):
    """Schema for updating an answer."""

    content: str = Field(..., min_length=10, description="Answer content")


class CommentCreate(BaseModel):
    """Schema for creating a comment."""

    content: str = Field(..., min_length=1, max_length=500, description="Comment content")
    parent_id: Optional[str] = Field(None, description="Parent comment ID for replies")


class CommentUpdate(BaseModel):
    """Schema for updating a comment."""

    content: str = Field(..., min_length=1, max_length=500, description="Comment content")


class VoteRequest(BaseModel):
    """Schema for voting on a question or answer."""

    vote_type: int = Field(..., ge=-1, le=1, description="Vote type: 1 for upvote, -1 for downvote, 0 to remove vote")


class AuthorInfo(BaseModel):
    """Information about the author of a question or answer."""

    id: str
    email: str
    full_name: Optional[str] = None


class AnswerResponse(BaseModel):
    """Schema for answer response."""

    id: str
    question_id: str
    content: str
    author: AuthorInfo
    upvotes: int = 0
    downvotes: int = 0
    is_accepted: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_vote: Optional[int] = None  # User's vote on this answer (-1, 0, 1)


class CommentResponse(BaseModel):
    """Schema for comment response."""

    id: str
    question_id: str
    content: str
    author: AuthorInfo
    upvotes: int = 0
    downvotes: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_vote: Optional[int] = None  # User's vote on this comment (-1, 0, 1)
    parent_id: Optional[str] = None  # Parent comment ID for replies
    replies: List['CommentResponse'] = Field(default_factory=list, description="Nested replies")


class QuestionResponse(BaseModel):
    """Schema for question response."""

    id: str
    title: str
    content: str
    tags: List[str] = []
    author: AuthorInfo
    upvotes: int = 0
    downvotes: int = 0
    view_count: int = 0
    answer_count: int = 0
    comment_count: int = 0
    image_url: Optional[str] = None
    image_thumbnail_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_vote: Optional[int] = None  # User's vote on this question (-1, 0, 1)


class QuestionDetailResponse(QuestionResponse):
    """Schema for detailed question response with answers and comments."""

    answers: List[AnswerResponse] = []
    comments: List[CommentResponse] = []


class QuestionListResponse(BaseModel):
    """Schema for paginated question list."""

    questions: List[QuestionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


# Resolve forward references
CommentResponse.model_rebuild()
