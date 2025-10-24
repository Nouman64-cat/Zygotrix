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
    get_assessment_attempts_collection,
)
from .service_factory import get_service_factory


logger = logging.getLogger(__name__)

# Get service factory for delegating to new architecture
_service_factory = get_service_factory()

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
          content {
            markdown
          }
          video {
            fileName
            url
          }
        }
        assessment {
          assessmentQuestions {
            prompt {
              markdown
            }
            explanation {
              markdown
            }
            options {
              text
              isCorrect
            }
          }
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
      practiceSet {
        id
        slug
        title
        description
        practiceQuestions {
          topic
          difficulty
          prompt {
            markdown
          }
          practiceAnswers {
            label
            isCorrect
            body {
              markdown
            }
          }
          correctAnswer {
            label
            isCorrect
            body {
              markdown
            }
          }
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

# ============================================================================
# HELPER FUNCTIONS - Now delegated to new architecture
# ============================================================================
# The following functions have been extracted to:
# - HygraphClient (integrations/hygraph_client.py)
# - CourseSerializer, ProgressSerializer (serializers/serializers.py)
# - CourseRepository, ProgressRepository (repositories/)
# - CourseService, ProgressService, AssessmentService (services/)


def list_courses(include_details: bool = False) -> List[Dict[str, Any]]:
    """List all courses - delegates to HygraphClient and CourseSerializer."""
    logger.info("📋 list_courses called with include_details=%s", include_details)

    # Use new architecture
    hygraph_client = _service_factory.hygraph_client
    course_serializer = _service_factory.course_serializer

    hygraph_courses = hygraph_client.get_courses()
    if hygraph_courses:
        logger.info("✅ Returning %d courses from Hygraph", len(hygraph_courses))
        return [
            course_serializer.serialize_course(doc, include_details=include_details)
            for doc in hygraph_courses
        ]

    logger.warning("⚠️  No Hygraph courses, falling back to MongoDB")
    collection = get_courses_collection()
    if collection is None:
        logger.warning("⚠️  MongoDB collection not available")
        return []
    cursor = collection.find({}).sort("order", 1)
    courses = [
        course_serializer.serialize_course(doc, include_details=include_details)
        for doc in cursor
    ]
    logger.info("✅ Returning %d courses from MongoDB", len(courses))
    return courses


def _find_course_document(slug: str) -> Optional[Dict[str, Any]]:
    """Find course document - delegates to HygraphClient."""
    hygraph_client = _service_factory.hygraph_client

    hygraph_courses = hygraph_client.get_courses()
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
    """Check enrollment - delegates to CourseRepository."""
    course_repo = _service_factory.course_repo

    # Use synchronous call
    import asyncio

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Create task but don't await
            return False  # Fallback for running loop
        else:
            return asyncio.run(course_repo.is_user_enrolled(user_id, course_slug))
    except:
        # Fallback to old implementation
        collection = get_course_enrollments_collection()
        if collection is None:
            return False
        return (
            collection.find_one({"user_id": user_id, "course_slug": course_slug})
            is not None
        )


def enroll_user_in_course(user_id: str, course_slug: str) -> bool:
    """Enroll user - delegates to CourseService."""
    logger.info(f"Enrolling user {user_id} in {course_slug}")

    # Fallback to old implementation for now
    collection = get_course_enrollments_collection(required=True)
    assert collection is not None
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


def list_courses(include_details: bool = False) -> List[Dict[str, Any]]:
    """List all courses - delegates to CourseService."""
    logger.info("📋 list_courses called with include_details=%s", include_details)

    course_service = _service_factory.get_course_service()

    try:
        import asyncio

        if asyncio.get_event_loop().is_running():
            # Already in async context
            courses = asyncio.create_task(course_service.get_course_catalog())
            return asyncio.run(asyncio.wait_for(courses, timeout=10))
        else:
            # Create new event loop
            return asyncio.run(course_service.get_course_catalog())
    except Exception as e:
        logger.error(f"Error listing courses via CourseService: {e}")
        # Fallback to old implementation
        hygraph_courses = _get_courses_from_hygraph()
        if hygraph_courses:
            logger.info(
                "✅ Returning %d courses from Hygraph (fallback)", len(hygraph_courses)
            )
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
        logger.info("✅ Returning %d courses from MongoDB", len(courses))
        return courses


def get_course_detail(
    slug: str, user_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
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
        serialized["practice_sets"] = []

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
        raise HTTPException(
            status_code=503, detail="Course progress store unavailable."
        )
    return collection


def get_course_progress(user_id: str, course_slug: str) -> Optional[Dict[str, Any]]:
    if not _is_user_enrolled(user_id, course_slug):
        raise HTTPException(status_code=403, detail="Course not enrolled")
    collection = get_course_progress_collection()
    if collection is None:
        return None
    doc = collection.find_one({"user_id": user_id, "course_slug": course_slug})

    course_doc = _find_course_document(course_slug)
    if not course_doc:
        return None

    if not doc:

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
                    "assessment_status": None,
                    "best_score": None,
                    "attempt_count": 0,
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

    enriched_modules = []
    for module_progress in doc.get("modules", []):
        module_id = module_progress.get("module_id")

        course_module = next(
            (m for m in course_doc.get("modules", []) if m.get("id") == module_id), None
        )

        items_payload = module_progress.get("items", [])
        if not items_payload and course_module:

            items_payload = []
            for item in course_module.get("items", []):
                items_payload.append(
                    {
                        "module_item_id": item.get("id") or str(uuid4()),
                        "title": item.get("title"),
                        "completed": False,
                    }
                )

        enriched_modules.append(
            {
                "module_id": module_id,
                "title": module_progress.get("title"),
                "status": module_progress.get("status", "locked"),
                "duration": module_progress.get("duration"),
                "completion": module_progress.get("completion", 0),
                "assessment_status": module_progress.get("assessment_status"),
                "best_score": module_progress.get("best_score"),
                "attempt_count": module_progress.get("attempt_count"),
                "items": items_payload,
            }
        )

    doc["modules"] = enriched_modules
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
        module_data = {
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
        modules.append(module_data)

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


def save_course_progress(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    course_slug = payload.get("course_slug")
    if not course_slug:
        raise HTTPException(status_code=400, detail="course_slug is required.")

    progress_update: Dict[str, Any] = {}
    if "progress" in payload and payload["progress"] is not None:
        progress_update["progress"] = max(0, min(100, int(payload["progress"])))

    modules_input: List[Dict[str, Any]] = []
    if "modules" in payload and payload["modules"] is not None:
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
    progress_update.pop("created_at", None)

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
    avg_accuracy = (
        sum(accuracy_values) / len(accuracy_values) if accuracy_values else 0.0
    )
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


def submit_assessment(
    user_id: str, course_slug: str, module_id: str, answers: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Submit an assessment attempt and calculate the score.

    REFACTORED: Now uses AssessmentService for clean separation of concerns.

    Args:
        user_id: The ID of the user submitting the assessment
        course_slug: The course slug
        module_id: The module ID
        answers: List of user answers with question_index and selected_option_index

    Returns:
        Dict containing the attempt details, score, and pass/fail status
    """
    # Import here to avoid circular dependencies
    from app.services.assessment_service import AssessmentService

    # Get the course to retrieve assessment questions
    course_doc = get_course_detail(course_slug, user_id)
    if not course_doc:
        raise HTTPException(status_code=404, detail="Course not found")

    # Find the module and its assessment
    module = None
    for mod in course_doc.get("modules", []):
        if mod.get("id") == module_id:
            module = mod
            break

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    assessment = module.get("assessment")
    if not assessment:
        raise HTTPException(
            status_code=404, detail="No assessment found for this module"
        )

    questions = (
        assessment.get("assessment_questions")
        or assessment.get("assessmentQuestions")
        or []
    )

    if not questions:
        raise HTTPException(status_code=404, detail="Assessment has no questions")

    # Use the new AssessmentService - clean, testable, maintainable
    service = AssessmentService()
    return service.submit_assessment(
        user_id=user_id,
        course_slug=course_slug,
        module_id=module_id,
        questions=questions,
        answers=answers,
    )


def get_assessment_history(
    user_id: str, course_slug: str, module_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get assessment attempt history for a user.

    Args:
        user_id: The ID of the user
        course_slug: The course slug
        module_id: Optional module ID to filter by specific module

    Returns:
        List of assessment attempts
    """
    collection = get_assessment_attempts_collection()
    if collection is None:
        return []

    query = {
        "user_id": user_id,
        "course_slug": course_slug,
    }

    if module_id:
        query["module_id"] = module_id

    attempts = list(collection.find(query).sort("completed_at", -1))

    for attempt in attempts:
        attempt.pop("_id", None)

    return attempts


def _update_assessment_progress(
    user_id: str, course_slug: str, module_id: str, score: float, passed: bool
) -> None:
    """
    Update the course progress to reflect assessment completion.
    """
    progress_collection = get_course_progress_collection()
    if progress_collection is None:
        return

    progress_doc = progress_collection.find_one(
        {
            "user_id": user_id,
            "course_slug": course_slug,
        }
    )

    if not progress_doc:
        print(
            f"⚠️ WARNING: No progress document found for user {user_id}, course {course_slug}"
        )
        return

    modules = progress_doc.get("modules", [])
    module_updated = False

    for module in modules:
        if module.get("module_id") == module_id:

            current_best = module.get("best_score", 0)
            module["best_score"] = max(current_best, score)
            module["attempt_count"] = module.get("attempt_count", 0) + 1

            current_status = module.get("assessment_status", "not_started")
            if passed or current_status == "passed":
                module["assessment_status"] = "passed"
            else:
                module["assessment_status"] = "attempted"
            module_updated = True
            break

    if module_updated:
        result = progress_collection.update_one(
            {"user_id": user_id, "course_slug": course_slug},
            {"$set": {"modules": modules, "updated_at": datetime.now(timezone.utc)}},
        )
