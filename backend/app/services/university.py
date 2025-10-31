from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import logging
from fastapi import HTTPException
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.services import auth as auth_services

from app.config import get_settings

from .service_factory import get_service_factory


logger = logging.getLogger(__name__)

_service_factory = get_service_factory()


def build_dashboard_summary(
    user_profile: Dict[str, Any],
) -> Dict[str, Any]:

    dashboard_service = _service_factory.get_dashboard_service()
    return dashboard_service.build_dashboard_summary(user_profile)


def list_courses(include_details: bool = False) -> List[Dict[str, Any]]:
    course_service = _service_factory.get_course_service()
    return course_service.list_courses(include_details=include_details)


def get_course_detail(
    slug: str, user_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    course_service = _service_factory.get_course_service()
    return course_service.get_course_detail(slug, user_id)


def enroll_user_in_course(user_id: str, course_slug: str) -> bool:
    course_service = _service_factory.get_course_service()
    return course_service.enroll_user_in_course(user_id, course_slug)


def list_user_enrollments(user_id: str) -> List[str]:
    course_service = _service_factory.get_course_service()
    return course_service.list_user_enrollments(user_id)


def get_course_progress(user_id: str, course_slug: str) -> Optional[Dict[str, Any]]:
    progress_service = _service_factory.get_progress_service()
    return progress_service.get_course_progress(user_id, course_slug)


def save_course_progress(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    progress_service = _service_factory.get_progress_service()
    return progress_service.save_course_progress(user_id, payload)


def generate_certificate(user_id: str, course_slug: str) -> Dict[str, Any]:
    progress_service = _service_factory.get_progress_service()
    return progress_service.generate_certificate(user_id, course_slug)


def submit_assessment(
    user_id: str, course_slug: str, module_id: str, answers: List[Dict[str, Any]]
) -> Dict[str, Any]:
    assessment_service = _service_factory.get_assessment_service()

    normalized_answers: List[Dict[str, Any]] = []
    for a in answers or []:
        if not isinstance(a, dict):
            continue
        if "question_index" in a or "selected_option_index" in a:
            normalized_answers.append(a)
        else:
            normalized_answers.append(
                {
                    "question_index": a.get("question_index", a.get("questionIndex")),
                    "selected_option_index": a.get(
                        "selected_option_index", a.get("selectedOptionIndex")
                    ),
                    "is_correct": a.get("is_correct", a.get("isCorrect")),
                }
            )

    return assessment_service.submit_assessment(
        user_id=user_id,
        course_slug=course_slug,
        module_id=module_id,
        answers=normalized_answers,
    )


def get_assessment_history(
    user_id: str, course_slug: str, module_id: str
) -> List[Dict[str, Any]]:
    assessment_service = _service_factory.get_assessment_service()
    return assessment_service.get_assessment_history(
        user_id=user_id,
        course_slug=course_slug,
        module_id=module_id,
    )
