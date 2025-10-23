"""Pydantic models for University (courses & practice) API."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, conint, confloat


class InstructorModel(BaseModel):
    id: Optional[str] = None
    name: str
    title: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None


class CourseOutcomeModel(BaseModel):
    id: Optional[str] = None
    text: str


class VideoModel(BaseModel):
    fileName: Optional[str] = None
    url: Optional[str] = None


class CourseModuleItemModel(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    video: Optional[VideoModel] = None


class CourseModuleModel(BaseModel):
    id: Optional[str] = None
    title: str
    duration: Optional[str] = None
    description: Optional[str] = None
    items: List[CourseModuleItemModel] = Field(default_factory=list)


class PracticeAnswerModel(BaseModel):
    label: Optional[str] = None
    body: Optional[str] = None
    is_correct: bool = False


class PracticeQuestionModel(BaseModel):
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    prompt: Optional[str] = None
    answers: List[PracticeAnswerModel] = Field(default_factory=list)
    correct_answer: PracticeAnswerModel = Field(default_factory=PracticeAnswerModel)


class PracticeSetModel(BaseModel):
    id: str
    slug: Optional[str] = None
    title: str
    description: Optional[str] = None
    questions: List[PracticeQuestionModel] = Field(default_factory=list)


class CourseSummaryModel(BaseModel):
    id: str
    slug: str
    title: str
    short_description: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    duration: Optional[str] = None
    badge_label: Optional[str] = None
    lessons: Optional[int] = None
    students: Optional[int] = None
    rating: Optional[float] = None
    image_url: Optional[str] = None
    instructors: List[InstructorModel] = Field(default_factory=list)
    outcomes: List[CourseOutcomeModel] = Field(default_factory=list)
    modules_count: Optional[int] = None  # For browse view (detail=false)


class CourseDetailModel(CourseSummaryModel):
    long_description: Optional[str] = None
    outcomes: List[CourseOutcomeModel] = Field(default_factory=list)
    modules: List[CourseModuleModel] = Field(default_factory=list)
    instructors: List[InstructorModel] = Field(default_factory=list)
    enrolled: bool = False
    content_locked: bool = False
    practice_sets: List[PracticeSetModel] = Field(default_factory=list)


class CourseListResponse(BaseModel):
    courses: List[CourseSummaryModel]


class CourseDetailResponse(BaseModel):
    course: CourseDetailModel


class PracticeSetSummaryModel(BaseModel):
    id: str
    slug: str
    title: str
    description: Optional[str] = None
    tag: Optional[str] = None
    questions: Optional[int] = None
    accuracy: Optional[int] = Field(default=None, ge=0, le=100)
    trend: Optional[str] = Field(default=None, pattern="^(up|down)$")
    estimated_time: Optional[str] = None


class PracticeSetListResponse(BaseModel):
    practice_sets: List[PracticeSetSummaryModel]


class DashboardStatModel(BaseModel):
    id: str
    label: str
    value: str
    change: float = 0.0
    timeframe: str


class PracticeInsightModel(BaseModel):
    id: str
    title: str
    delta: float
    description: Optional[str] = None


class DashboardResourceModel(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    link: Optional[str] = None


class LearningEventModel(BaseModel):
    id: str
    title: str
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    type: Optional[str] = Field(default=None, pattern="^(live|async|deadline)$")
    course_slug: Optional[str] = None


class CourseProgressModuleModel(BaseModel):
    module_id: str
    title: Optional[str] = None
    status: str = Field(
        default="in-progress", pattern="^(locked|in-progress|completed)$"
    )
    duration: Optional[str] = None
    completion: conint(ge=0, le=100) = 0


class CourseProgressMetricsModel(BaseModel):
    hours_spent: Optional[confloat(ge=0)] = None
    practice_accuracy: Optional[confloat(ge=0, le=100)] = None
    mcq_attempts: Optional[int] = None
    last_score: Optional[confloat(ge=0, le=100)] = None
    streak: Optional[int] = None


class DashboardCourseOverviewModel(BaseModel):
    course_slug: str
    title: str
    instructor: Optional[str] = None
    next_session: Optional[str] = None
    progress: conint(ge=0, le=100) = 0
    level: Optional[str] = None
    category: Optional[str] = None
    metrics: Optional[CourseProgressMetricsModel] = None
    modules: List[CourseProgressModuleModel] = Field(default_factory=list)


class LearnerProfileModel(BaseModel):
    user_id: str
    name: str
    role: Optional[str] = None
    cohort: Optional[str] = None
    avatar: Optional[str] = None
    streak: int = 0
    xp: int = 0
    next_badge: Optional[str] = None


class DashboardSummaryResponse(BaseModel):
    profile: LearnerProfileModel
    courses: List[DashboardCourseOverviewModel]
    stats: List[DashboardStatModel]
    insights: List[PracticeInsightModel]
    resources: List[DashboardResourceModel]
    schedule: List[LearningEventModel]


class CourseProgressResponse(BaseModel):
    user_id: str
    course_slug: str
    progress: conint(ge=0, le=100) = 0
    modules: List[CourseProgressModuleModel] = Field(default_factory=list)
    metrics: Optional[CourseProgressMetricsModel] = None
    next_session: Optional[str] = None
    updated_at: Optional[datetime] = None
    insights: List[PracticeInsightModel] = Field(default_factory=list)
    resources: List[DashboardResourceModel] = Field(default_factory=list)
    schedule: List[LearningEventModel] = Field(default_factory=list)


class CourseProgressUpdateRequest(BaseModel):
    course_slug: str = Field(..., min_length=1)
    progress: Optional[conint(ge=0, le=100)] = None
    modules: Optional[List[CourseProgressModuleModel]] = None
    metrics: Optional[CourseProgressMetricsModel] = None
    next_session: Optional[str] = None


class CourseEnrollmentRequest(BaseModel):
    course_slug: str = Field(..., min_length=1)


class CourseEnrollmentResponse(BaseModel):
    message: str
    enrolled: bool
