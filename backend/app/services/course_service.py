import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from ..repositories.course_repository import CourseRepository
from ..repositories.progress_repository import ProgressRepository
from ..integrations.hygraph_client import HygraphClient
from ..serializers import CourseSerializer

logger = logging.getLogger(__name__)


class CourseService:

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

        hygraph_courses = await self.hygraph_client.get_courses()

        if hygraph_courses:
            synced = await self.course_repo.bulk_upsert_courses(hygraph_courses)
            logger.info(f"Synced {synced} courses to database")

        return [
            self.serializer.serialize_course(course, include_details=False)
            for course in hygraph_courses
        ]

    async def get_course_by_slug(
        self, slug: str, include_details: bool = True
    ) -> Optional[Dict[str, Any]]:

        course = await self.course_repo.find_by_slug(slug)

        if not course:
            logger.info(f"Course {slug} not in DB, fetching from Hygraph")
            hygraph_courses = await self.hygraph_client.get_courses()

            for hc in hygraph_courses:
                if hc.get("slug") == slug or hc.get("id") == slug:
                    course = hc
                    await self.course_repo.upsert_course(course)
                    break

        if not course:
            logger.warning(f"Course {slug} not found")
            return None

        return self.serializer.serialize_course(course, include_details=include_details)

    async def enroll_user_in_course(self, user_id: str, course_slug: str) -> bool:

        is_enrolled = await self.course_repo.is_user_enrolled(user_id, course_slug)
        if is_enrolled:
            logger.info(f"User {user_id} already enrolled in {course_slug}")
            return True

        course = await self.get_course_by_slug(course_slug, include_details=True)
        if not course:
            logger.error(f"Cannot enroll: course {course_slug} not found")
            return False

        enrolled = await self.course_repo.enroll_user(user_id, course_slug)
        if not enrolled:
            return False

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

        enrolled_slugs = await self.course_repo.get_user_enrollments(user_id)

        courses = []
        for slug in enrolled_slugs:
            course = await self.get_course_by_slug(slug, include_details=False)
            if course:
                courses.append(course)

        return courses
