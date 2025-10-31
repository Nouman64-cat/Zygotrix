from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import logging
import re

from fastapi import HTTPException
from pymongo.errors import PyMongoError

from .common import (
    ensure_utc,
    get_assessment_attempts_collection,
    get_course_progress_collection,
)
from app.repositories.assessment_repository import AssessmentRepository

from app.services.course_service import CourseService

logger = logging.getLogger(__name__)


class AssessmentService:

    def __init__(self):
        self.repo = AssessmentRepository()
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

    def _find_module_and_questions(
        self, course_slug: str, module_id: str, user_id: str
    ) -> List[Dict[str, Any]]:

        course_service = self._get_course_service()
        course = course_service.get_course_detail(course_slug, user_id=None)
        if not course or not isinstance(course, dict):
            raise HTTPException(
                status_code=404, detail="Course not found for assessment"
            )

        modules = course.get("modules") or []
        target_module = next((m for m in modules if m.get("id") == module_id), None)

        if target_module is None:
            logger.warning(f"⚠️ Module not found by ID, trying progress lookup...")
            try:
                progress_collection = get_course_progress_collection()
                progress = progress_collection.find_one(
                    {"user_id": user_id, "course_slug": course_slug}
                )

                progress_module = None
                if progress and isinstance(progress, dict):
                    for pm in progress.get("modules", []):
                        if pm.get("moduleId") == module_id:
                            progress_module = pm
                            break
                if progress_module:
                    title = progress_module.get("title")
                    logger.info(f"🔍 Progress module title: {title}")
                    if title:
                        target_module = next(
                            (m for m in modules if m.get("title") == title), None
                        )
            except Exception as lookup_err:
                logger.warning(
                    f"⚠️ Fallback module lookup by title failed: {lookup_err}"
                )

        if target_module is None and isinstance(module_id, str):
            try:
                slug_core = re.sub(r"^module-\d+-", "", module_id)
                slug_title = slug_core.replace("-", " ").replace("_", " ").lower()
                logger.info(f"🔍 Normalized slug: '{slug_title}'")

                def norm(s: str) -> str:
                    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()

                norm_slug = norm(slug_title)

                for m in modules:
                    module_title = str(m.get("title", ""))
                    norm_title = norm(module_title)
                    logger.info(
                        f"  Comparing '{norm_slug}' with '{norm_title}' ({module_title})"
                    )
                    if norm_title == norm_slug:
                        target_module = m
                        break
            except Exception as lookup_err2:
                logger.warning(
                    f"⚠️ Heuristic module lookup from slug failed: {lookup_err2}"
                )

        if target_module is None:
            logger.warning(
                f"⚠️ Using last-resort: first module with assessment questions"
            )
            with_questions = [
                m
                for m in modules
                if isinstance(m.get("assessment"), dict)
                and (
                    (m["assessment"].get("assessmentQuestions") or [])
                    or (m["assessment"].get("assessment_questions") or [])
                )
            ]
            if with_questions:
                target_module = with_questions[0]

        questions: List[Dict[str, Any]] = []
        if target_module:
            assessment = target_module.get("assessment") or {}
            questions = (
                assessment.get("assessmentQuestions")
                or assessment.get("assessment_questions")
                or []
            )
            logger.info(
                f"📝 Extracted {len(questions)} questions from module '{target_module.get('title')}'"
            )
        else:
            logger.error(f"❌ No module found for module_id: {module_id}")

        if len(questions) == 0:
            logger.error(f"❌ CRITICAL: No questions found! Module lookup failed.")
            logger.error(f"   module_id={module_id}, target_module={target_module}")
            logger.error(
                f"   This will result in 0% score. Investigate module matching logic."
            )

        return questions

    def get_assessment_history(
        self, user_id: str, course_slug: str, module_id: str
    ) -> List[Dict[str, Any]]:

        collection = get_assessment_attempts_collection()
        if collection is None:
            return []

        cursor = collection.find(
            {"user_id": user_id, "course_slug": course_slug, "module_id": module_id}
        ).sort("attempt_number", -1)

        attempts = []
        for doc in cursor:
            attempt_obj = {
                "id": str(doc.get("_id")),
                "user_id": doc.get("user_id"),
                "course_slug": doc.get("course_slug"),
                "module_id": doc.get("module_id"),
                "attempt_number": doc.get("attempt_number", 1),
                "score": doc.get("score", 0),
                "passed": doc.get("passed", False),
                "completed_at": self._serialize_datetime(doc.get("submitted_at")),
                "answers": doc.get("answers", []),
                "total_questions": doc.get("total_questions", 0),
            }
            attempts.append(attempt_obj)

        return attempts

    def submit_assessment(
        self,
        user_id: str,
        course_slug: str,
        module_id: str,
        answers: List[Dict[str, Any]],
    ) -> Dict[str, Any]:

        questions = self._find_module_and_questions(course_slug, module_id, user_id)

        score = 0
        total = len(questions)
        results = []

        for i, question in enumerate(questions):
            user_answer = next(
                (a for a in answers if a.get("question_index") == i), None
            )
            correct_option_index = next(
                (
                    j
                    for j, opt in enumerate(question.get("options", []))
                    if opt.get("isCorrect")
                ),
                -1,
            )

            is_correct = False
            selected_index = None

            if user_answer:
                selected_index = user_answer.get("selected_option_index")
                if selected_index == correct_option_index:
                    is_correct = True
                    score += 1

            results.append(
                {
                    "question_index": i,
                    "selected_option_index": selected_index,
                    "is_correct": is_correct,
                    "correct_option_index": correct_option_index,
                    "explanation": (question.get("explanation") or {}).get(
                        "markdown", ""
                    ),
                }
            )

        percentage = (score / total * 100) if total > 0 else 0
        passed = percentage >= 70.0

        attempts_collection = get_assessment_attempts_collection()
        progress_collection = get_course_progress_collection()
        if attempts_collection is None or progress_collection is None:
            raise HTTPException(
                status_code=500, detail="Database service not available"
            )

        try:
            now = datetime.now(timezone.utc)

            last_attempt = attempts_collection.find_one(
                {
                    "user_id": user_id,
                    "course_slug": course_slug,
                    "module_id": module_id,
                },
                sort=[("attempt_number", -1)],
            )
            attempt_number = (
                (last_attempt.get("attempt_number", 0) + 1) if last_attempt else 1
            )

            attempt_doc_to_save = {
                "user_id": user_id,
                "course_slug": course_slug,
                "module_id": module_id,
                "attempt_number": attempt_number,
                "score": percentage,
                "passed": passed,
                "answers": results,
                "total_questions": total,
                "completed_at": now,
                "submitted_at": now,
            }

            insert_result = attempts_collection.insert_one(attempt_doc_to_save)

            full_attempt_object = {
                **attempt_doc_to_save,
                "id": str(insert_result.inserted_id),
            }
            full_attempt_object.pop("submitted_at", None)

            progress_doc = progress_collection.find_one(
                {"user_id": user_id, "course_slug": course_slug}
            )

            if progress_doc:
                current_best = 0
                modules_progress = progress_doc.get("modules", [])

                for mod in modules_progress:
                    if mod.get("module_id") == module_id:
                        current_best = mod.get("best_score", 0)
                        break

                best_score = max(current_best, percentage)

                progress_collection.update_one(
                    {
                        "user_id": user_id,
                        "course_slug": course_slug,
                        "modules.module_id": module_id,
                    },
                    {
                        "$set": {
                            "modules.$.assessment_status": (
                                "passed" if passed else "failed"
                            ),
                            "modules.$.best_score": best_score,
                        },
                        "$inc": {"modules.$.attempt_count": 1},
                    },
                )

        except PyMongoError as e:
            logger.error(f"Failed to save assessment attempt: {e}")
            raise HTTPException(status_code=500, detail="Failed to save assessment")

        return {
            "score": percentage,
            "passed": passed,
            "total_questions": total,
            "correct_answers": score,
            "results": results,
            "attempt": full_attempt_object,
        }
