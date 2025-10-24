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
        logger.warning(
            "⚠️  Hygraph configuration missing: endpoint=%s, token=%s",
            bool(settings.hygraph_endpoint),
            bool(settings.hygraph_token),
        )
        return None

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.hygraph_token}",
    }

    try:
        logger.info("🔄 Executing Hygraph query to %s", settings.hygraph_endpoint)
        response = httpx.post(
            settings.hygraph_endpoint,
            json={"query": query},
            headers=headers,
            timeout=10.0,
        )
        response.raise_for_status()
        logger.info("✅ Hygraph query successful, status: %d", response.status_code)
    except httpx.HTTPError as exc:
        logger.error("❌ Hygraph request failed: %s", exc)
        return None

    payload = response.json()
    if "errors" in payload:
        logger.error("❌ Hygraph returned errors: %s", payload["errors"])
        return None

    data = payload.get("data")
    if data:
        logger.info("✅ Hygraph returned data with keys: %s", list(data.keys()))
    else:
        logger.warning("⚠️  Hygraph returned no data")

    return data


def _convert_hygraph_course_to_document(course: Dict[str, Any]) -> Dict[str, Any]:
    course_slug = course.get("slug") or course.get("id") or "course"
    logger.info(f"🔧 Converting Hygraph course: {course_slug}")
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
        print(f"📦 DEBUG: Processing module {idx}: {module.get('title')}")
        logger.info(f"📦 Processing module {idx}: {module.get('title')}")
        logger.info(f"   Assessment data present: {bool(module.get('assessment'))}")
        if module.get("assessment"):
            print(
                f"   DEBUG: Module has assessment! assessmentQuestions = {module.get('assessment', {}).get('assessmentQuestions')}"
            )
            logger.info(
                f"   Assessment questions count: {len(module.get('assessment', {}).get('assessmentQuestions', []))}"
            )

        module_slug = (
            module.get("slug") or module.get("id") or f"{course_slug}-module-{idx}"
        )
        items_payload = []
        for item_idx, item in enumerate(module.get("moduleItems") or []):
            item_id = item.get("id") or f"{module_slug}-item-{item_idx}"
            video_data = item.get("video")
            video_payload = None
            if video_data:
                video_payload = {
                    "fileName": video_data.get("fileName"),
                    "url": video_data.get("url"),
                }
            items_payload.append(
                {
                    "id": item_id,
                    "title": item.get("title"),
                    "description": _normalise_text(item.get("description")),
                    "content": _normalise_text(item.get("content")),
                    "video": video_payload,
                }
            )

        # Process assessment data
        assessment_payload = None
        assessment_data = module.get("assessment")
        print(f"🔍 DEBUG: Module assessment_data = {assessment_data}")
        if assessment_data:
            print(
                f"🔍 DEBUG: Inside assessment_data block for module '{module.get('title')}'"
            )
            logger.info(
                f"🔍 Processing assessment for module '{module.get('title')}': {assessment_data}"
            )
            questions_payload = []
            assessment_questions = assessment_data.get("assessmentQuestions") or []
            print(
                f"🔍 DEBUG: assessmentQuestions = {assessment_questions}, length = {len(assessment_questions)}"
            )
            for question in assessment_questions:
                logger.info(f"🔍 Processing question: {question}")
                # Extract prompt - it's a dict with {markdown: "..."} from Hygraph
                prompt_obj = question.get("prompt")
                if isinstance(prompt_obj, dict):
                    prompt_text = prompt_obj.get("markdown") or _normalise_text(
                        prompt_obj
                    )
                else:
                    prompt_text = _normalise_text(prompt_obj)

                # Extract explanation - it's a dict with {markdown: "..."} from Hygraph
                explanation_obj = question.get("explanation")
                if isinstance(explanation_obj, dict):
                    explanation_text = explanation_obj.get(
                        "markdown"
                    ) or _normalise_text(explanation_obj)
                else:
                    explanation_text = _normalise_text(explanation_obj)

                options_payload = []
                for option in question.get("options") or []:
                    options_payload.append(
                        {
                            "text": option.get("text"),
                            "is_correct": option.get("isCorrect"),
                        }
                    )

                logger.info(f"✅ Created question with {len(options_payload)} options")
                questions_payload.append(
                    {
                        "prompt": prompt_text,
                        "explanation": explanation_text,
                        "options": options_payload,
                    }
                )
            if questions_payload:
                assessment_payload = {"assessment_questions": questions_payload}
                print(
                    f"✅ DEBUG: Created assessment_payload with {len(questions_payload)} questions"
                )
                logger.info(
                    f"✅ Created assessment payload with {len(questions_payload)} questions"
                )
            else:
                print(f"⚠️ DEBUG: questions_payload is empty!")
                logger.warning(f"⚠️ No questions created for assessment")

        modules_payload.append(
            {
                "id": module_slug,
                "title": module.get("title"),
                "duration": module.get("duration"),
                "description": _normalise_text(module.get("overview")),
                "items": items_payload,
                "order": module.get("order"),
                "assessment": assessment_payload,
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

    practice_sets_payload = []
    for practice in course.get("practiceSet") or []:
        questions_payload = []
        for question in practice.get("practiceQuestions") or []:
            answers_payload = []
            for answer in question.get("practiceAnswers") or []:
                answers_payload.append(
                    {
                        "label": answer.get("label"),
                        "is_correct": bool(answer.get("isCorrect")),
                        "body": _normalise_text(answer.get("body")),
                    }
                )
            correct_answer = question.get("correctAnswer") or {}
            questions_payload.append(
                {
                    "topic": question.get("topic"),
                    "difficulty": question.get("difficulty"),
                    "prompt": _normalise_text(question.get("prompt")),
                    "answers": answers_payload,
                    "correct_answer": {
                        "label": correct_answer.get("label"),
                        "is_correct": bool(correct_answer.get("isCorrect")),
                        "body": _normalise_text(correct_answer.get("body")),
                    },
                }
            )
        practice_sets_payload.append(
            {
                "id": practice.get("id") or practice.get("slug"),
                "slug": practice.get("slug"),
                "title": practice.get("title"),
                "description": _normalise_text(practice.get("description")),
                "questions": questions_payload,
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
        "practice_sets": practice_sets_payload,
    }


def _convert_hygraph_practice_set_to_document(
    practice: Dict[str, Any],
) -> Dict[str, Any]:
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

    # Temporarily disable cache for debugging
    use_cache = False

    if (
        use_cache
        and _hygraph_course_cache
        and (now - _hygraph_course_cache[0]).total_seconds()
        < _HYGRAPH_CACHE_TTL_SECONDS
    ):
        logger.info(
            "📦 Using cached course data (%d courses)", len(_hygraph_course_cache[1])
        )
        return _hygraph_course_cache[1]

    logger.info("🔄 Fetching courses from Hygraph...")
    print("🔄 DEBUG: Fetching courses from Hygraph...")
    data = _execute_hygraph_query(HYGRAPH_COURSES_QUERY)
    if not data:
        logger.warning("⚠️  No data returned from Hygraph for courses")
        print("⚠️ DEBUG: No data returned from Hygraph for courses")
        return None

    courses_raw = data.get("courses") or []
    print(f"📚 DEBUG: Found {len(courses_raw)} courses in Hygraph response")
    logger.info("📚 Found %d courses in Hygraph response", len(courses_raw))

    converted = [_convert_hygraph_course_to_document(course) for course in courses_raw]
    logger.info("✅ Converted %d courses to documents", len(converted))

    _hygraph_course_cache = (now, converted)
    return converted


def _get_practice_sets_from_hygraph() -> Optional[List[Dict[str, Any]]]:
    global _hygraph_practice_cache
    now = datetime.now(timezone.utc)
    if (
        _hygraph_practice_cache
        and (now - _hygraph_practice_cache[0]).total_seconds()
        < _HYGRAPH_CACHE_TTL_SECONDS
    ):
        return _hygraph_practice_cache[1]

    data = _execute_hygraph_query(HYGRAPH_PRACTICE_SETS_QUERY)
    if not data:
        return None

    practice_raw = data.get("practiceSets") or []
    converted = [
        _convert_hygraph_practice_set_to_document(item) for item in practice_raw
    ]
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
    return (
        collection.find_one({"user_id": user_id, "course_slug": course_slug})
        is not None
    )


def enroll_user_in_course(user_id: str, course_slug: str) -> bool:
    collection = get_course_enrollments_collection(required=True)
    assert collection is not None  # Type checker hint: required=True ensures this
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

    # Always include instructors and outcomes (lightweight data)
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
    course["instructors"] = instructors

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
            outcomes.append({"id": f"{slug}-outcome-{idx}", "text": str(outcome)})
    course["outcomes"] = outcomes

    if include_details:
        modules = []
        for midx, module in enumerate(doc.get("modules", []), start=1):
            module_id = module.get("id") or f"{slug}-module-{midx}"
            items = []
            for iidx, item in enumerate(module.get("items", []), start=1):
                if isinstance(item, dict):
                    raw_content = item.get("content")
                    if isinstance(raw_content, dict):
                        content_value = raw_content.get("markdown") or raw_content.get(
                            "html"
                        )
                    else:
                        content_value = raw_content

                    # Extract video data if present
                    video_data = item.get("video")
                    video_payload = None
                    if video_data and isinstance(video_data, dict):
                        video_payload = {
                            "fileName": video_data.get("fileName"),
                            "url": video_data.get("url"),
                        }

                    items.append(
                        {
                            "id": item.get("id") or f"{module_id}-item-{iidx}",
                            "title": item.get("title", ""),
                            "description": item.get("description"),
                            "content": content_value,
                            "video": video_payload,
                        }
                    )
                else:
                    items.append(
                        {
                            "id": f"{module_id}-item-{iidx}",
                            "title": str(item),
                            "description": None,
                            "content": None,
                            "video": None,
                        }
                    )

            print(
                f"📊 DEBUG: About to serialize assessment for module '{module.get('title')}': {module.get('assessment')}"
            )
            modules.append(
                {
                    "id": module_id,
                    "title": module.get("title", ""),
                    "duration": module.get("duration"),
                    "description": module.get("description"),
                    "items": items,
                    # Include assessment data if present. Convert internal/snake_case shape
                    # (from Hygraph conversion) to the API's camelCase contract expected
                    # by the frontend.
                    "assessment": _serialize_module_assessment(
                        module.get("assessment")
                    ),
                }
            )
            print(
                f"📊 DEBUG: After serialization, assessment = {modules[-1]['assessment']}"
            )

        course["modules"] = modules

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


def _serialize_module_assessment(assessment: Any) -> Optional[Dict[str, Any]]:
    """Convert stored module assessment into API-friendly camelCase shape.

    The internal representation (from Hygraph conversion) may use
    snake_case keys like `assessment_questions` and option fields like
    `is_correct`. The frontend expects `assessment.assessmentQuestions[]` with
    nested `prompt.markdown` and `explanation.markdown` and options containing
    `text` and `isCorrect`.
    """
    print(f"🔄 DEBUG _serialize_module_assessment called with: {assessment}")
    if not assessment or not isinstance(assessment, dict):
        print(
            f"⚠️ DEBUG _serialize_module_assessment: assessment is None or not dict, returning None"
        )
        return None

    questions = (
        assessment.get("assessment_questions")
        or assessment.get("assessmentQuestions")
        or []
    )
    print(
        f"🔍 DEBUG _serialize_module_assessment: extracted {len(questions)} questions"
    )
    out_questions = []
    for q in questions:
        # Normalize prompt
        prompt = q.get("prompt")
        if isinstance(prompt, dict):
            prompt_md = (
                prompt.get("markdown") or prompt.get("text") or _normalise_text(prompt)
            )
        else:
            prompt_md = _normalise_text(prompt)

        # Normalize explanation
        explanation = q.get("explanation")
        if isinstance(explanation, dict):
            explanation_md = (
                explanation.get("markdown")
                or explanation.get("text")
                or _normalise_text(explanation)
            )
        else:
            explanation_md = _normalise_text(explanation)

        # Normalize options
        opts = []
        for opt in q.get("options") or []:
            if isinstance(opt, dict):
                text = (
                    opt.get("text")
                    or _normalise_text(opt.get("body"))
                    or _normalise_text(opt)
                )
                is_corr = None
                if "is_correct" in opt:
                    is_corr = bool(opt.get("is_correct"))
                elif "isCorrect" in opt:
                    is_corr = bool(opt.get("isCorrect"))
                else:
                    # leave as None when unknown
                    is_corr = None
            else:
                text = _normalise_text(opt)
                is_corr = None
            opts.append({"text": text, "isCorrect": is_corr})

        out_questions.append(
            {
                "prompt": {"markdown": prompt_md or ""},
                "explanation": {"markdown": explanation_md or ""},
                "options": opts,
            }
        )

    result = {"assessmentQuestions": out_questions} if out_questions else None
    print(f"✅ DEBUG _serialize_module_assessment returning: {result}")
    return result


def list_courses(include_details: bool = False) -> List[Dict[str, Any]]:
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

    # Always get course document for module/item structure
    course_doc = _find_course_document(course_slug)
    if not course_doc:
        return None

    if not doc:
        # No progress yet - create initial structure
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

    # Progress exists - enrich with course items if missing
    enriched_modules = []
    for module_progress in doc.get("modules", []):
        module_id = module_progress.get("module_id")

        # Find corresponding module in course
        course_module = next(
            (m for m in course_doc.get("modules", []) if m.get("id") == module_id), None
        )

        # Get items from progress, or create from course if missing
        items_payload = module_progress.get("items", [])
        if not items_payload and course_module:
            # Items missing in progress - populate from course
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

    # Return enriched progress
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
        print(
            f"🔍 DEBUG: Serializing module {module_data['module_id']}: assessment_status={module_data['assessment_status']}, best_score={module_data['best_score']}"
        )
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

    modules_input: List[Dict[str, Any]] = []  # Initialize to avoid unbound error
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


# ================================
# Assessment Functions
# ================================


def submit_assessment(
    user_id: str, course_slug: str, module_id: str, answers: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Submit an assessment attempt and calculate the score.

    Args:
        user_id: The ID of the user submitting the assessment
        course_slug: The course slug
        module_id: The module ID
        answers: List of user answers with question_index and selected_option_index

    Returns:
        Dict containing the attempt details, score, and pass/fail status
    """
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

    print(f"🔍 DEBUG submit_assessment - assessment object: {assessment}")
    questions = (
        assessment.get("assessment_questions")
        or assessment.get("assessmentQuestions")
        or []
    )
    print(f"🔍 DEBUG submit_assessment - questions count: {len(questions)}")
    if not questions:
        raise HTTPException(status_code=404, detail="Assessment has no questions")

    # Calculate score
    total_questions = len(questions)
    correct_answers = 0
    processed_answers = []

    for answer in answers:
        question_index = answer.get("question_index")
        selected_option_index = answer.get("selected_option_index")

        if question_index < 0 or question_index >= total_questions:
            continue

        question = questions[question_index]
        options = question.get("options", [])

        if selected_option_index < 0 or selected_option_index >= len(options):
            continue

        selected_option = options[selected_option_index]
        print(f"🔍 Q{question_index}: selected option = {selected_option}")

        # Check both snake_case and camelCase
        is_correct = (
            selected_option.get("is_correct") == True
            or selected_option.get("isCorrect") == True
        )

        print(f"   is_correct result: {is_correct}")

        if is_correct:
            correct_answers += 1

        processed_answers.append(
            {
                "questionIndex": question_index,
                "selectedOptionIndex": selected_option_index,
                "isCorrect": is_correct,
            }
        )

    score = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    passed = score >= 80.0  # 80% passing criteria

    # Get current attempt number
    collection = get_assessment_attempts_collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    existing_attempts = list(
        collection.find(
            {
                "user_id": user_id,
                "course_slug": course_slug,
                "module_id": module_id,
            }
        )
        .sort("attempt_number", -1)
        .limit(1)
    )

    attempt_number = 1
    if existing_attempts:
        attempt_number = existing_attempts[0].get("attempt_number", 0) + 1

    # Create attempt record
    attempt_id = str(uuid4())
    completed_at = datetime.now(timezone.utc)

    attempt_doc = {
        "id": attempt_id,
        "user_id": user_id,
        "course_slug": course_slug,
        "module_id": module_id,
        "attempt_number": attempt_number,
        "answers": processed_answers,
        "score": score,
        "total_questions": total_questions,
        "passed": passed,
        "completed_at": completed_at,
    }

    collection.insert_one(attempt_doc)

    # Update course progress with assessment status
    _update_assessment_progress(user_id, course_slug, module_id, score, passed)

    return {
        "attempt": attempt_doc,
        "passed": passed,
        "score": score,
        "total_questions": total_questions,
    }


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

    # Remove MongoDB's _id field
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

    # Get current progress
    progress_doc = progress_collection.find_one(
        {
            "user_id": user_id,
            "course_slug": course_slug,
        }
    )

    print(f"🔍 DEBUG: Found progress_doc: {progress_doc is not None}")
    if not progress_doc:
        print(
            f"⚠️ WARNING: No progress document found for user {user_id}, course {course_slug}"
        )
        return

    # Find the module and update assessment status
    modules = progress_doc.get("modules", [])
    print(f"🔍 DEBUG: Found {len(modules)} modules in progress document")
    print(f"🔍 DEBUG: Looking for module_id: {module_id}")
    module_updated = False

    for module in modules:
        if module.get("module_id") == module_id:
            # Update assessment status
            current_best = module.get("best_score", 0)
            module["best_score"] = max(current_best, score)
            module["attempt_count"] = module.get("attempt_count", 0) + 1

            # Once passed, always keep as passed (even if they fail on retake)
            current_status = module.get("assessment_status", "not_started")
            if passed or current_status == "passed":
                module["assessment_status"] = "passed"
            else:
                module["assessment_status"] = "attempted"

            print(
                f"✅ DEBUG: Updated assessment progress for module {module_id}: status={module['assessment_status']}, score={score}, best_score={module['best_score']}"
            )
            module_updated = True
            break

    if not module_updated:
        print(f"⚠️ WARNING: Module {module_id} not found in progress document")
        print(f"📋 Available module IDs: {[m.get('module_id') for m in modules]}")

    if module_updated:
        result = progress_collection.update_one(
            {"user_id": user_id, "course_slug": course_slug},
            {"$set": {"modules": modules, "updated_at": datetime.now(timezone.utc)}},
        )
        print(
            f"💾 DEBUG: Database update result: matched={result.matched_count}, modified={result.modified_count}"
        )
