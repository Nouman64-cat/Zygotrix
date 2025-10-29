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
    get_assessment_attempts_collection,
)

from .service_factory import get_service_factory

from app.cms.hygraph_queries import HYGRAPH_COURSES_QUERY, HYGRAPH_PRACTICE_SETS_QUERY
from app.utils.redis_client import get_cache, set_cache, delete_cache

logger = logging.getLogger(__name__)

_service_factory = get_service_factory()


def submit_assessment(
    user_id: str, course_slug: str, module_id: str, answers: List[Dict[str, Any]]
) -> Dict[str, Any]:

    course = get_course_detail(course_slug, user_id=None)
    if not course or not isinstance(course, dict):
        raise HTTPException(status_code=404, detail="Course not found for assessment")

    modules = course.get("modules") or []

    for idx, m in enumerate(modules):
        logger.info(f"  Module {idx}: id={m.get('id')}, title={m.get('title')}")

    target_module = next((m for m in modules if m.get("id") == module_id), None)

    if target_module is None:
        logger.warning(f"⚠️ Module not found by ID, trying progress lookup...")
        try:
            progress = get_course_progress(user_id, course_slug)
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
            logger.warning(f"⚠️ Fallback module lookup by title failed: {lookup_err}")

    if target_module is None and isinstance(module_id, str):
        try:
            import re

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

            if target_module is None:
                for m in modules:
                    module_title = str(m.get("title", ""))
                    norm_title = norm(module_title)
                    if norm_slug and norm_slug in norm_title:
                        target_module = m
                        break
        except Exception as lookup_err2:
            logger.warning(f"⚠️ Heuristic module lookup from slug failed: {lookup_err2}")

    if target_module is None:
        logger.warning(f"⚠️ Using last-resort: first module with assessment questions")
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

    if len(questions) == 0:
        logger.error(f"❌ CRITICAL: No questions found! Module lookup failed.")
        logger.error(f"   module_id={module_id}, target_module={target_module}")
        logger.error(
            f"   This will result in 0% score. Investigate module matching logic."
        )

    try:
        result = assessment_service.submit_assessment(
            user_id=user_id,
            course_slug=course_slug,
            module_id=module_id,
            questions=questions,
            answers=normalized_answers,
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting assessment via AssessmentService: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


def _serialize_datetime(value: Any) -> Optional[datetime]:
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


def _execute_hygraph_query(query: str) -> Optional[Dict[str, Any]]:
    settings = get_settings()
    if not settings.hygraph_endpoint or not settings.hygraph_token:
        logger.warning("⚠️  Hygraph endpoint or token not configured")
        return None

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                settings.hygraph_endpoint,
                json={"query": query},
                headers={"Authorization": f"Bearer {settings.hygraph_token}"},
            )
            response.raise_for_status()
            data = response.json()
            if "errors" in data:
                logger.error(f"Hygraph GraphQL errors: {data['errors']}")
                return None
            return data.get("data")
    except (httpx.HTTPError, ValueError) as e:
        logger.error(f"Hygraph request failed: {e}")
        return None


def _get_courses_from_hygraph() -> Optional[List[Dict[str, Any]]]:
    """Get courses from Hygraph with Redis caching."""
    cache_key = "hygraph:courses"

    # Try to get from Redis cache first
    cached_courses = get_cache(cache_key)
    if cached_courses:
        logger.info(f"✅ Returning {len(cached_courses)} cached courses from Redis")
        return cached_courses

    # If not in cache, fetch from Hygraph
    logger.info("📡 Fetching fresh courses from Hygraph...")
    data = _execute_hygraph_query(HYGRAPH_COURSES_QUERY)
    if not data or not data.get("courses"):
        logger.warning("⚠️  No courses returned from Hygraph")
        return None

    courses = [
        _convert_hygraph_course_to_document(course) for course in data["courses"]
    ]

    # Store in Redis cache
    set_cache(cache_key, courses)
    logger.info(f"✅ Cached {len(courses)} courses in Redis")

    return courses


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


