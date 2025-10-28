"""Service layer for University (courses, practice, progress) features.

This module provides a migration wrapper that delegates to the new clean architecture
while maintaining backward compatibility with existing API endpoints.
"""

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

# Cache settings
_HYGRAPH_CACHE_TTL_SECONDS = 300
_hygraph_course_cache: Optional[Tuple[datetime, List[Dict[str, Any]]]] = None
_hygraph_practice_cache: Optional[Tuple[datetime, List[Dict[str, Any]]]] = None

# Hygraph queries
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


# =============================================================================
# MIGRATION WRAPPER FUNCTIONS
# These delegate to the new architecture while maintaining backward compatibility
# =============================================================================


def submit_assessment(
    user_id: str, course_slug: str, module_id: str, answers: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Submit assessment - delegates to AssessmentService.

    Fetches the module's assessment questions from the course detail to grade answers.
    Handles legacy module_id mismatch by falling back to title-based lookup via progress.
    """
    logger.info(
        f"🎯 submit_assessment called for {user_id}, {course_slug}, {module_id}"
    )

    # Fetch course detail to obtain assessment questions
    course = get_course_detail(course_slug, user_id=None)
    if not course or not isinstance(course, dict):
        raise HTTPException(status_code=404, detail="Course not found for assessment")

    modules = course.get("modules") or []
    logger.info(f"📚 Found {len(modules)} modules in course")
    logger.info(f"🔍 Looking for module_id: {module_id}")

    # Log all module IDs for debugging
    for idx, m in enumerate(modules):
        logger.info(f"  Module {idx}: id={m.get('id')}, title={m.get('title')}")

    # Try to locate module by exact ID first
    target_module = next((m for m in modules if m.get("id") == module_id), None)

    if target_module:
        logger.info(f"✅ Found module by exact ID: {target_module.get('title')}")

    # If not found, fall back to matching by title from user's progress (moduleId may be a slug-like ID)
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
                    if target_module:
                        logger.info(f"✅ Found module by title: {title}")
        except Exception as lookup_err:
            logger.warning(f"⚠️ Fallback module lookup by title failed: {lookup_err}")

    # Heuristic: try to infer title from slug-like module_id (e.g., "module-1-ai-ethics-foundations")
    if target_module is None and isinstance(module_id, str):
        logger.warning(f"⚠️ Trying heuristic slug-to-title matching...")
        try:
            import re

            # Remove leading "module-<num>-" if present
            slug_core = re.sub(r"^module-\d+-", "", module_id)
            # Replace dashes/underscores with spaces and normalize
            slug_title = slug_core.replace("-", " ").replace("_", " ").lower()
            logger.info(f"🔍 Normalized slug: '{slug_title}'")

            def norm(s: str) -> str:
                return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()

            norm_slug = norm(slug_title)
            # First try exact normalized title match
            for m in modules:
                module_title = str(m.get("title", ""))
                norm_title = norm(module_title)
                logger.info(
                    f"  Comparing '{norm_slug}' with '{norm_title}' ({module_title})"
                )
                if norm_title == norm_slug:
                    target_module = m
                    logger.info(
                        f"✅ Found module by normalized title match: {module_title}"
                    )
                    break

            # Then try contains
            if target_module is None:
                for m in modules:
                    module_title = str(m.get("title", ""))
                    norm_title = norm(module_title)
                    if norm_slug and norm_slug in norm_title:
                        target_module = m
                        logger.info(f"✅ Found module by partial match: {module_title}")
                        break
        except Exception as lookup_err2:
            logger.warning(f"⚠️ Heuristic module lookup from slug failed: {lookup_err2}")

    # Last-resort: pick the first module that has non-empty assessment questions
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
            logger.info(
                f"✅ Using first module with assessment questions as fallback: {target_module.get('title')}"
            )

    # Extract questions array from module's assessment
    questions: List[Dict[str, Any]] = []
    if target_module:
        assessment = target_module.get("assessment") or {}
        # Support both camelCase and snake_case keys just in case
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

    # Normalize answer keys to snake_case if they arrived as camelCase
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

    logger.info(f"📥 Received {len(answers)} answers from frontend")
    logger.info(f"📤 Sending {len(normalized_answers)} normalized answers to grader")
    logger.info(f"📝 Sending {len(questions)} questions to grader")

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
        logger.info(f"✅ Assessment submitted successfully: {result}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting assessment via AssessmentService: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# =============================================================================
# TEMPORARY LEGACY FUNCTIONS
# These will be gradually migrated to the new architecture
# =============================================================================


def _serialize_datetime(value: Any) -> Optional[datetime]:
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


def _normalise_text(value: Any) -> Optional[str]:
    """Normalize text from various formats."""
    if value is None:
        return None
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, dict):
        return value.get("markdown") or value.get("html") or None
    return str(value) if value else None


def _extract_asset_url(value: Any) -> Optional[str]:
    """Extract URL from asset object or return URL string."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("url")
    return None


def _execute_hygraph_query(query: str) -> Optional[Dict[str, Any]]:
    """Execute GraphQL query against Hygraph."""
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
    """Get courses from Hygraph with caching."""
    global _hygraph_course_cache

    now = datetime.now(timezone.utc)
    if _hygraph_course_cache:
        cache_time, cached_courses = _hygraph_course_cache
        if (now - cache_time).total_seconds() < _HYGRAPH_CACHE_TTL_SECONDS:
            logger.info(f"✅ Returning {len(cached_courses)} cached courses")
            return cached_courses

    logger.info("📡 Fetching fresh courses from Hygraph...")
    data = _execute_hygraph_query(HYGRAPH_COURSES_QUERY)
    if not data or not data.get("courses"):
        logger.warning("⚠️  No courses returned from Hygraph")
        return None

    courses = [
        _convert_hygraph_course_to_document(course) for course in data["courses"]
    ]
    _hygraph_course_cache = (now, courses)
    logger.info(f"✅ Cached {len(courses)} courses from Hygraph")
    return courses


def _convert_hygraph_course_to_document(course: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Hygraph course to internal document format."""
    slug = course.get("slug") or course.get("id")

    # Convert modules
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

        # Convert assessment
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
                "slug": module.get("slug"),  # PRESERVE SLUG FOR MODULE MATCHING
                "title": module.get("title", ""),
                "duration": module.get("duration"),
                "description": _normalise_text(module.get("overview")),
                "items": module_items,
                "assessment": assessment_payload,
            }
        )

    # Convert outcomes
    outcomes = []
    for idx, outcome in enumerate(course.get("courseOutcome", []), start=1):
        outcomes.append(
            {
                "id": outcome.get("id") or f"{slug}-outcome-{idx}",
                "text": outcome.get("outcome", ""),
            }
        )

    # Convert instructors
    instructors = []
    for instructor in course.get("instructors", []):
        instructors.append(
            {
                "id": instructor.get("id"),
                "name": instructor.get("title", ""),
                "title": instructor.get("speciality"),
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
    }


def _serialize_course(
    doc: Dict[str, Any], include_details: bool = False
) -> Dict[str, Any]:
    """Serialize course document for API response."""
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
    }

    if include_details and doc.get("modules"):
        course["modules"] = doc["modules"]

    return course


def list_courses(include_details: bool = False) -> List[Dict[str, Any]]:
    """List all courses."""
    logger.info("📋 list_courses called with include_details=%s", include_details)

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
    logger.info("✅ Returning %d courses from MongoDB", len(courses))
    return courses


def get_course_detail(
    slug: str, user_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Get course detail by slug."""
    doc = _find_course_document(slug)
    if not doc:
        return None

    logger.info(
        f"📚 get_course_detail: Found doc with {len(doc.get('modules', []))} modules BEFORE serialization"
    )

    serialized = _serialize_course(doc, include_details=True)
    course_slug = serialized.get("slug", slug)

    logger.info(
        f"📚 get_course_detail: Serialized course has {len(serialized.get('modules', []))} modules AFTER serialization"
    )

    # Add enrollment status if user provided
    if user_id:
        serialized["enrolled"] = _is_user_enrolled(user_id, course_slug)

    return serialized


def _find_course_document(slug: str) -> Optional[Dict[str, Any]]:
    """Find course document by slug."""
    # Try Hygraph first
    hygraph_courses = _get_courses_from_hygraph()
    if hygraph_courses:
        for course in hygraph_courses:
            if course.get("slug") == slug or course.get("id") == slug:
                return course

    # Fallback to MongoDB
    collection = get_courses_collection()
    if collection is not None:
        return collection.find_one({"$or": [{"slug": slug}, {"id": slug}]})

    return None


def _is_user_enrolled(user_id: str, course_slug: str) -> bool:
    """Check if user is enrolled in course."""
    collection = get_course_enrollments_collection()
    if collection is None:
        return False

    enrollment = collection.find_one({"user_id": user_id, "course_slug": course_slug})
    return enrollment is not None


def enroll_user_in_course(user_id: str, course_slug: str) -> bool:
    """Enroll user in course."""
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

        # Send enrollment email
        try:
            from app.services.email_service import send_enrollment_email
            from app.repositories.user import get_user_profile

            logger.info(
                f"Attempting to send enrollment email for user {user_id} and course {course_slug}"
            )

            # Get user details
            user_profile = get_user_profile(user_id)
            logger.info(f"User profile retrieved: {user_profile is not None}")

            # Get course details
            course = get_course_by_slug(course_slug)
            logger.info(f"Course details retrieved: {course is not None}")

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
            # Don't fail the enrollment if email fails
            logger.warning(f"Failed to send enrollment email: {email_error}")
            logger.exception(email_error)

    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to enroll: {exc}") from exc
    return True


def get_course_progress(user_id: str, course_slug: str) -> Optional[Dict[str, Any]]:
    """Get user's progress for a course."""
    collection = get_course_progress_collection()
    if collection is None:
        return None

    progress_doc = collection.find_one({"user_id": user_id, "course_slug": course_slug})

    if not progress_doc:
        return None

    return _serialize_progress_doc(progress_doc)


def _serialize_progress_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize progress document for API response."""
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
    """Save course progress."""
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
    """List practice sets."""
    logger.info("📋 list_practice_sets called")

    data = _execute_hygraph_query(HYGRAPH_PRACTICE_SETS_QUERY)
    if data and data.get("practiceSets"):
        return [_serialize_practice_set(ps) for ps in data["practiceSets"]]

    # Fallback to MongoDB
    collection = get_practice_sets_collection()
    if collection is not None:
        cursor = collection.find({})
        return [_serialize_practice_set(doc) for doc in cursor]

    return []


def _serialize_practice_set(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize practice set document."""
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
    """Build dashboard summary for user."""
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


def _aggregate_metrics(progress_docs: List[Dict[str, Any]]) -> Tuple[float, float]:
    """Aggregate metrics from progress documents."""
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
    """Get list of course slugs user is enrolled in."""
    collection = get_course_enrollments_collection()
    if collection is None:
        return []

    cursor = collection.find({"user_id": user_id})
    return [doc.get("course_slug") for doc in cursor if doc.get("course_slug")]


def get_assessment_history(
    user_id: str, course_slug: str, module_id: str
) -> List[Dict[str, Any]]:
    """Get assessment attempt history."""
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
    """Generate a certificate for a completed course.

    Validates that all modules, lessons, and assessments are complete,
    marks the course as completed, and returns certificate data.
    """
    # FORCE CACHE INVALIDATION - clear the Hygraph cache to get fresh data
    global _hygraph_course_cache
    print(
        f"\n\n🎓 === CERTIFICATE GENERATION START === User: {user_id}, Course: {course_slug}"
    )
    print(f"🔄 Invalidating Hygraph cache to fetch fresh course data...")
    logger.info(
        f"🎓 === CERTIFICATE GENERATION START === User: {user_id}, Course: {course_slug}"
    )
    logger.info(f"🔄 Invalidating Hygraph cache to fetch fresh course data...")
    _hygraph_course_cache = None

    # Get course details
    course = get_course_detail(course_slug)
    print(f"📊 get_course_detail returned: {type(course)}, is None: {course is None}")
    if course:
        print(f"📊 Course modules count: {len(course.get('modules', []))}")
        print(f"📊 Course keys: {list(course.keys())}")

    if not course:
        logger.error(f"❌ CERT ERROR: Course not found - {course_slug}")
        raise HTTPException(status_code=404, detail="Course not found")

    print(f"✅ Course found: {course.get('title')}")
    print(f"📚 CERT: Course has {len(course.get('modules', []))} modules")
    logger.info(f"✅ Course found: {course.get('title')}")
    logger.info(f"📚 CERT: Course has {len(course.get('modules', []))} modules")
    logger.info(f"📚 CERT: Course keys: {list(course.keys())}")

    # Get user progress
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

    logger.info(
        f"✅ Progress document found. Overall progress: {progress_doc.get('progress', 0)}%"
    )

    # Calculate completion percentage
    total_items = 0
    completed_items = 0
    all_assessments_passed = True

    modules = progress_doc.get("modules", [])
    course_modules = course.get("modules", [])

    print(f"\n📊 DEBUG: modules from progress = {len(modules)}")
    print(f"📊 DEBUG: course_modules from course = {len(course_modules)}")
    print(f"📊 DEBUG: course.get('modules') type = {type(course.get('modules'))}")
    print(
        f"📊 DEBUG: First course module = {course_modules[0] if course_modules else 'EMPTY'}"
    )

    logger.info(
        f"📚 CERT: Found {len(modules)} progress modules and {len(course_modules)} course modules"
    )
    logger.info(
        f"📚 CERT: Progress module IDs: {[m.get('module_id') for m in modules]}"
    )
    logger.info(
        f"📚 CERT: Course module IDs/slugs: {[(m.get('id'), m.get('slug'), m.get('title')) for m in course_modules]}"
    )

    # Debug: Print actual keys in course modules to see what fields are available
    if course_modules:
        print(f"📊 DEBUG: First course module keys: {list(course_modules[0].keys())}")
        logger.info(
            f"📊 DEBUG: First course module keys: {list(course_modules[0].keys())}"
        )

    for module_progress in modules:
        module_id = module_progress.get("module_id")
        logger.info(f"🔍 CERT: Processing module {module_id}")

        # Find corresponding course module - try multiple matching strategies
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

        logger.info(f"✅ CERT: Found course module: {course_module.get('title')}")

        # Count lesson items
        module_items = course_module.get("items", [])
        logger.info(f"📝 CERT: Module has {len(module_items)} lesson items")
        total_items += len(module_items)

        # Count completed lessons
        items_progress = module_progress.get("items", [])
        completed_count = sum(
            1 for item in items_progress if item.get("completed", False)
        )
        logger.info(
            f"✅ CERT: {completed_count}/{len(items_progress)} items completed in progress"
        )
        completed_items += completed_count

        # For modules with NO lessons, check if module itself is marked complete
        if len(module_items) == 0:
            module_completion = module_progress.get("completion", 0)
            logger.info(
                f"📦 CERT: Module has 0 lessons, completion: {module_completion}%"
            )
            if module_completion == 100:
                # Module with no lessons is marked complete - count it as 1 item
                total_items += 1
                completed_items += 1
                logger.info(f"✅ CERT: Module marked complete, counting as 1/1 item")

        # Check assessment - ONLY if the course module actually HAS an assessment
        course_has_assessment = course_module.get("assessment") is not None
        if course_has_assessment:
            # Get assessment questions to verify it's not empty
            assessment_obj = course_module.get("assessment", {})
            assessment_questions = (
                assessment_obj.get("assessmentQuestions", [])
                if isinstance(assessment_obj, dict)
                else []
            )

            logger.info(
                f"📊 CERT: Module has assessment with {len(assessment_questions)} questions"
            )

            # Only count assessment if it has questions
            if assessment_questions and len(assessment_questions) > 0:
                total_items += 1  # Assessment counts as an item
                assessment_status = module_progress.get("assessment_status")

                logger.info(f"📊 CERT: Assessment status: {assessment_status}")

                if assessment_status == "passed":
                    completed_items += 1
                    logger.info(f"✅ CERT: Assessment passed")
                else:
                    # Assessment exists with questions but not passed
                    all_assessments_passed = False
                    logger.warning(
                        f"⚠️ CERT: Assessment NOT passed (status: {assessment_status})"
                    )
        else:
            logger.info(f"ℹ️ CERT: Module has no assessment")

    # Calculate percentage
    completion_percentage = (
        int((completed_items / total_items * 100)) if total_items > 0 else 0
    )

    logger.info(f"📊 === CERT VALIDATION SUMMARY ===")
    logger.info(f"📊 Total items: {total_items}")
    logger.info(f"📊 Completed items: {completed_items}")
    logger.info(f"📊 Completion percentage: {completion_percentage}%")
    logger.info(f"📊 All assessments passed: {all_assessments_passed}")

    # Verify 100% completion
    if completion_percentage < 100 or not all_assessments_passed:
        logger.error(
            f"❌ CERT DENIED: Completion {completion_percentage}%, Assessments passed: {all_assessments_passed}"
        )
        raise HTTPException(
            status_code=400,
            detail=f"Course not fully completed. Progress: {completion_percentage}%. All assessments must be passed.",
        )

    logger.info(f"✅ CERT: Validation passed! Marking course as completed...")

    # Mark course as completed
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

    logger.info(f"✅ CERT: Certificate issued successfully!")

    # Get user profile for name
    from ..services import auth as auth_services

    try:
        user_data = auth_services.get_user_by_id(user_id)
        user_name = user_data.get("full_name") or user_data.get("name") or "Student"
        logger.info(f"✅ CERT: User name retrieved: {user_name}")
    except Exception as e:
        logger.warning(f"⚠️ CERT: Failed to get user profile: {e}")
        user_name = "Student"

    logger.info(f"🎓 === CERTIFICATE GENERATION COMPLETE ===")

    # Return certificate data
    return {
        "user_name": user_name,
        "course_name": course.get("title", "Course"),
        "course_slug": course_slug,
        "completed_at": now,
        "completion_percentage": completion_percentage,
    }
