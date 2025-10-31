from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pymongo.collection import Collection
import logging

from app.services.common import (
    get_courses_collection,
    get_course_enrollments_collection,
)

logger = logging.getLogger(__name__)


class CourseRepository:

    def __init__(self):
        self.courses_collection: Optional[Collection] = None
        self.enrollments_collection: Optional[Collection] = None

    def _get_courses_collection(self) -> Collection:

        if self.courses_collection is None:
            self.courses_collection = get_courses_collection()
        if self.courses_collection is None:
            raise RuntimeError("Courses collection not available")
        return self.courses_collection

    def _get_enrollments_collection(self) -> Collection:

        if self.enrollments_collection is None:
            self.enrollments_collection = get_course_enrollments_collection()
        if self.enrollments_collection is None:
            raise RuntimeError("Enrollments collection not available")
        return self.enrollments_collection

    def find_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:

        collection = self._get_courses_collection()
        return collection.find_one({"slug": slug})

    def list_all(self) -> List[Dict[str, Any]]:

        collection = self._get_courses_collection()
        return list(collection.find())

    def upsert_course(self, course_doc: Dict[str, Any]) -> bool:

        collection = self._get_courses_collection()
        slug = course_doc.get("slug")
        if not slug:
            return False

        result = collection.update_one(
            {"slug": slug}, {"$set": course_doc}, upsert=True
        )

        return result.modified_count > 0 or result.upserted_id is not None

    def bulk_upsert_courses(self, courses: List[Dict[str, Any]]) -> int:

        if not courses:
            return 0

        collection = self._get_courses_collection()
        updated_count = 0

        for course_doc in courses:
            if self.upsert_course(course_doc):
                updated_count += 1

        return updated_count

    def is_user_enrolled(self, user_id: str, course_slug: str) -> bool:

        collection = self._get_enrollments_collection()
        doc = collection.find_one({"user_id": user_id, "course_slug": course_slug})
        return doc is not None

    def enroll_user(self, user_id: str, course_slug: str) -> bool:

        if self.is_user_enrolled(user_id, course_slug):
            return True

        collection = self._get_enrollments_collection()

        enrollment_doc = {
            "user_id": user_id,
            "course_slug": course_slug,
            "enrolled_at": datetime.now(timezone.utc),
        }

        try:
            collection.insert_one(enrollment_doc)
            return True
        except Exception as e:
            logger.error(f"Failed to enroll user {user_id} in {course_slug}: {e}")
            return False

    def get_user_enrollments(self, user_id: str) -> List[str]:

        collection = self._get_enrollments_collection()
        enrollments = collection.find({"user_id": user_id})
        return [e["course_slug"] for e in enrollments if "course_slug" in e]