def _serialize_course(
    doc: Dict[str, Any], include_details: bool = False
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


def list_courses(include_details: bool = False) -> List[Dict[str, Any]]:
    hygraph_courses = _get_courses_from_hygraph()
    if hygraph_courses:
        logger.info("✅ Returning %d courses from Hygraph", len(hygraph_courses))
        return [
            _serialize_course(doc, include_details=include_details)
            for doc in hygraph_courses
        ]

    logger.warning("⚠️  No Hygraph courses, falling back to MongoDB")
    collection = get_courses_collection()
    if collection is None:
        logger.warning("⚠️  MongoDB collection not available")
        return []
    cursor = collection.find({}).sort("order", 1)
    courses = [
        _serialize_course(doc, include_details=include_details) for doc in cursor
    ]
    return courses


def get_course_detail(
    slug: str, user_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    doc = _find_course_document(slug)
    if not doc:
        return None
    serialized = _serialize_course(doc, include_details=True)
    course_slug = serialized.get("slug", slug)
    if user_id:
        serialized["enrolled"] = _is_user_enrolled(user_id, course_slug)

    return serialized


def _find_course_document(slug: str) -> Optional[Dict[str, Any]]:
    hygraph_courses = _get_courses_from_hygraph()
    if hygraph_courses:
        for course in hygraph_courses:
            if course.get("slug") == slug or course.get("id") == slug:
                return course

    collection = get_courses_collection()
    if collection is not None:
        return collection.find_one({"$or": [{"slug": slug}, {"id": slug}]})

    return None


def _is_user_enrolled(user_id: str, course_slug: str) -> bool:
    collection = get_course_enrollments_collection()
    if collection is None:
        return False

    enrollment = collection.find_one({"user_id": user_id, "course_slug": course_slug})
    return enrollment is not None


def enroll_user_in_course(user_id: str, course_slug: str) -> bool:
    if _is_user_enrolled(user_id, course_slug):
        logger.info(f"User {user_id} already enrolled in {course_slug}")
        return True

    collection = get_course_enrollments_collection()
    if collection is None:
        return False

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

        try:
            from app.services.email_service import send_enrollment_email
            from app.services import auth as auth_services

            user_profile = auth_services.get_user_by_id(user_id)
            course = get_course_detail(course_slug)

            if user_profile and course:
                user_email = user_profile.get("email", "")
                user_name = (
                    user_profile.get("full_name")
                    or user_profile.get("email", "").split("@")[0]
                )
                course_title = course.get("title", course_slug)

                logger.info(f"Sending email to: {user_email}")

                if user_email:
                    email_sent = send_enrollment_email(
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

    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to enroll: {exc}") from exc
    return True


def get_course_progress(user_id: str, course_slug: str) -> Optional[Dict[str, Any]]:
    collection = get_course_progress_collection()
    if collection is None:
        return None

    progress_doc = collection.find_one({"user_id": user_id, "course_slug": course_slug})

    if not progress_doc:
        return None

    return _serialize_progress_doc(progress_doc)


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
                "assessment_status": module.get("assessment_status") or "not_started",
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
        "completed": doc.get("completed", False),
        "completed_at": _serialize_datetime(doc.get("completed_at")),
        "certificate_issued": doc.get("certificate_issued", False),
    }


def save_course_progress(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    collection = get_course_progress_collection()
    if collection is None:
        raise HTTPException(status_code=500, detail="Progress collection not available")

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

        return get_course_progress(user_id, course_slug) or {}

    except PyMongoError as exc:
        logger.error(f"Failed to save progress: {exc}")
        raise HTTPException(
            status_code=500, detail=f"Failed to save progress: {exc}"
        ) from exc


def list_practice_sets() -> List[Dict[str, Any]]:
    data = _execute_hygraph_query(HYGRAPH_PRACTICE_SETS_QUERY)
    if data and data.get("practiceSets"):
        return [_serialize_practice_set(ps) for ps in data["practiceSets"]]

    collection = get_practice_sets_collection()
    if collection is not None:
        cursor = collection.find({})
        return [_serialize_practice_set(doc) for doc in cursor]

    return []


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
                    "start": _serialize_datetime(event.get("start")),
                    "end": _serialize_datetime(event.get("end")),
                    "type": event.get("type"),
                    "course_slug": course_slug,
                }
            )

    total_hours, avg_accuracy = _aggregate_metrics(progress_docs)
    avg_progress = (
        sum(progress.get("progress", 0) for progress in serialized_progress)
        / len(serialized_progress)
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
                "image_url": course.get("image_url"),
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


def _aggregate_metrics(progress_docs: List[Dict[str, Any]]) -> Tuple[float, float]:
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


def list_user_enrollments(user_id: str) -> List[str]:
    collection = get_course_enrollments_collection()
    if collection is None:
        return []

    cursor = collection.find({"user_id": user_id})
    return [doc.get("course_slug") for doc in cursor if doc.get("course_slug")]


def get_assessment_history(
    user_id: str, course_slug: str, module_id: str
) -> List[Dict[str, Any]]:
    collection = get_assessment_attempts_collection()
    if collection is None:
        return []

    cursor = collection.find(
        {"user_id": user_id, "course_slug": course_slug, "module_id": module_id}
    ).sort("attempt_number", -1)

    attempts = []
    for doc in cursor:
        attempts.append(
            {
                "attempt_number": doc.get("attempt_number", 1),
                "score": doc.get("score", 0),
                "passed": doc.get("passed", False),
                "submitted_at": _serialize_datetime(doc.get("submitted_at")),
                "answers": doc.get("answers", []),
            }
        )

    return attempts


def generate_certificate(user_id: str, course_slug: str) -> Dict[str, Any]:
    global _hygraph_course_cache
    _hygraph_course_cache = None

    course = get_course_detail(course_slug)

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
            status_code=404, detail="Course progress not found. Please enroll first."
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
    from ..services import auth as auth_services

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
