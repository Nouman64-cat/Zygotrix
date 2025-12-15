"""Repository for prompt template CRUD operations."""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pymongo.collection import Collection

from app.services.common import get_database


class PromptRepository:
    """Repository for managing prompt templates in MongoDB."""

    def __init__(self):
        self.collection: Optional[Collection] = None

    def _get_collection(self) -> Collection:
        """Get the prompt_templates collection."""
        if self.collection is None:
            db = get_database()
            if db is None:
                raise RuntimeError("Database not available")
            self.collection = db["prompt_templates"]
        if self.collection is None:
            raise RuntimeError("Prompt templates collection not available")
        return self.collection

    def find_by_type(self, prompt_type: str) -> Optional[Dict[str, Any]]:
        """Find active prompt by type."""
        collection = self._get_collection()
        return collection.find_one({"prompt_type": prompt_type, "is_active": True})

    def find_all(self) -> List[Dict[str, Any]]:
        """Get all prompt templates."""
        collection = self._get_collection()
        return list(collection.find({}))

    def create_prompt(self, prompt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new prompt template."""
        collection = self._get_collection()

        now = datetime.now(timezone.utc)
        doc = {
            **prompt_data,
            "created_at": now,
            "updated_at": now,
        }

        result = collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    def update_prompt(
        self, prompt_type: str, update_data: Dict[str, Any]
    ) -> bool:
        """Update a prompt template by type."""
        collection = self._get_collection()

        update_data["updated_at"] = datetime.now(timezone.utc)

        result = collection.update_one(
            {"prompt_type": prompt_type},
            {"$set": update_data},
        )

        return result.modified_count > 0

    def upsert_prompt(
        self, prompt_type: str, prompt_data: Dict[str, Any]
    ) -> bool:
        """Update or insert a prompt template."""
        collection = self._get_collection()

        now = datetime.now(timezone.utc)
        prompt_data["updated_at"] = now

        # If document doesn't exist, set created_at
        result = collection.update_one(
            {"prompt_type": prompt_type},
            {
                "$set": prompt_data,
                "$setOnInsert": {"created_at": now}
            },
            upsert=True
        )

        return result.modified_count > 0 or result.upserted_id is not None

    def delete_prompt(self, prompt_type: str) -> bool:
        """Delete a prompt template by type."""
        collection = self._get_collection()

        result = collection.delete_one({"prompt_type": prompt_type})
        return result.deleted_count > 0

    def set_active_status(self, prompt_type: str, is_active: bool) -> bool:
        """Set the active status of a prompt template."""
        collection = self._get_collection()

        result = collection.update_one(
            {"prompt_type": prompt_type},
            {
                "$set": {
                    "is_active": is_active,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        return result.modified_count > 0
