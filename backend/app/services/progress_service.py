from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import logging

from fastapi import HTTPException
from pymongo.errors import PyMongoError

from .common import (
    ensure_utc,
    get_course_progress_collection,
)
from app.repositories.progress_repository import ProgressRepository
from app.repositories.course_repository import CourseRepository
from app.serializers import ProgressSerializer
from app.services import auth as auth_services

from app.services.course_service import CourseService

logger = logging.getLogger(__name__)


class ProgressService:

    def __init__(
        self,
        progress_repo: ProgressRepository,
        course_repo: CourseRepository,
        serializer: ProgressSerializer,
    ):
        self.progress_repo = progress_repo
        self.course_repo = course_repo
        self.serializer = serializer
        self.course_service = None

    def _get_course_service(self) -> CourseService:

        if self.course_service:
            return self.course_service

        from .service_factory import get_service_factory

        _factory = get_service_factory()
        self.course_service = _factory.get_course_service()
        return self.course_service

    def _serialize_datetime(self, value: Any) -> Optional[datetime]:

        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                return None
        return None

    def _serialize_progress_doc(self, doc: Dict[str, Any]) -> Dict[str, Any]:

        modules = []
        for module in doc.get("modules", []):
            items_payload = []
            for item in module.get("items", []):
                items_payload.append(
                    {
                        "module_item_id": item.get("module_item_id"),
                        "title": item.get("title"),
                        "completed": bool(item.get("completed")),
                    }
                )

            modules.append(
                {
                    "module_id": module.get("module_id"),
                    "title": module.get("title"),
                    "status": module.get("status", "in-progress"),
                    "duration": module.get("duration"),
                    "completion": module.get("completion", 0),
                    "assessment_status": module.get("assessment_status")
                    or "not_started",
                    "best_score": module.get("best_score"),
                    "attempt_count": module.get("attempt_count"),
                    "items": items_payload,
                }
            )

        metrics = doc.get("metrics") or {}
        metrics_payload = None
        if metrics:
            metrics_payload = {
                "hours_spent": metrics.get("hours_spent"),
                "practice_accuracy": metrics.get("practice_accuracy"),
                "mcq_attempts": metrics.get("mcq_attempts"),
                "last_score": metrics.get("last_score"),
                "streak": metrics.get("streak"),
            }

        updated_at = self._serialize_datetime(doc.get("updated_at"))

        return {
            "user_id": doc.get("user_id"),
            "course_slug": doc.get("course_slug"),
            "progress": doc.get("progress", 0),
            "modules": modules,
            "metrics": metrics_payload,
            "next_session": doc.get("next_session"),
            "updated_at": updated_at,
            "insights": doc.get("insights") or [],
            "resources": doc.get("resources") or [],
            "schedule": doc.get("schedule") or [],
            "completed": doc.get("completed", False),
            "completed_at": self._serialize_datetime(doc.get("completed_at")),
            "certificate_issued": doc.get("certificate_issued", False),
        }

    def get_course_progress(
        self, user_id: str, course_slug: str
    ) -> Optional[Dict[str, Any]]:

        collection = get_course_progress_collection()
        if collection is None:
            return None

        progress_doc = collection.find_one(
            {"user_id": user_id, "course_slug": course_slug}
        )

        if not progress_doc:
            return None

        return self._serialize_progress_doc(progress_doc)

    def save_course_progress(
        self, user_id: str, payload: Dict[str, Any]
    ) -> Dict[str, Any]:

        collection = get_course_progress_collection()
        if collection is None:
            raise HTTPException(
                status_code=500, detail="Progress collection not available"
            )

        course_slug = payload.get("course_slug")
        if not course_slug:
            raise HTTPException(status_code=400, detail="course_slug is required")

        try:
            now = datetime.now(timezone.utc)
            payload["updated_at"] = now

            result = collection.update_one(
                {"user_id": user_id, "course_slug": course_slug},
                {"$set": payload},
                upsert=True,
            )

            if result.upserted_id:
                logger.info(f"Created new progress for {user_id} in {course_slug}")
            else:
                logger.info(f"Updated progress for {user_id} in {course_slug}")

            return self.get_course_progress(user_id, course_slug) or {}

        except PyMongoError as exc:
            logger.error(f"Failed to save progress: {exc}")
            raise HTTPException(
                status_code=500, detail=f"Failed to save progress: {exc}"
            ) from exc

    def generate_certificate(self, user_id: str, course_slug: str) -> Dict[str, Any]:

        course_service = self._get_course_service()
        course = course_service.get_course_detail(course_slug)

        if not course:
            logger.error(f"❌ CERT ERROR: Course not found - {course_slug}")
            raise HTTPException(status_code=404, detail="Course not found")

        progress_collection = get_course_progress_collection()
        if progress_collection is None:
            logger.error(f"❌ CERT ERROR: Database connection failed")
            raise HTTPException(status_code=500, detail="Database connection failed")

        progress_doc = progress_collection.find_one(
            {"user_id": user_id, "course_slug": course_slug}
        )

        if not progress_doc:
            logger.error(
                f"❌ CERT ERROR: No progress found for user {user_id} in course {course_slug}"
            )
            raise HTTPException(
                status_code=404,
                detail="Course progress not found. Please enroll first.",
            )

        total_items = 0
        completed_items = 0
        all_assessments_passed = True

        modules = progress_doc.get("modules", [])
        course_modules = course.get("modules", [])

        for module_progress in modules:
            module_id = module_progress.get("module_id")
            logger.info(f"🔍 CERT: Processing module {module_id}")

            course_module = next(
                (
                    m
                    for m in course_modules
                    if m.get("slug") == module_id
                    or m.get("id") == module_id
                    or str(m.get("slug")).lower() == str(module_id).lower()
                    or str(m.get("id")).lower() == str(module_id).lower()
                ),
                None,
            )

            if not course_module:
                logger.warning(
                    f"⚠️ CERT: Module {module_id} not found in course structure, skipping"
                )
                continue

            module_items = course_module.get("items", [])
            logger.info(f"📝 CERT: Module has {len(module_items)} lesson items")
            total_items += len(module_items)

            items_progress = module_progress.get("items", [])
            completed_count = sum(
                1 for item in items_progress if item.get("completed", False)
            )
            completed_items += completed_count

            if len(module_items) == 0:
                module_completion = module_progress.get("completion", 0)
                logger.info(
                    f"📦 CERT: Module has 0 lessons, completion: {module_completion}%"
                )
                if module_completion == 100:
                    total_items += 1
                    completed_items += 1

            course_has_assessment = course_module.get("assessment") is not None
            if course_has_assessment:
                assessment_obj = course_module.get("assessment", {})
                assessment_questions = (
                    assessment_obj.get("assessmentQuestions", [])
                    if isinstance(assessment_obj, dict)
                    else []
                )

                if assessment_questions and len(assessment_questions) > 0:
                    total_items += 1
                    assessment_status = module_progress.get("assessment_status")

                    if assessment_status == "passed":
                        completed_items += 1
                    else:
                        all_assessments_passed = False
                        logger.warning(
                            f"⚠️ CERT: Assessment NOT passed (status: {assessment_status})"
                        )
            else:
                logger.info(f"ℹ️ CERT: Module has no assessment")

        completion_percentage = (
            int((completed_items / total_items * 100)) if total_items > 0 else 0
        )

        if completion_percentage < 100 or not all_assessments_passed:
            logger.error(
                f"❌ CERT DENIED: Completion {completion_percentage}%, Assessments passed: {all_assessments_passed}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Course not fully completed. Progress: {completion_percentage}%. All assessments must be passed.",
            )

        now = datetime.now(timezone.utc)

        update_result = progress_collection.update_one(
            {"user_id": user_id, "course_slug": course_slug},
            {
                "$set": {
                    "completed": True,
                    "completed_at": now,
                    "certificate_issued": True,
                    "updated_at": now,
                }
            },
        )

        if update_result.modified_count == 0:
            logger.warning(f"⚠️ CERT: No document updated when marking course complete")
        else:
            logger.info(f"✅ CERT: Course marked as completed in database")

        try:
            user_data = auth_services.get_user_by_id(user_id)
            user_name = user_data.get("full_name") or user_data.get("name") or "Student"
        except Exception as e:
            logger.warning(f"⚠️ CERT: Failed to get user profile: {e}")
            user_name = "Student"

        return {
            "user_name": user_name,
            "course_name": course.get("title", "Course"),
            "course_slug": course_slug,
            "completed_at": now,
            "completion_percentage": completion_percentage,
        }
