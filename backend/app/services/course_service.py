"""Course service for business logic."""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from ..repositories.course_repository import CourseRepository
from ..repositories.progress_repository import ProgressRepository
from ..integrations.hygraph_client import HygraphClient
from ..serializers import CourseSerializer

logger = logging.getLogger(__name__)


class CourseService:
    """Service for course-related business logic."""

    def __init__(
        self,
        course_repo: CourseRepository,
        progress_repo: ProgressRepository,
        hygraph_client: HygraphClient,
        serializer: CourseSerializer,
    ):
        self.course_repo = course_repo
        self.progress_repo = progress_repo
        self.hygraph_client = hygraph_client
        self.serializer = serializer

    async def get_course_catalog(self) -> List[Dict[str, Any]]:
        """
        Get list of all courses from Hygraph and sync to database.

        Returns:
            List of course summary objects
        """
        # Fetch from Hygraph (with caching)
        hygraph_courses = await self.hygraph_client.get_courses()

        # Sync to local database
        if hygraph_courses:
            synced = await self.course_repo.bulk_upsert_courses(hygraph_courses)
            logger.info(f"Synced {synced} courses to database")

        # Serialize courses
        return [
            self.serializer.serialize_course(course, include_details=False)
            for course in hygraph_courses
        ]

    async def get_course_by_slug(
        self, slug: str, include_details: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Get course by slug, preferring local database with Hygraph fallback.

        Args:
            slug: Course slug identifier
            include_details: Whether to include module details

        Returns:
            Serialized course object or None if not found
        """
        # Try local database first
        course = await self.course_repo.find_by_slug(slug)

        # Fallback to Hygraph if not in database
        if not course:
            logger.info(f"Course {slug} not in DB, fetching from Hygraph")
            hygraph_courses = await self.hygraph_client.get_courses()

            for hc in hygraph_courses:
                if hc.get("slug") == slug or hc.get("id") == slug:
                    course = hc
                    # Save to database for future
                    await self.course_repo.upsert_course(course)
                    break

        if not course:
            logger.warning(f"Course {slug} not found")
            return None

        return self.serializer.serialize_course(course, include_details=include_details)

    async def enroll_user_in_course(self, user_id: str, course_slug: str) -> bool:
        """
        Enroll a user in a course and initialize their progress.

        Args:
            user_id: User identifier
            course_slug: Course slug identifier

        Returns:
            True if enrollment successful, False otherwise
        """
        # Check if already enrolled
        is_enrolled = await self.course_repo.is_user_enrolled(user_id, course_slug)
        if is_enrolled:
            logger.info(f"User {user_id} already enrolled in {course_slug}")
            return True

        # Get course details to initialize progress
        course = await self.get_course_by_slug(course_slug, include_details=True)
        if not course:
            logger.error(f"Cannot enroll: course {course_slug} not found")
            return False

        # Enroll user
        enrolled = await self.course_repo.enroll_user(user_id, course_slug)
        if not enrolled:
            return False

        # Initialize progress document
        modules = []
        for module in course.get("modules", []):
            items = []
            for item in module.get("items", []):
                items.append(
                    {
                        "module_item_id": item["id"],
                        "title": item.get("title", ""),
                        "completed": False,
                    }
                )

            modules.append(
                {
                    "module_id": module["id"],
                    "title": module.get("title", ""),
                    "status": "in-progress" if modules == [] else "locked",
                    "duration": module.get("duration"),
                    "completion": 0,
                    "assessment_status": None,
                    "best_score": None,
                    "attempt_count": 0,
                    "items": items,
                }
            )

        progress_created = await self.progress_repo.create_progress(
            user_id=user_id, course_slug=course_slug, modules=modules
        )

        if not progress_created:
            logger.error(
                f"Failed to initialize progress for {user_id} in {course_slug}"
            )
            return False

        logger.info(f"Successfully enrolled {user_id} in {course_slug}")
        return True

    async def get_user_enrollments(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all courses a user is enrolled in.

        Args:
            user_id: User identifier

        Returns:
            List of course objects the user is enrolled in
        """
        enrolled_slugs = await self.course_repo.get_user_enrollments(user_id)

        courses = []
        for slug in enrolled_slugs:
            course = await self.get_course_by_slug(slug, include_details=False)
            if course:
                courses.append(course)

        return courses
