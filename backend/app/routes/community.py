"""Community API routes for questions and answers."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..schema.community import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionDetailResponse,
    QuestionListResponse,
    AnswerCreate,
    AnswerUpdate,
    AnswerResponse,
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    VoteRequest,
    MessageResponse,
)
from ..schema.auth import UserProfile
from ..services import community as services
from ..services import auth as auth_services

router = APIRouter(prefix="/api/community", tags=["Community"])

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[UserProfile]:
    """Get current user if authenticated, otherwise None."""
    if not credentials:
        return None
    try:
        user = auth_services.resolve_user_from_token(credentials.credentials)
        return UserProfile(**user)
    except Exception:
        return None


def get_current_user_required(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=True)),
) -> UserProfile:
    """Get current user (required for protected endpoints)."""
    user = auth_services.resolve_user_from_token(credentials.credentials)
    return UserProfile(**user)


# Question routes


@router.get("/questions", response_model=QuestionListResponse)
def list_questions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("newest", regex="^(newest|oldest|most_voted|most_viewed|most_answered)$"),
    tag: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[UserProfile] = Depends(get_current_user_optional),
):
    """List all questions with pagination and filtering. Public access."""
    user_id = current_user.id if current_user else None
    result = services.list_questions(
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        tag=tag,
        search=search,
        user_id=user_id,
    )
    return QuestionListResponse(**result)


@router.post("/questions", response_model=QuestionResponse, status_code=201)
def create_question(
    payload: QuestionCreate,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Create a new question. Requires authentication."""
    question_id = services.create_question(
        title=payload.title,
        content=payload.content,
        tags=payload.tags,
        author_id=current_user.id,
        author_email=current_user.email,
        author_name=current_user.full_name,
        image_url=payload.image_url,
        image_thumbnail_url=payload.image_thumbnail_url,
    )
    
    question = services.get_question(question_id, current_user.id, increment_view=False)
    if not question:
        raise HTTPException(status_code=500, detail="Failed to create question")
    
    return QuestionResponse(**question)


