"""
Folder Service
==============
Service for managing conversation folders.

Extracted from zygotrix_ai_service.py as part of the refactoring effort
to eliminate the god object anti-pattern.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from ...schema.zygotrix_ai import (
    Folder, FolderCreate, FolderUpdate, FolderListResponse,
    ConversationStatus,
)
from ...core.database import CollectionFactory

logger = logging.getLogger(__name__)


class FolderService:
    """Service for managing conversation folders."""

    @staticmethod
    def create_folder(user_id: str, data: FolderCreate) -> Folder:
        """
        Create a new folder for organizing conversations.
        
        Args:
            user_id: ID of the user creating the folder
            data: Folder creation data
            
        Returns:
            Created folder object
        """
        collection = CollectionFactory.get_folders_collection(required=True)

        # Get max sort order to append new folder at the end
        max_order = collection.find_one(
            {"user_id": user_id},
            sort=[("sort_order", -1)]
        )
        next_order = (max_order.get("sort_order", 0) + 1) if max_order else 0

        folder = Folder(
            user_id=user_id,
            name=data.name,
            color=data.color,
            icon=data.icon,
            parent_folder_id=data.parent_folder_id,
            sort_order=next_order,
        )

        doc = folder.model_dump(exclude_none=True)
        collection.insert_one(doc)

        logger.info(f"Created folder {folder.id} for user {user_id}")
        return folder

    @staticmethod
    def get_folder(folder_id: str, user_id: str) -> Optional[Folder]:
        """
        Get a folder by ID.
        
        Args:
            folder_id: ID of the folder
            user_id: ID of the user (for authorization)
            
        Returns:
            Folder object or None if not found
        """
        collection = CollectionFactory.get_folders_collection(required=True)
        doc = collection.find_one({"id": folder_id, "user_id": user_id})
        if not doc:
            return None
        doc.pop("_id", None)
        return Folder(**doc)

    @staticmethod
    def update_folder(
        folder_id: str,
        user_id: str,
        data: FolderUpdate
    ) -> Optional[Folder]:
        """
        Update a folder.
        
        Args:
            folder_id: ID of the folder
            user_id: ID of the user (for authorization)
            data: Update data
            
        Returns:
            Updated folder or None if not found
        """
        collection = CollectionFactory.get_folders_collection(required=True)

        update_dict = data.model_dump(exclude_none=True)
        update_dict["updated_at"] = datetime.utcnow().isoformat()

        result = collection.update_one(
            {"id": folder_id, "user_id": user_id},
            {"$set": update_dict}
        )

        if result.modified_count == 0:
            return None

        return FolderService.get_folder(folder_id, user_id)

    @staticmethod
    def delete_folder(folder_id: str, user_id: str) -> bool:
        """
        Delete a folder and move its conversations to root.
        
        Args:
            folder_id: ID of the folder to delete
            user_id: ID of the user (for authorization)
            
        Returns:
            True if folder was deleted successfully
        """
        collection = CollectionFactory.get_folders_collection(required=True)
        conversations_collection = CollectionFactory.get_conversations_collection()

        # Move conversations to root (folder_id = None)
        if conversations_collection is not None:
            conversations_collection.update_many(
                {"folder_id": folder_id, "user_id": user_id},
                {"$set": {"folder_id": None}}
            )

        result = collection.delete_one({"id": folder_id, "user_id": user_id})
        
        if result.deleted_count > 0:
            logger.info(f"Deleted folder {folder_id} for user {user_id}")
            return True
        return False

    @staticmethod
    def list_folders(user_id: str) -> FolderListResponse:
        """
        List all folders for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of folders with conversation counts
        """
        collection = CollectionFactory.get_folders_collection(required=True)
        conversations_collection = CollectionFactory.get_conversations_collection()

        docs = list(
            collection.find({"user_id": user_id})
            .sort("sort_order", 1)
        )

        folders = []
        for doc in docs:
            doc.pop("_id", None)

            # Count conversations in folder
            if conversations_collection is not None:
                count = conversations_collection.count_documents({
                    "folder_id": doc["id"],
                    "user_id": user_id,
                    "status": {"$ne": ConversationStatus.DELETED.value}
                })
                doc["conversation_count"] = count

            folders.append(Folder(**doc))

        return FolderListResponse(folders=folders, total=len(folders))
