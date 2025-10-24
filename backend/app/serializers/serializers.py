"""Serializers for transforming data between formats."""

from typing import Any, Dict, List, Optional
from datetime import datetime


class DataSerializer:
    """Base serializer with common utilities."""

    @staticmethod
    def serialize_datetime(value: Any) -> Optional[datetime]:
        """Convert various datetime formats to datetime object."""
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

    @staticmethod
    def normalize_text(value: Any) -> Optional[str]:
        """Normalize text from various formats."""
        if value is None:
            return None
        if isinstance(value, str):
            return value.strip() or None
        if isinstance(value, dict):
            # Handle {markdown: "..."} or {html: "..."}
            return value.get("markdown") or value.get("html") or None
        return str(value) if value else None

    @staticmethod
    def extract_asset_url(value: Any) -> Optional[str]:
        """Extract URL from asset object or return URL string."""
        if value is None:
            return None
        if isinstance(value, str):
            return value
        if isinstance(value, dict):
            return value.get("url")
        return None


class CourseSerializer:
    """Serializes course data for API responses."""

    def __init__(self):
        self.base = DataSerializer()

    def serialize_course(
        self, doc: Dict[str, Any], include_details: bool = False
    ) -> Dict[str, Any]:
        """
        Serialize a course document for API response.

        Args:
            doc: Course document from database or Hygraph
            include_details: Whether to include full module details
        """
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
        }

        # Serialize instructors
        course["instructors"] = self._serialize_instructors(doc.get("instructors", []))

        # Serialize outcomes
        course["outcomes"] = self._serialize_outcomes(doc.get("outcomes", []), slug)

        # Include detailed modules if requested
        if include_details:
            course["modules"] = self._serialize_modules(doc.get("modules", []), slug)

        return course

    def _serialize_instructors(
        self, instructors: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Serialize instructor data."""
        result = []
        for instructor in instructors:
            result.append(
                {
                    "id": instructor.get("id") or instructor.get("email"),
                    "name": instructor.get("name", ""),
                    "title": instructor.get("title"),
                    "avatar": instructor.get("avatar"),
                    "bio": instructor.get("bio"),
                }
            )
        return result

    def _serialize_outcomes(
        self, outcomes: List[Any], slug: str
    ) -> List[Dict[str, Any]]:
        """Serialize course outcomes."""
        result = []
        for idx, outcome in enumerate(outcomes, start=1):
            if isinstance(outcome, dict):
                result.append(
                    {
                        "id": outcome.get("id") or f"{slug}-outcome-{idx}",
                        "text": outcome.get("text") or outcome.get("description", ""),
                    }
                )
            else:
                result.append({"id": f"{slug}-outcome-{idx}", "text": str(outcome)})
        return result

    def _serialize_modules(
        self, modules: List[Dict[str, Any]], course_slug: str
    ) -> List[Dict[str, Any]]:
        """Serialize course modules with items and assessments."""
        result = []

        for midx, module in enumerate(modules, start=1):
            module_id = module.get("id") or f"{course_slug}-module-{midx}"

            # Serialize module items
            items = self._serialize_module_items(module.get("items", []), module_id)

            # Serialize assessment
            assessment = self._serialize_assessment(module.get("assessment"))

            result.append(
                {
                    "id": module_id,
                    "title": module.get("title", ""),
                    "duration": module.get("duration"),
                    "description": module.get("description"),
                    "items": items,
                    "assessment": assessment,
                }
            )

        return result

    def _serialize_module_items(
        self, items: List[Dict[str, Any]], module_id: str
    ) -> List[Dict[str, Any]]:
        """Serialize module items (lessons)."""
        result = []

        for iidx, item in enumerate(items, start=1):
            if not isinstance(item, dict):
                continue

            # Extract content
            raw_content = item.get("content")
            if isinstance(raw_content, dict):
                content_value = raw_content.get("markdown") or raw_content.get("html")
            else:
                content_value = raw_content

            # Extract video data
            video_data = item.get("video")
            video_payload = None
            if video_data and isinstance(video_data, dict):
                video_payload = {
                    "fileName": video_data.get("fileName"),
                    "url": video_data.get("url"),
                }

            result.append(
                {
                    "id": item.get("id") or f"{module_id}-item-{iidx}",
                    "title": item.get("title", ""),
                    "description": item.get("description"),
                    "content": content_value,
                    "video": video_payload,
                }
            )

        return result

    def _serialize_assessment(self, assessment: Any) -> Optional[Dict[str, Any]]:
        """Serialize module assessment."""
        if not assessment or not isinstance(assessment, dict):
            return None

        questions = (
            assessment.get("assessment_questions")
            or assessment.get("assessmentQuestions")
            or []
        )

        if not questions:
            return None

        serialized_questions = []
        for q in questions:
            # Normalize prompt
            prompt = q.get("prompt")
            if isinstance(prompt, dict):
                prompt_md = (
                    prompt.get("markdown")
                    or prompt.get("text")
                    or self.base.normalize_text(prompt)
                )
            else:
                prompt_md = self.base.normalize_text(prompt)

            # Normalize explanation
            explanation = q.get("explanation")
            if isinstance(explanation, dict):
                explanation_md = (
                    explanation.get("markdown")
                    or explanation.get("text")
                    or self.base.normalize_text(explanation)
                )
            else:
                explanation_md = self.base.normalize_text(explanation)

            # Normalize options
            opts = []
            for opt in q.get("options") or []:
                if isinstance(opt, dict):
                    text = (
                        opt.get("text")
                        or self.base.normalize_text(opt.get("body"))
                        or self.base.normalize_text(opt)
                    )
                    is_corr = opt.get("is_correct") or opt.get("isCorrect")
                else:
                    text = self.base.normalize_text(opt)
                    is_corr = None

                opts.append(
                    {
                        "text": text,
                        "isCorrect": bool(is_corr) if is_corr is not None else None,
                    }
                )

            serialized_questions.append(
                {
                    "prompt": {"markdown": prompt_md or ""},
                    "explanation": {"markdown": explanation_md or ""},
                    "options": opts,
                }
            )

        return (
            {"assessmentQuestions": serialized_questions}
            if serialized_questions
            else None
        )


class ProgressSerializer:
    """Serializes progress data for API responses."""

    def __init__(self):
        self.base = DataSerializer()

    def serialize_progress(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Serialize a progress document for API response."""
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
                    "assessment_status": module.get("assessment_status"),
                    "best_score": module.get("best_score"),
                    "attempt_count": module.get("attempt_count"),
                    "items": items_payload,
                }
            )

        # Serialize metrics
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

        updated_at = self.base.serialize_datetime(doc.get("updated_at"))

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
        }
