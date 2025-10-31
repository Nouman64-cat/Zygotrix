from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4
import logging
from datetime import datetime, timezone

from app.services.course_service import CourseService
from app.services.progress_service import ProgressService
from app.services.common import get_course_progress_collection

logger = logging.getLogger(__name__)


class DashboardService:

    def __init__(
        self,
        course_service: CourseService,
        progress_service: ProgressService,
    ):
        self.course_service = course_service
        self.progress_service = progress_service
        self.progress_collection = get_course_progress_collection()

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

    def _aggregate_metrics(
        self, progress_docs: List[Dict[str, Any]]
    ) -> Tuple[float, float]:

        total_hours = 0.0
        accuracy_sum = 0.0
        accuracy_count = 0

        for doc in progress_docs:
            metrics = doc.get("metrics") or {}

            hours = metrics.get("hours_spent", 0)
            if isinstance(hours, (int, float)) and hours > 0:
                total_hours += float(hours)

            accuracy = metrics.get("practice_accuracy")
            if isinstance(accuracy, (int, float)) and 0 <= accuracy <= 100:
                accuracy_sum += float(accuracy)
                accuracy_count += 1

        avg_accuracy = accuracy_sum / accuracy_count if accuracy_count > 0 else 0.0
        return total_hours, avg_accuracy

    def build_dashboard_summary(
        self,
        user_profile: Dict[str, Any],
    ) -> Dict[str, Any]:

        user_id = user_profile["id"]

        course_docs_list = self.course_service.list_courses(include_details=True)
        course_docs = {course["slug"]: course for course in course_docs_list}

        enrolled_slugs = set(self.course_service.list_user_enrollments(user_id))

        progress_docs = []
        if self.progress_collection is not None:
            progress_docs = list(self.progress_collection.find({"user_id": user_id}))

        serialized_progress = [
            self.progress_service._serialize_progress_doc(doc) for doc in progress_docs
        ]

        courses = []
        all_insights = []
        all_resources = []
        all_schedule = []
        streak = 0
        xp_total = 0

        for progress in serialized_progress:
            course_slug = progress["course_slug"]
            course = course_docs.get(course_slug)
            title = course["title"] if course else course_slug
            instructor = None
            if course and course.get("instructors"):
                instructor = course["instructors"][0]["name"]

            enrolled_slugs.discard(course_slug)

            metrics = progress.get("metrics") or {}
            if metrics.get("streak"):
                streak = max(streak, metrics["streak"])
            if metrics.get("mcq_attempts"):
                xp_total += int(metrics["mcq_attempts"]) * 10

            courses.append(
                {
                    "course_slug": course_slug,
                    "title": title,
                    "instructor": instructor,
                    "next_session": progress.get("next_session"),
                    "progress": progress.get("progress", 0),
                    "level": course.get("level") if course else None,
                    "category": course.get("category") if course else None,
                    "metrics": metrics or None,
                    "modules": progress.get("modules", []),
                    "image_url": course.get("image_url") if course else None,
                }
            )

            for insight in progress.get("insights", []):
                all_insights.append(
                    {
                        "id": insight.get("id") or str(uuid4()),
                        "title": insight.get("title", ""),
                        "delta": insight.get("delta", 0),
                        "description": insight.get("description"),
                    }
                )

            for resource in progress.get("resources", []):
                all_resources.append(
                    {
                        "id": resource.get("id") or str(uuid4()),
                        "title": resource.get("title", ""),
                        "description": resource.get("description"),
                        "type": resource.get("type"),
                        "link": resource.get("link"),
                    }
                )

            for event in progress.get("schedule", []):
                all_schedule.append(
                    {
                        "id": event.get("id") or str(uuid4()),
                        "title": event.get("title", ""),
                        "start": self._serialize_datetime(event.get("start")),
                        "end": self._serialize_datetime(event.get("end")),
                        "type": event.get("type"),
                        "course_slug": course_slug,
                    }
                )

        for slug in enrolled_slugs:
            course = course_docs.get(slug)
            if not course:
                continue
            modules_payload = []
            for module in course.get("modules", []):
                items_payload = []
                for item in module.get("items", []):
                    items_payload.append(
                        {
                            "module_item_id": item.get("id") or str(uuid4()),
                            "title": item.get("title"),
                            "completed": False,
                        }
                    )
                modules_payload.append(
                    {
                        "module_id": module.get("id") or str(uuid4()),
                        "title": module.get("title"),
                        "status": "locked",
                        "duration": module.get("duration"),
                        "completion": 0,
                        "items": items_payload,
                    }
                )
            instructor = None
            if course.get("instructors"):
                instructor = course["instructors"][0].get("name")
            courses.append(
                {
                    "course_slug": slug,
                    "title": course.get("title", slug),
                    "instructor": instructor,
                    "next_session": None,
                    "progress": 0,
                    "level": course.get("level"),
                    "category": course.get("category"),
                    "metrics": None,
                    "modules": modules_payload,
                    "image_url": course.get("image_url"),
                }
            )

        total_hours, avg_accuracy = self._aggregate_metrics(progress_docs)
        avg_progress = (
            sum(progress.get("progress", 0) for progress in serialized_progress)
            / len(serialized_progress)
            if serialized_progress
            else 0.0
        )

        stats = [
            {
                "id": "stat-learning-hours",
                "label": "Weekly learning hours",
                "value": f"{total_hours:.1f}h",
                "change": 0.0,
                "timeframe": "vs last week",
            },
            {
                "id": "stat-mcq-accuracy",
                "label": "MCQ accuracy",
                "value": f"{avg_accuracy:.0f}%",
                "change": 0.0,
                "timeframe": "last 30 attempts",
            },
            {
                "id": "stat-readiness",
                "label": "Simulation readiness",
                "value": f"{avg_progress:.0f}%",
                "change": 0.0,
                "timeframe": "active courses",
            },
        ]

        profile = {
            "user_id": user_id,
            "name": user_profile.get("full_name") or user_profile.get("email"),
            "role": user_profile.get("role"),
            "cohort": user_profile.get("cohort"),
            "avatar": user_profile.get("avatar"),
            "streak": streak,
            "xp": xp_total,
            "next_badge": user_profile.get("next_badge"),
        }

        return {
            "profile": profile,
            "courses": courses,
            "stats": stats,
            "insights": all_insights,
            "resources": all_resources,
            "schedule": all_schedule,
        }
