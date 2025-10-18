"""Service layer for University (courses, practice, progress) features."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

import httpx
import logging
from fastapi import HTTPException
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.config import get_settings
from .common import (
    ensure_utc,
    get_course_progress_collection,
    get_courses_collection,
    get_practice_sets_collection,
    get_course_enrollments_collection,
)


logger = logging.getLogger(__name__)

_HYGRAPH_CACHE_TTL_SECONDS = 300
_hygraph_course_cache: Optional[Tuple[datetime, List[Dict[str, Any]]]] = None
_hygraph_practice_cache: Optional[Tuple[datetime, List[Dict[str, Any]]]] = None

HYGRAPH_COURSES_QUERY = """
  query UniversityCourses {
    courses {
      id
      slug
      title
      shortDescription
      longDescription {
        markdown
      }
      category
      level
      duration
      badgeLabel
      lessonsCount
      heroImage {
        url
      }
      courseOutcome {
        id
        outcome
      }
      courseModules(orderBy: order_ASC) {
        id
        title
        duration
        overview {
          markdown
        }
        slug
        order
        moduleItems {
          id
          title
          description
        }
      }
      instructors {
        id
        title
        slug
        speciality
        avatar {
          url
        }
      }
    }
  }
"""

HYGRAPH_PRACTICE_SETS_QUERY = """
  query UniversityPracticeSets {
    practiceSets {
      id
      slug
      title
      description
      tag
      questions
      accuracy
      trend
      estimatedTime
    }
  }
