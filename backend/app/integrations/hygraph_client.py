from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import httpx
import logging

from app.config import get_settings

from app.utils.redis_client import get_cache, set_cache
from app.cms.hygraph_queries import HYGRAPH_COURSES_QUERY, HYGRAPH_PRACTICE_SETS_QUERY

logger = logging.getLogger(__name__)


def _normalise_text(value: Any) -> Optional[str]:

    if value is None:
        return None
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, dict):
        return value.get("markdown") or value.get("html") or None
    return str(value) if value else None


def _extract_asset_url(value: Any) -> Optional[str]:

    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("url")
    return None


def _convert_hygraph_course_to_document(course: Dict[str, Any]) -> Dict[str, Any]:

    slug = course.get("slug") or course.get("id")

    modules = []
    for module in course.get("courseModules", []):
        module_items = []
        for item in module.get("moduleItems", []):
            raw_content = item.get("content")
            content_value = None
            if raw_content and isinstance(raw_content, dict):
                content_value = raw_content.get("markdown")

            video_data = item.get("video")
            video_payload = None
            if video_data and isinstance(video_data, dict):
                video_payload = {
                    "fileName": video_data.get("fileName"),
                    "url": video_data.get("url"),
                }

            module_items.append(
                {
                    "id": item.get("id"),
                    "title": item.get("title", ""),
                    "description": item.get("description"),
                    "content": content_value,
                    "video": video_payload,
                }
            )

        assessment = module.get("assessment")
        assessment_payload = None
        if assessment and isinstance(assessment, dict):
            questions = assessment.get("assessmentQuestions") or []
            if questions:
                serialized_questions = []
                for q in questions:
                    prompt = q.get("prompt")
                    prompt_md = ""
                    if isinstance(prompt, dict):
                        prompt_md = prompt.get("markdown") or ""

                    explanation = q.get("explanation")
                    explanation_md = ""
                    if isinstance(explanation, dict):
                        explanation_md = explanation.get("markdown") or ""

                    opts = []
                    for opt in q.get("options") or []:
                        opts.append(
                            {
                                "text": opt.get("text", ""),
                                "isCorrect": bool(opt.get("isCorrect")),
                            }
                        )

                    serialized_questions.append(
                        {
                            "prompt": {"markdown": prompt_md},
                            "explanation": {"markdown": explanation_md},
                            "options": opts,
                        }
                    )

                assessment_payload = {"assessmentQuestions": serialized_questions}

        modules.append(
            {
                "id": module.get("id"),
                "slug": module.get("slug"),
                "title": module.get("title", ""),
                "duration": module.get("duration"),
                "description": _normalise_text(module.get("overview")),
                "items": module_items,
                "assessment": assessment_payload,
            }
        )

    outcomes = []
    for idx, outcome in enumerate(course.get("courseOutcome", []), start=1):
        outcomes.append(
            {
                "id": outcome.get("id") or f"{slug}-outcome-{idx}",
                "text": outcome.get("outcome", ""),
            }
        )

    instructors = []
    for instructor in course.get("instructors", []):
        instructors.append(
            {
                "id": instructor.get("id"),
                "name": instructor.get("name", ""),
                "title": instructor.get("title"),
                "avatar": _extract_asset_url(instructor.get("avatar")),
            }
        )

    return {
        "id": course.get("id"),
        "slug": slug,
        "title": course.get("title", ""),
        "short_description": course.get("shortDescription"),
        "long_description": _normalise_text(course.get("longDescription")),
        "category": course.get("category"),
        "level": course.get("level"),
        "duration": course.get("duration"),
        "badge_label": course.get("badgeLabel"),
        "lessons": course.get("lessonsCount"),
        "image_url": _extract_asset_url(course.get("heroImage")),
        "modules": modules,
        "outcomes": outcomes,
        "instructors": instructors,
        "tags": [t.get("hashtag") for t in course.get("tags", []) if t.get("hashtag")],
    }


def _serialize_practice_set(doc: Dict[str, Any]) -> Dict[str, Any]:

    return {
        "id": str(doc.get("_id")) if doc.get("_id") else doc.get("id"),
        "slug": doc.get("slug"),
        "title": doc.get("title", ""),
        "description": doc.get("description"),
        "tag": doc.get("tag"),
        "questions": doc.get("questions"),
        "accuracy": doc.get("accuracy"),
        "trend": doc.get("trend"),
        "estimated_time": doc.get("estimatedTime") or doc.get("estimated_time"),
    }


class HygraphClient:

    def __init__(self):
        self.settings = get_settings()
        self.endpoint = self.settings.hygraph_endpoint
        self.token = self.settings.hygraph_token

    def execute_query(self, query: str) -> Optional[Dict[str, Any]]:

        if not self.endpoint or not self.token:
            logger.warning("Hygraph credentials not configured")
            return None

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}",
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    self.endpoint, json={"query": query}, headers=headers
                )
                response.raise_for_status()
                data = response.json()

                if "errors" in data:
                    logger.error(f"Hygraph query errors: {data['errors']}")
                    return None

                return data.get("data")

        except httpx.HTTPError as e:
            logger.error(f"Hygraph HTTP error: {e}")
            return None
        except Exception as e:
            logger.error(f"Hygraph query failed: {e}")
            return None

    def get_courses(self) -> Optional[List[Dict[str, Any]]]:

        cache_key = "hygraph:courses"

        cached_courses = get_cache(cache_key)
        if cached_courses:
            logger.info(f"✅ Returning {len(cached_courses)} cached courses from Redis")
            return cached_courses

        logger.info("📡 Fetching fresh courses from Hygraph...")
        data = self.execute_query(HYGRAPH_COURSES_QUERY)
        if not data or not data.get("courses"):
            logger.warning("⚠️  No courses returned from Hygraph")
            return None

        courses = [
            _convert_hygraph_course_to_document(course) for course in data["courses"]
        ]

        set_cache(cache_key, courses)
        logger.info(f"✅ Cached {len(courses)} courses in Redis")

        return courses

    def get_practice_sets(self) -> Optional[List[Dict[str, Any]]]:

        cache_key = "hygraph:practice_sets"

        cached_data = get_cache(cache_key)
        if cached_data:
            logger.info(
                f"✅ Returning {len(cached_data)} cached practice sets from Redis"
            )
            return cached_data

        logger.info("📡 Fetching fresh practice sets from Hygraph...")
        data = self.execute_query(HYGRAPH_PRACTICE_SETS_QUERY)
        if not data or "practiceSets" not in data:
            logger.warning("⚠️  No practice sets returned from Hygraph")
            return None

        practice_sets = [_serialize_practice_set(ps) for ps in data["practiceSets"]]

        set_cache(cache_key, practice_sets)
        logger.info(f"✅ Cached {len(practice_sets)} practice sets in Redis")

        return practice_sets

    def clear_cache(self):

        from app.utils.redis_client import clear_cache_pattern

        cleared = clear_cache_pattern("hygraph:*")
        logger.info(f"🧹 Hygraph cache cleared ({cleared} keys deleted)")