@router.get("/questions/{question_id}", response_model=QuestionDetailResponse)
def get_question(
    question_id: str,
    current_user: Optional[UserProfile] = Depends(get_current_user_optional),
):
    """Get a question with all its answers. Public access."""
    user_id = current_user.id if current_user else None
    
    question = services.get_question(question_id, user_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    answers = services.get_answers_for_question(question_id, user_id)
    answers_response = [AnswerResponse(**a) for a in answers]
    
    comments = services.get_question_comments(question_id, user_id)
    comments_response = [CommentResponse(**c) for c in comments]
    
    return QuestionDetailResponse(**question, answers=answers_response, comments=comments_response)


@router.put("/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: str,
    payload: QuestionUpdate,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Update a question. Only the author can update."""
    success = services.update_question(
        question_id=question_id,
        author_id=current_user.id,
        title=payload.title,
        content=payload.content,
        tags=payload.tags,
        image_url=payload.image_url,
        image_thumbnail_url=payload.image_thumbnail_url,
    )
    
    if not success:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own questions"
        )
    
    question = services.get_question(question_id, current_user.id, increment_view=False)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return QuestionResponse(**question)


@router.delete("/questions/{question_id}", response_model=MessageResponse)
def delete_question(
    question_id: str,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Delete a question. Only the author can delete."""
    success = services.delete_question(question_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own questions"
        )
    
    return MessageResponse(message="Question deleted successfully")


@router.post("/questions/{question_id}/vote", response_model=MessageResponse)
def vote_on_question(
    question_id: str,
    payload: VoteRequest,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Vote on a question. Requires authentication."""
    success = services.vote_question(question_id, current_user.id, payload.vote_type)
    
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return MessageResponse(message="Vote recorded successfully")


# Answer routes


@router.post("/questions/{question_id}/answers", response_model=AnswerResponse, status_code=201)
def create_answer(
    question_id: str,
    payload: AnswerCreate,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Create an answer to a question. Requires authentication."""
    answer_id = services.create_answer(
        question_id=question_id,
        content=payload.content,
        author_id=current_user.id,
        author_email=current_user.email,
        author_name=current_user.full_name,
    )
    
    if not answer_id:
        raise HTTPException(status_code=404, detail="Question not found")
    
    answers = services.get_answers_for_question(question_id, current_user.id)
    answer = next((a for a in answers if a["id"] == answer_id), None)
    
    if not answer:
        raise HTTPException(status_code=500, detail="Failed to create answer")
    
    return AnswerResponse(**answer)


@router.put("/answers/{answer_id}", response_model=MessageResponse)
def update_answer(
    answer_id: str,
    payload: AnswerUpdate,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Update an answer. Only the author can update."""
    success = services.update_answer(
        answer_id=answer_id,
        author_id=current_user.id,
        content=payload.content,
    )
    
    if not success:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own answers"
        )
    
    return MessageResponse(message="Answer updated successfully")


@router.delete("/answers/{answer_id}", response_model=MessageResponse)
def delete_answer(
    answer_id: str,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Delete an answer. Only the author can delete."""
    success = services.delete_answer(answer_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own answers"
        )
    
    return MessageResponse(message="Answer deleted successfully")


@router.post("/questions/{question_id}/answers/{answer_id}/accept", response_model=MessageResponse)
def accept_answer(
    question_id: str,
    answer_id: str,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Accept an answer. Only the question author can accept."""
    success = services.accept_answer(question_id, answer_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=403,
            detail="Only the question author can accept answers"
        )
    
    return MessageResponse(message="Answer accepted successfully")


@router.post("/answers/{answer_id}/vote", response_model=MessageResponse)
def vote_on_answer(
    answer_id: str,
    payload: VoteRequest,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Vote on an answer. Requires authentication."""
    success = services.vote_answer(answer_id, current_user.id, payload.vote_type)
    
    if not success:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    return MessageResponse(message="Vote recorded successfully")


# Comment routes

@router.post("/questions/{question_id}/comments", response_model=CommentResponse)
def create_comment(
    question_id: str,
    payload: CommentCreate,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Add a comment to a question. Requires authentication."""
    comment_id = services.create_comment(
        question_id=question_id,
        content=payload.content,
        author_id=current_user.id,
        author_email=current_user.email,
        author_name=current_user.full_name,
    )
    
    comments = services.get_question_comments(question_id, current_user.id)
    comment = next((c for c in comments if c["id"] == comment_id), None)
    
    if not comment:
        raise HTTPException(status_code=500, detail="Failed to create comment")
    
    return CommentResponse(**comment)


@router.get("/questions/{question_id}/comments", response_model=list[CommentResponse])
def get_question_comments(
    question_id: str,
    current_user: Optional[UserProfile] = Depends(get_current_user_optional),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get comments for a question. Public access."""
    user_id = current_user.id if current_user else None
    comments = services.get_question_comments(question_id, user_id, limit, offset)
    return [CommentResponse(**c) for c in comments]


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: str,
    payload: CommentUpdate,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Update a comment. Only the author can update."""
    success = services.update_comment(comment_id, payload.content, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
    
    # Get the updated comment
    db = services._get_db()
    settings = services.get_settings()
    comment = db[settings.mongodb_comments_collection].find_one({"_id": services.ObjectId(comment_id)})
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return CommentResponse(**services._comment_to_dict(comment, current_user.id))


@router.delete("/comments/{comment_id}", response_model=MessageResponse)
def delete_comment(
    comment_id: str,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Delete a comment. Only the author can delete."""
    success = services.delete_comment(comment_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
    
    return MessageResponse(message="Comment deleted successfully")


@router.post("/comments/{comment_id}/vote", response_model=MessageResponse)
def vote_on_comment(
    comment_id: str,
    payload: VoteRequest,
    current_user: UserProfile = Depends(get_current_user_required),
):
    """Vote on a comment. Requires authentication."""
    success = services.vote_comment(comment_id, current_user.id, payload.vote_type)
    
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return MessageResponse(message="Vote recorded successfully")


@router.get("/tags", response_model=list)
def get_popular_tags(limit: int = Query(20, ge=1, le=100)):
    """Get popular tags. Public access."""
    return services.get_popular_tags(limit)
