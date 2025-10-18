"""Service layer for University (courses, practice, progress) features."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from fastapi import HTTPException
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from .common import (
    ensure_utc,
    get_course_progress_collection,
    get_courses_collection,
    get_practice_sets_collection,
)


def _serialize_datetime(value: Any) -> Optional[datetime]:
    dt = ensure_utc(value)
    return dt


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
    collection = get_courses_collection()
    if collection is None:
        return []
    cursor = collection.find({}).sort("order", 1)
    return [_serialize_course(doc, include_details=include_details) for doc in cursor]


def get_course_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    collection = get_courses_collection()
    if collection is None:
        return None
    doc = collection.find_one({"slug": slug})
    if not doc:
        return None
    return _serialize_course(doc, include_details=True)


def list_practice_sets() -> List[Dict[str, Any]]:
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
    collection = get_course_progress_collection()
    if collection is None:
        return None
    doc = collection.find_one({"user_id": user_id, "course_slug": course_slug})
    if not doc:
        return None
    return _serialize_progress_doc(doc)


def _serialize_progress_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    modules = []
    for module in doc.get("modules", []):
        modules.append(
            {
                "module_id": module.get("module_id"),
                "title": module.get("title"),
                "status": module.get("status", "in-progress"),
                "duration": module.get("duration"),
                "completion": module.get("completion", 0),
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
        progress_update["modules"] = [
            {
                "module_id": module.get("module_id"),
                "title": module.get("title"),
                "status": module.get("status", "in-progress"),
                "duration": module.get("duration"),
                "completion": max(0, min(100, int(module.get("completion", 0)))),
            }
            for module in payload["modules"]
            if module.get("module_id")
        ]
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
