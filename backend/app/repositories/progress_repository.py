"""Repository for course progress data access."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pymongo.collection import Collection

from app.services.common import get_course_progress_collection


class ProgressRepository:
    """Handles all database operations for course progress."""

    def __init__(self):
        self.collection: Optional[Collection] = None

    def _get_collection(self) -> Collection:
        """Get the progress collection, lazy-loading if needed."""
        if self.collection is None:
            self.collection = get_course_progress_collection()
        if self.collection is None:
            raise RuntimeError("Progress collection not available")
        return self.collection

    def find_by_user_and_course(
        self, user_id: str, course_slug: str
    ) -> Optional[Dict[str, Any]]:
        """Find progress document for a user and course."""
        collection = self._get_collection()
        return collection.find_one({"user_id": user_id, "course_slug": course_slug})

    def create_progress(
        self, user_id: str, course_slug: str, modules: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create a new progress document."""
        collection = self._get_collection()

        now = datetime.now(timezone.utc)
        doc = {
            "user_id": user_id,
            "course_slug": course_slug,
            "enrolled_at": now,
            "updated_at": now,
            "modules": modules,
            "metrics": None,
            "next_session": None,
        }

        collection.insert_one(doc)
        return doc

    def update_module_item(
        self,
        user_id: str,
        course_slug: str,
        module_id: str,
        item_id: str,
        completed: bool,
    ) -> bool:
        """Update the completion status of a module item."""
        collection = self._get_collection()

        result = collection.update_one(
            {
                "user_id": user_id,
                "course_slug": course_slug,
                "modules.module_id": module_id,
            },
            {
                "$set": {
                    "modules.$[module].items.$[item].completed": completed,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
            array_filters=[
                {"module.module_id": module_id},
                {"item.module_item_id": item_id},
            ],
        )

        return result.modified_count > 0

    def update_assessment_status(
        self, user_id: str, course_slug: str, module_id: str, score: float, passed: bool
    ) -> bool:
        """
        Update assessment status for a module.

        This is the CRITICAL function for fixing the assessment bug.
        It ensures:
        1. Best score is tracked
        2. Attempt count is incremented
        3. Status remains "passed" once achieved
        """
        collection = self._get_collection()

        # Get current progress
        progress_doc = self.find_by_user_and_course(user_id, course_slug)
        if not progress_doc:
            print(f"❌ No progress document found for user {user_id}, course {course_slug}")
            return False

        # Find the module and update it
        modules = progress_doc.get("modules", [])
        module_updated = False

        print(f"🔍 Looking for module {module_id} in {len(modules)} modules")
        for module in modules:
            if module.get("module_id") == module_id:
                # Update assessment fields
                current_best = module.get("best_score", 0)
                module["best_score"] = max(current_best, score)
                module["attempt_count"] = module.get("attempt_count", 0) + 1

                # Once passed, always keep as passed
                current_status = module.get("assessment_status")
                if passed or current_status == "passed":
                    module["assessment_status"] = "passed"
                else:
                    module["assessment_status"] = "attempted"

                print(f"✅ Updated module {module_id}: status={module['assessment_status']}, score={module['best_score']}, attempts={module['attempt_count']}")
                module_updated = True
                break

        if not module_updated:
            print(f"❌ Module {module_id} not found in progress document!")
            return False

        # Save the updated modules back to the database
        result = collection.update_one(
            {"user_id": user_id, "course_slug": course_slug},
            {"$set": {"modules": modules, "updated_at": datetime.now(timezone.utc)}},
        )

        print(f"💾 Database update result: modified_count={result.modified_count}")
        return result.modified_count > 0

    def get_all_user_progress(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all progress documents for a user."""
        collection = self._get_collection()
        return list(collection.find({"user_id": user_id}))

    def update_module_progress(
        self,
        user_id: str,
        course_slug: str,
        module_id: str,
        status: str,
        completion: int,
    ) -> bool:
        """Update module status and completion percentage."""
        collection = self._get_collection()

        result = collection.update_one(
            {
                "user_id": user_id,
                "course_slug": course_slug,
                "modules.module_id": module_id,
            },
            {
                "$set": {
                    "modules.$.status": status,
                    "modules.$.completion": completion,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        return result.modified_count > 0

    def update_overall_progress(
        self, user_id: str, course_slug: str, progress: int, updated_at: datetime
    ) -> bool:
        """Update overall course progress percentage."""
        collection = self._get_collection()

        result = collection.update_one(
            {"user_id": user_id, "course_slug": course_slug},
            {
                "$set": {
                    "progress": progress,
                    "updated_at": updated_at,
                }
            },
        )

        return result.modified_count > 0
