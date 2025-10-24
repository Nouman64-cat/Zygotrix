"""Progress service for business logic."""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from ..repositories.progress_repository import ProgressRepository
from ..repositories.course_repository import CourseRepository
from ..serializers import ProgressSerializer

logger = logging.getLogger(__name__)


class ProgressService:
    """Service for progress tracking business logic."""

    def __init__(
        self,
        progress_repo: ProgressRepository,
        course_repo: CourseRepository,
        serializer: ProgressSerializer,
    ):
        self.progress_repo = progress_repo
        self.course_repo = course_repo
        self.serializer = serializer

    async def get_user_progress(
        self, user_id: str, course_slug: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get progress for a user in a course.

        Args:
            user_id: User identifier
            course_slug: Course slug identifier

        Returns:
            Serialized progress object or None if not found
        """
        progress = await self.progress_repo.find_by_user_and_course(
            user_id, course_slug
        )

        if not progress:
            logger.warning(f"No progress found for {user_id} in {course_slug}")
            return None

        return self.serializer.serialize_progress(progress)

    async def mark_item_complete(
        self, user_id: str, course_slug: str, module_id: str, item_id: str
    ) -> bool:
        """
        Mark a module item as complete and update progress.

        Args:
            user_id: User identifier
            course_slug: Course slug identifier
            module_id: Module identifier
            item_id: Item identifier

        Returns:
            True if successful, False otherwise
        """
        # Update the item completion status
        updated = await self.progress_repo.update_module_item(
            user_id=user_id,
            course_slug=course_slug,
            module_id=module_id,
            item_id=item_id,
            completed=True,
        )

        if not updated:
            logger.error(f"Failed to mark {item_id} complete for {user_id}")
            return False

        # Recalculate module and course progress
        await self._recalculate_progress(user_id, course_slug)

        return True

    async def _recalculate_progress(self, user_id: str, course_slug: str) -> None:
        """
        Recalculate module completion percentages and overall progress.

        Args:
            user_id: User identifier
            course_slug: Course slug identifier
        """
        progress = await self.progress_repo.find_by_user_and_course(
            user_id, course_slug
        )

        if not progress:
            return

        total_items = 0
        completed_items = 0

        for module in progress.get("modules", []):
            items = module.get("items", [])
            if not items:
                continue

            # Count completed items in this module
            module_completed = sum(1 for item in items if item.get("completed"))
            module_total = len(items)

            # Calculate module completion percentage
            module_completion = (
                int((module_completed / module_total) * 100) if module_total > 0 else 0
            )

            # Update module status
            if module_completion == 100:
                module_status = "completed"
            elif module_completed > 0:
                module_status = "in-progress"
            else:
                module_status = "locked"  # Or based on previous module completion

            # Update module in database
            await self.progress_repo.update_module_progress(
                user_id=user_id,
                course_slug=course_slug,
                module_id=module["module_id"],
                status=module_status,
                completion=module_completion,
            )

            # Accumulate for overall progress
            total_items += module_total
            completed_items += module_completed

        # Calculate overall course progress
        overall_progress = (
            int((completed_items / total_items) * 100) if total_items > 0 else 0
        )

        # Update overall progress in database
        await self.progress_repo.update_overall_progress(
            user_id=user_id,
            course_slug=course_slug,
            progress=overall_progress,
            updated_at=datetime.utcnow(),
        )

        logger.info(
            f"Recalculated progress for {user_id} in {course_slug}: {overall_progress}%"
        )
