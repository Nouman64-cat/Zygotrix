"""Routes powering University (courses & practice) APIs."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..schema.auth import UserProfile
from ..schema.university import (
    CourseDetailResponse,
    CourseListResponse,
    CourseProgressResponse,
    CourseProgressUpdateRequest,
    DashboardSummaryResponse,
    PracticeSetListResponse,
)
from ..services import auth as auth_services
from ..services import university as university_services

router = APIRouter(prefix="/api/university", tags=["University"])

bearer_scheme_optional = HTTPBearer(auto_error=False)
bearer_scheme_required = HTTPBearer(auto_error=True)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme_optional),
) -> Optional[UserProfile]:
    if not credentials:
        return None
    try:
        user = auth_services.resolve_user_from_token(credentials.credentials)
        return UserProfile(**user)
    except Exception:
        return None


def get_current_user_required(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme_required),
) -> UserProfile:
    user = auth_services.resolve_user_from_token(credentials.credentials)
    return UserProfile(**user)


@router.get("/courses", response_model=CourseListResponse)
def list_courses(detail: bool = Query(False)) -> CourseListResponse:
    courses = university_services.list_courses(include_details=detail)
    # When detail flag is False, drop heavy fields
    if not detail:
        for course in courses:
            course.pop("outcomes", None)
            course.pop("modules", None)
            course.pop("instructors", None)
            course.pop("long_description", None)
    return CourseListResponse(courses=courses)


@router.get("/courses/{slug}", response_model=CourseDetailResponse)
def get_course(slug: str) -> CourseDetailResponse:
    course = university_services.get_course_by_slug(slug)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseDetailResponse(course=course)


@router.get("/practice-sets", response_model=PracticeSetListResponse)
def list_practice_sets() -> PracticeSetListResponse:
    practice_sets = university_services.list_practice_sets()
    return PracticeSetListResponse(practice_sets=practice_sets)


@router.get("/dashboard", response_model=DashboardSummaryResponse)
def dashboard_summary(
    current_user: UserProfile = Depends(get_current_user_required),
) -> DashboardSummaryResponse:
    course_docs = {
        course["slug"]: course
        for course in university_services.list_courses(include_details=True)
    }
    summary = university_services.build_dashboard_summary(current_user.dict(), course_docs)
    return DashboardSummaryResponse(**summary)


@router.get("/progress/{course_slug}", response_model=CourseProgressResponse)
def get_progress(
    course_slug: str,
    current_user: UserProfile = Depends(get_current_user_required),
) -> CourseProgressResponse:
    progress = university_services.get_course_progress(current_user.id, course_slug)
    if not progress:
        return CourseProgressResponse(
            user_id=current_user.id,
            course_slug=course_slug,
            progress=0,
            modules=[],
            metrics=None,
            insights=[],
            resources=[],
            schedule=[],
        )
    return CourseProgressResponse(**progress)


@router.put("/progress", response_model=CourseProgressResponse)
def update_progress(
    payload: CourseProgressUpdateRequest,
    current_user: UserProfile = Depends(get_current_user_required),
) -> CourseProgressResponse:
    data = payload.dict(exclude_none=True)
    progress = university_services.save_course_progress(current_user.id, data)
    return CourseProgressResponse(**progress)
