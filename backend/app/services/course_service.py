from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import logging

from fastapi import HTTPException
from pymongo.errors import PyMongoError

from .common import (
    get_courses_collection,
    get_course_enrollments_collection,
)
from app.integrations.hygraph_client import HygraphClient
from app.repositories.course_repository import CourseRepository
from app.repositories.progress_repository import ProgressRepository
from app.serializers import CourseSerializer
from app.services import auth as auth_services
from app.services.email_service import EmailService
from app.config import get_settings

logger = logging.getLogger(__name__)


class CourseService:

    def __init__(
        self,
        course_repo: CourseRepository,
        progress_repo: ProgressRepository,
        hygraph_client: HygraphClient,
        serializer: CourseSerializer,
    ):
        self.course_repo = course_repo
        self.progress_repo = progress_repo
        self.hygraph_client = hygraph_client
        self.serializer = serializer

    def _serialize_course(
        self, doc: Dict[str, Any], include_details: bool = False
    ) -> Dict[str, Any]:

        slug = doc.get("slug") or doc.get("id") or str(doc.get("_id"))

        course = {
            "id": str(doc.get("_id")) if doc.get("_id") else doc.get("id"),
            "slug": slug,
            "title": doc.get("title", ""),
            "short_description": doc.get("short_description") or doc.get("description"),
            "long_description": doc.get("long_description"),
            "category": doc.get("category"),
            "level": doc.get("level"),
            "duration": doc.get("duration"),
            "badge_label": doc.get("badge_label"),
            "lessons": doc.get("lessons"),
            "students": doc.get("students"),
            "rating": doc.get("rating"),
            "image_url": doc.get("image_url"),
            "instructors": doc.get("instructors", []),
            "outcomes": doc.get("outcomes", []),
            "tags": (
                [t for t in doc.get("tags", []) if isinstance(t, str)]
                if doc.get("tags")
                else []
            ),
        }

        if include_details and doc.get("modules"):
            course["modules"] = doc["modules"]

        return course

    def _find_course_document(self, slug: str) -> Optional[Dict[str, Any]]:

        hygraph_courses = self.hygraph_client.get_courses()
        if hygraph_courses:
            for course in hygraph_courses:
                if course.get("slug") == slug or course.get("id") == slug:
                    return course

        collection = get_courses_collection()
        if collection is not None:
            return collection.find_one({"$or": [{"slug": slug}, {"id": slug}]})

        return None

    def _is_user_enrolled(self, user_id: str, course_slug: str) -> bool:

        collection = get_course_enrollments_collection()
        if collection is None:
            return False

        enrollment = collection.find_one(
            {"user_id": user_id, "course_slug": course_slug}
        )
        return enrollment is not None

    def list_courses(self, include_details: bool = False) -> List[Dict[str, Any]]:

        hygraph_courses = self.hygraph_client.get_courses()
        if hygraph_courses:
            logger.info("✅ Returning %d courses from Hygraph",
                        len(hygraph_courses))
            return [
                self._serialize_course(doc, include_details=include_details)
                for doc in hygraph_courses
            ]

        logger.warning("⚠️  No Hygraph courses, falling back to MongoDB")
        collection = get_courses_collection()
        if collection is None:
            logger.warning("⚠️  MongoDB collection not available")
            return []
        cursor = collection.find({}).sort("order", 1)
        courses = [
            self._serialize_course(doc, include_details=include_details)
            for doc in cursor
        ]
        return courses

    def get_course_detail(
        self, slug: str, user_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:

        doc = self._find_course_document(slug)
        if not doc:
            return None
        serialized = self._serialize_course(doc, include_details=True)
        course_slug = serialized.get("slug", slug)
        if user_id:
            serialized["enrolled"] = self._is_user_enrolled(
                user_id, course_slug)

        return serialized

    def enroll_user_in_course(self, user_id: str, course_slug: str) -> bool:

        if self._is_user_enrolled(user_id, course_slug):
            logger.info(f"User {user_id} already enrolled in {course_slug}")
            return True

        collection = get_course_enrollments_collection()
        if collection is None:
            raise HTTPException(
                status_code=500, detail="Enrollment service not available"
            )

        try:
            now = datetime.now(timezone.utc)
            collection.update_one(
                {"user_id": user_id, "course_slug": course_slug},
                {
                    "$set": {
                        "user_id": user_id,
                        "course_slug": course_slug,
                        "enrolled_at": now,
                    }
                },
                upsert=True,
            )
        except PyMongoError as exc:
            raise HTTPException(
                status_code=500, detail=f"Failed to enroll: {exc}"
            ) from exc

        try:
            user_profile = auth_services.get_user_by_id(user_id)
            course = self.get_course_detail(course_slug)

            if user_profile and course:
                user_email = user_profile.get("email", "")
                user_name = (
                    user_profile.get("full_name")
                    or user_profile.get("email", "").split("@")[0]
                )
                course_title = course.get("title", course_slug)

                logger.info(f"Sending enrollment email to: {user_email}")

                if user_email:
                    # Instantiate EmailService
                    email_service = EmailService(settings=get_settings())
                    email_sent = email_service.send_enrollment_email(
                        user_email, user_name, course_title, course_slug
                    )
                    logger.info(f"Email send result: {email_sent}")
                else:
                    logger.warning("No email address found for user")
            else:
                logger.warning(
                    f"Missing user_profile or course. user_profile: {user_profile is not None}, course: {course is not None}"
                )
        except Exception as email_error:
            logger.warning(f"Failed to send enrollment email: {email_error}")
            logger.exception(email_error)

        return True

    def list_user_enrollments(self, user_id: str) -> List[str]:

        collection = get_course_enrollments_collection()
        if collection is None:
            return []

        cursor = collection.find({"user_id": user_id})
        return [doc.get("course_slug") for doc in cursor if doc.get("course_slug")]
