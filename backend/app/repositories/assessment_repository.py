from typing import Optional, List, Dict, Any
from datetime import datetime
from pymongo.collection import Collection

from app.services.common import get_assessment_attempts_collection


class AssessmentRepository:

    def __init__(self):
        self.collection: Optional[Collection] = None

    def _get_collection(self) -> Collection:

        if self.collection is None:
            self.collection = get_assessment_attempts_collection()
        if self.collection is None:
            raise RuntimeError("Assessment attempts collection not available")
        return self.collection

    def get_latest_attempt_number(
        self, user_id: str, course_slug: str, module_id: str
    ) -> int:

        collection = self._get_collection()

        latest = collection.find_one(
            {
                "user_id": user_id,
                "course_slug": course_slug,
                "module_id": module_id,
            },
            sort=[("attempt_number", -1)],
        )

        return latest.get("attempt_number", 0) if latest else 0

    def save_attempt(self, attempt_doc: Dict[str, Any]) -> str:

        collection = self._get_collection()
        result = collection.insert_one(attempt_doc)
        return str(result.inserted_id)

    def get_attempts_history(
        self, user_id: str, course_slug: str, module_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:

        collection = self._get_collection()

        query = {
            "user_id": user_id,
            "course_slug": course_slug,
        }

        if module_id:
            query["module_id"] = module_id

        return list(collection.find(query).sort("completed_at", -1))