"""


def _serialize_datetime(value: Any) -> Optional[datetime]:
    dt = ensure_utc(value)
    return dt


def _normalise_text(value: Any) -> Optional[str]:
    if isinstance(value, dict):
        return (
            value.get("text")
            or value.get("markdown")
            or value.get("html")
            or value.get("raw")
        )
    if value is None:
        return None
    return str(value)


def _extract_asset_url(value: Any) -> Optional[str]:
    if isinstance(value, dict):
        return value.get("url") or value.get("src")
    return value


def _execute_hygraph_query(query: str) -> Optional[Dict[str, Any]]:
    settings = get_settings()
    if not settings.hygraph_endpoint or not settings.hygraph_token:
        return None

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.hygraph_token}",
    }

    try:
        response = httpx.post(
            settings.hygraph_endpoint,
            json={"query": query},
            headers=headers,
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Hygraph request failed: %s", exc)
        return None

    payload = response.json()
    if "errors" in payload:
        logger.warning("Hygraph returned errors: %s", payload["errors"])
        return None
    return payload.get("data")


def _convert_hygraph_course_to_document(course: Dict[str, Any]) -> Dict[str, Any]:
    course_slug = course.get("slug") or course.get("id") or "course"
    image_field = course.get("heroImage")
    instructors_payload = []
    for instructor in course.get("instructors") or []:
        slug = instructor.get("slug") or instructor.get("id") or ""
        formatted_name = slug.replace("-", " ").title() if slug else None
        instructors_payload.append(
            {
                "id": instructor.get("id") or slug,
                "name": formatted_name,
                "title": instructor.get("title"),
                "bio": instructor.get("speciality"),
                "avatar": _extract_asset_url(instructor.get("avatar")),
            }
        )

    modules_payload = []
    for idx, module in enumerate(course.get("courseModules") or []):
        module_slug = module.get("slug") or module.get("id") or f"{course_slug}-module-{idx}"
        items_payload = []
        for item_idx, item in enumerate(module.get("moduleItems") or []):
            item_id = item.get("id") or f"{module_slug}-item-{item_idx}"
            items_payload.append(
                {
                    "id": item_id,
                    "title": item.get("title"),
                    "description": _normalise_text(item.get("description")),
                }
            )
        modules_payload.append(
            {
                "id": module_slug,
                "title": module.get("title"),
                "duration": module.get("duration"),
                "description": _normalise_text(module.get("overview")),
                "items": items_payload,
                "order": module.get("order"),
            }
        )

    outcomes_payload = []
    for outcome in course.get("courseOutcome") or []:
        outcomes_payload.append(
            {
                "id": outcome.get("id"),
                "text": _normalise_text(outcome.get("outcome")),
            }
        )

    long_description = course.get("longDescription")
    if isinstance(long_description, dict):
        long_description = long_description.get("markdown")

    return {
        "_id": course.get("id"),
        "id": course.get("id"),
        "slug": course.get("slug"),
        "title": course.get("title"),
        "short_description": _normalise_text(course.get("shortDescription")),
        "long_description": _normalise_text(long_description),
        "category": course.get("category"),
        "level": course.get("level"),
        "duration": course.get("duration"),
        "badge_label": course.get("badgeLabel"),
        "lessons": course.get("lessonsCount"),
        "students": None,
        "rating": None,
        "image_url": _extract_asset_url(image_field),
        "outcomes": outcomes_payload,
        "modules": modules_payload,
        "instructors": instructors_payload,
    }


def _convert_hygraph_practice_set_to_document(practice: Dict[str, Any]) -> Dict[str, Any]:
    trend = practice.get("trend")
    if isinstance(trend, str):
        trend = trend.lower()
    return {
        "_id": practice.get("id"),
        "id": practice.get("id"),
        "slug": practice.get("slug"),
        "title": practice.get("title"),
        "description": _normalise_text(practice.get("description")),
        "tag": practice.get("tag"),
        "questions": practice.get("questions"),
        "accuracy": practice.get("accuracy"),
        "trend": trend,
        "estimated_time": practice.get("estimatedTime"),
    }


def _get_courses_from_hygraph() -> Optional[List[Dict[str, Any]]]:
    global _hygraph_course_cache
    now = datetime.now(timezone.utc)
    if (
        _hygraph_course_cache
        and (now - _hygraph_course_cache[0]).total_seconds() < _HYGRAPH_CACHE_TTL_SECONDS
    ):
        return _hygraph_course_cache[1]

    data = _execute_hygraph_query(HYGRAPH_COURSES_QUERY)
    if not data:
        return None

    courses_raw = data.get("courses") or []
    converted = [_convert_hygraph_course_to_document(course) for course in courses_raw]
    _hygraph_course_cache = (now, converted)
    return converted


def _get_practice_sets_from_hygraph() -> Optional[List[Dict[str, Any]]]:
    global _hygraph_practice_cache
    now = datetime.now(timezone.utc)
    if (
        _hygraph_practice_cache
        and (now - _hygraph_practice_cache[0]).total_seconds() < _HYGRAPH_CACHE_TTL_SECONDS
    ):
        return _hygraph_practice_cache[1]

    data = _execute_hygraph_query(HYGRAPH_PRACTICE_SETS_QUERY)
    if not data:
        return None

    practice_raw = data.get("practiceSets") or []
    converted = [_convert_hygraph_practice_set_to_document(item) for item in practice_raw]
    _hygraph_practice_cache = (now, converted)
    return converted


def _find_course_document(slug: str) -> Optional[Dict[str, Any]]:
    hygraph_courses = _get_courses_from_hygraph()
    if hygraph_courses:
        for course in hygraph_courses:
            if course.get("slug") == slug or course.get("id") == slug:
                return course

    collection = get_courses_collection()
    if collection is None:
        return None
    doc = collection.find_one({"slug": slug})
    if doc:
        return doc
    return None


def _is_user_enrolled(user_id: str, course_slug: str) -> bool:
    collection = get_course_enrollments_collection()
    if collection is None:
        return False
    return collection.find_one({"user_id": user_id, "course_slug": course_slug}) is not None


def enroll_user_in_course(user_id: str, course_slug: str) -> bool:
    collection = get_course_enrollments_collection(required=True)
    now = datetime.now(timezone.utc)
    get_course = _find_course_document(course_slug)
    if not get_course:
        raise HTTPException(status_code=404, detail="Course not found")

    try:
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
        raise HTTPException(status_code=500, detail=f"Failed to enroll: {exc}") from exc
    return True


def _serialize_course(
    doc: Dict[str, Any], include_details: bool = False
) -> Dict[str, Any]:
    slug = doc.get("slug") or doc.get("id") or str(doc.get("_id"))
    course = {
        "id": str(doc.get("_id")),
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

    if include_details:
        outcomes = []
        for idx, outcome in enumerate(doc.get("outcomes", []), start=1):
            if isinstance(outcome, dict):
                outcomes.append(
                    {
                        "id": outcome.get("id") or f"{slug}-outcome-{idx}",
                        "text": outcome.get("text") or outcome.get("description", ""),
                    }
                )
            else:
                outcomes.append(
                    {"id": f"{slug}-outcome-{idx}", "text": str(outcome)}
                )

        modules = []
        for midx, module in enumerate(doc.get("modules", []), start=1):
            module_id = module.get("id") or f"{slug}-module-{midx}"
            items = []
            for iidx, item in enumerate(module.get("items", []), start=1):
                if isinstance(item, dict):
                    items.append(
                        {
                            "id": item.get("id") or f"{module_id}-item-{iidx}",
                            "title": item.get("title", ""),
                            "description": item.get("description"),
                        }
                    )
                else:
                    items.append(
                        {
                            "id": f"{module_id}-item-{iidx}",
                            "title": str(item),
                            "description": None,
                        }
                    )

            modules.append(
                {
                    "id": module_id,
                    "title": module.get("title", ""),
                    "duration": module.get("duration"),
                    "description": module.get("description"),
                    "items": items,
                }
            )

        instructors = []
        for instructor in doc.get("instructors", []):
            instructors.append(
                {
                    "id": instructor.get("id") or instructor.get("email"),
                    "name": instructor.get("name", ""),
                    "title": instructor.get("title"),
                    "avatar": instructor.get("avatar"),
                    "bio": instructor.get("bio"),
                }
            )

        course["outcomes"] = outcomes
        course["modules"] = modules
        course["instructors"] = instructors

    return course


def _serialize_practice_set(doc: Dict[str, Any]) -> Dict[str, Any]:
    slug = doc.get("slug") or doc.get("id") or str(doc.get("_id"))
    return {
        "id": str(doc.get("_id")),
        "slug": slug,
        "title": doc.get("title", ""),
        "description": doc.get("description"),
        "tag": doc.get("tag"),
        "questions": doc.get("questions"),
        "accuracy": doc.get("accuracy"),
        "trend": doc.get("trend"),
        "estimated_time": doc.get("estimated_time"),
    }


def list_courses(include_details: bool = False) -> List[Dict[str, Any]]:
    hygraph_courses = _get_courses_from_hygraph()
    if hygraph_courses:
        return [_serialize_course(doc, include_details=include_details) for doc in hygraph_courses]

    collection = get_courses_collection()
    if collection is None:
        return []
    cursor = collection.find({}).sort("order", 1)
    return [_serialize_course(doc, include_details=include_details) for doc in cursor]


def get_course_detail(slug: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    doc = _find_course_document(slug)
    if not doc:
        return None

    serialized = _serialize_course(doc, include_details=True)
    course_slug = serialized.get("slug", slug)
    enrolled = bool(user_id and _is_user_enrolled(user_id, course_slug))

    serialized["enrolled"] = enrolled
    serialized["content_locked"] = not enrolled

    if not enrolled:
        serialized["modules"] = []
        serialized["outcomes"] = []

    return serialized


def list_practice_sets() -> List[Dict[str, Any]]:
    hygraph_sets = _get_practice_sets_from_hygraph()
    if hygraph_sets:
        return [_serialize_practice_set(doc) for doc in hygraph_sets]

    collection = get_practice_sets_collection()
    if collection is None:
        return []
    cursor = collection.find({}).sort("order", 1)
    return [_serialize_practice_set(doc) for doc in cursor]


def _get_progress_collection(required: bool = False) -> Collection:
    collection = get_course_progress_collection(required=required)
    if collection is None:
        raise HTTPException(status_code=503, detail="Course progress store unavailable.")
    return collection


def get_course_progress(user_id: str, course_slug: str) -> Optional[Dict[str, Any]]:
    if not _is_user_enrolled(user_id, course_slug):
        raise HTTPException(status_code=403, detail="Course not enrolled")
    collection = get_course_progress_collection()
    if collection is None:
        return None
    doc = collection.find_one({"user_id": user_id, "course_slug": course_slug})
    if not doc:
        course_doc = _find_course_document(course_slug)
        if not course_doc:
            return None
        modules_payload = []
        for module in course_doc.get("modules", []):
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
        return {
            "user_id": user_id,
            "course_slug": course_slug,
            "progress": 0,
            "modules": modules_payload,
            "metrics": None,
            "next_session": None,
            "updated_at": None,
            "insights": [],
            "resources": [],
            "schedule": [],
        }
    return _serialize_progress_doc(doc)


def _serialize_progress_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
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

    updated_at = _serialize_datetime(doc.get("updated_at"))

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


def save_course_progress(
    user_id: str, payload: Dict[str, Any]
) -> Dict[str, Any]:
    course_slug = payload.get("course_slug")
    if not course_slug:
        raise HTTPException(status_code=400, detail="course_slug is required.")

    progress_update: Dict[str, Any] = {}
    if "progress" in payload and payload["progress"] is not None:
        progress_update["progress"] = max(0, min(100, int(payload["progress"])))
    if "modules" in payload and payload["modules"] is not None:
        modules_input = []
        for module in payload["modules"]:
            module_id = module.get("module_id")
            if not module_id:
                continue
            items_input = module.get("items") or []
            items_payload = []
            completed_items = 0
            total_items = 0
            for item in items_input:
                item_id = item.get("module_item_id") or item.get("id")
                if not item_id:
                    continue
                completed = bool(item.get("completed"))
                items_payload.append(
                    {
                        "module_item_id": item_id,
                        "title": item.get("title"),
                        "completed": completed,
                    }
                )
                total_items += 1
                if completed:
                    completed_items += 1
            completion = module.get("completion")
            if completion is None and total_items:
                completion = int(round((completed_items / total_items) * 100))
            if completion is None:
                completion = 0
            completion = max(0, min(100, int(completion)))
            status = module.get("status")
            if not status:
                if completion >= 100:
                    status = "completed"
                elif completion > 0:
                    status = "in-progress"
                else:
                    status = "locked"
            modules_input.append(
                {
                    "module_id": module_id,
                    "title": module.get("title"),
                    "status": status,
                    "duration": module.get("duration"),
                    "completion": completion,
                    "items": items_payload,
                }
            )
        if modules_input:
            progress_update["modules"] = modules_input
            if "progress" not in progress_update:
                progress_update["progress"] = int(
                    round(
                        sum(module["completion"] for module in modules_input)
                        / len(modules_input)
                    )
                )
    if "metrics" in payload and payload["metrics"] is not None:
        metrics = payload["metrics"]
        progress_update["metrics"] = {
            "hours_spent": metrics.get("hours_spent"),
            "practice_accuracy": metrics.get("practice_accuracy"),
            "mcq_attempts": metrics.get("mcq_attempts"),
            "last_score": metrics.get("last_score"),
            "streak": metrics.get("streak"),
        }
    if "next_session" in payload:
        progress_update["next_session"] = payload["next_session"]
    if "insights" in payload:
        progress_update["insights"] = payload["insights"]
    if "resources" in payload:
        progress_update["resources"] = payload["resources"]
    if "schedule" in payload:
        progress_update["schedule"] = payload["schedule"]

    now = datetime.now(timezone.utc)
    progress_update["updated_at"] = now
    progress_update.setdefault("created_at", now)

    if not _is_user_enrolled(user_id, course_slug):
        raise HTTPException(status_code=403, detail="Course not enrolled")

    collection = _get_progress_collection(required=True)
    try:
        collection.update_one(
            {"user_id": user_id, "course_slug": course_slug},
            {
                "$set": progress_update,
                "$setOnInsert": {
                    "user_id": user_id,
                    "course_slug": course_slug,
                    "created_at": now,
                },
            },
            upsert=True,
        )
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to persist progress: {exc}"
        ) from exc

    doc = collection.find_one({"user_id": user_id, "course_slug": course_slug})
    if not doc:
        raise HTTPException(status_code=500, detail="Unable to load updated progress.")
    return _serialize_progress_doc(doc)


def _aggregate_metrics(progress_docs: List[Dict[str, Any]]) -> Tuple[float, float]:
    total_hours = 0.0
    accuracy_values: List[float] = []
    for doc in progress_docs:
        metrics = doc.get("metrics") or {}
        hours = metrics.get("hours_spent")
        if isinstance(hours, (int, float)):
            total_hours += float(hours)
        accuracy = metrics.get("practice_accuracy")
        if isinstance(accuracy, (int, float)):
            accuracy_values.append(float(accuracy))
    avg_accuracy = sum(accuracy_values) / len(accuracy_values) if accuracy_values else 0.0
    return total_hours, avg_accuracy


def build_dashboard_summary(
    user_profile: Dict[str, Any],
    course_docs: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    user_id = user_profile["id"]
    enrolled_slugs = set(list_user_enrollments(user_id))
    collection = get_course_progress_collection()
    progress_docs = []
    if collection is not None:
        progress_docs = list(collection.find({"user_id": user_id}))

    serialized_progress = [_serialize_progress_doc(doc) for doc in progress_docs]

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
                    "start": _serialize_datetime(event.get("start")),
                    "end": _serialize_datetime(event.get("end")),
                    "type": event.get("type"),
                    "course_slug": course_slug,
                }
            )

    total_hours, avg_accuracy = _aggregate_metrics(progress_docs)
    avg_progress = (
        sum(progress.get("progress", 0) for progress in serialized_progress) / len(serialized_progress)
        if serialized_progress
        else 0.0
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
            }
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


def list_user_enrollments(user_id: str) -> List[str]:
    collection = get_course_enrollments_collection()
    if collection is None:
        return []
    docs = collection.find({"user_id": user_id})
    return [doc.get("course_slug") for doc in docs if doc.get("course_slug")]
