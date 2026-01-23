"""
Conversation Service
====================
Service for managing AI conversations.

Extracted from zygotrix_ai_service.py as part of the refactoring effort
to eliminate the god object anti-pattern.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from ...schema.zygotrix_ai import (
    Conversation, ConversationCreate, ConversationUpdate, ConversationSummary,
    ConversationStatus, ConversationSettings, ConversationListResponse,
    Message, MessageRole,
)
from ...core.database import CollectionFactory

logger = logging.getLogger(__name__)


class ConversationService:
    """Service for managing AI conversations."""

    @staticmethod
    def create_conversation(
        user_id: str,
        data: ConversationCreate
    ) -> Conversation:
        """
        Create a new conversation.
        
        Args:
            user_id: ID of the user creating the conversation
            data: Conversation creation data
            
        Returns:
            Created conversation object
        """
        collection = CollectionFactory.get_conversations_collection(required=True)

        conversation = Conversation(
            user_id=user_id,
            title=data.title or "New Conversation",
            settings=data.settings or ConversationSettings(),
            page_context=data.page_context,
            folder_id=data.folder_id,
            tags=data.tags,
        )

        # Use exclude_none=True to avoid inserting null values for fields like share_id
        # respecting the unique index constraint on share_id
        doc = conversation.model_dump(exclude_none=True)
        collection.insert_one(doc)

        logger.info(f"Created conversation {conversation.id} for user {user_id}")
        return conversation

    @staticmethod
    def get_conversation(
        conversation_id: str,
        user_id: str,
        allow_shared: bool = False
    ) -> Optional[Conversation]:
        """
        Get a conversation by ID.
        
        Args:
            conversation_id: ID of the conversation
            user_id: ID of the requesting user
            allow_shared: If True, allows access to shared conversations
            
        Returns:
            Conversation object or None if not found
        """
        collection = CollectionFactory.get_conversations_collection(required=True)

        query = {"id": conversation_id}
        if not allow_shared:
            query["user_id"] = user_id

        doc = collection.find_one(query)
        if not doc:
            return None

        doc.pop("_id", None)
        return Conversation(**doc)

    @staticmethod
    def update_conversation(
        conversation_id: str,
        user_id: str,
        data: ConversationUpdate
    ) -> Optional[Conversation]:
        """
        Update a conversation.
        
        Args:
            conversation_id: ID of the conversation
            user_id: ID of the user (for authorization)
            data: Update data
            
        Returns:
            Updated conversation or None if not found
        """
        collection = CollectionFactory.get_conversations_collection(required=True)

        update_dict = {}
        for field, value in data.model_dump(exclude_none=True).items():
            if field == "settings" and value:
                # Merge settings instead of replacing
                update_dict["settings"] = value
            else:
                update_dict[field] = value

        update_dict["updated_at"] = datetime.utcnow().isoformat()

        result = collection.update_one(
            {"id": conversation_id, "user_id": user_id},
            {"$set": update_dict}
        )

        if result.modified_count == 0:
            return None

        return ConversationService.get_conversation(conversation_id, user_id)

    @staticmethod
    def delete_conversation(
        conversation_id: str,
        user_id: str,
        soft_delete: bool = True
    ) -> bool:
        """
        Delete a conversation (soft or hard delete).
        
        Args:
            conversation_id: ID of the conversation
            user_id: ID of the user (for authorization)
            soft_delete: If True, marks as deleted; if False, permanently removes
            
        Returns:
            True if deleted successfully
        """
        collection = CollectionFactory.get_conversations_collection(required=True)
        messages_collection = CollectionFactory.get_messages_collection()

        if soft_delete:
            result = collection.update_one(
                {"id": conversation_id, "user_id": user_id},
                {"$set": {
                    "status": ConversationStatus.DELETED.value,
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )
            return result.modified_count > 0
        else:
            # Hard delete - remove conversation and all messages
            collection.delete_one({"id": conversation_id, "user_id": user_id})
            if messages_collection is not None:
                messages_collection.delete_many({"conversation_id": conversation_id})
            return True

    @staticmethod
    def list_conversations(
        user_id: str,
        status: Optional[ConversationStatus] = None,
        folder_id: Optional[str] = None,
        is_starred: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
        search_query: Optional[str] = None
    ) -> ConversationListResponse:
        """
        List conversations for a user with filtering and pagination.
        
        Args:
            user_id: ID of the user
            status: Filter by conversation status
            folder_id: Filter by folder ID
            is_starred: Filter by starred status
            page: Page number (1-indexed)
            page_size: Number of conversations per page
            search_query: Search query for title
            
        Returns:
            Paginated list of conversation summaries
        """
        collection = CollectionFactory.get_conversations_collection(required=True)
        messages_collection = CollectionFactory.get_messages_collection()

        query: Dict[str, Any] = {"user_id": user_id}

        if status:
            query["status"] = status.value
        else:
            query["status"] = {"$ne": ConversationStatus.DELETED.value}

        if folder_id is not None:
            query["folder_id"] = folder_id

        if is_starred is not None:
            query["is_starred"] = is_starred

        if search_query:
            query["title"] = {"$regex": search_query, "$options": "i"}

        total = collection.count_documents(query)
        total_pages = (total + page_size - 1) // page_size

        skip = (page - 1) * page_size
        
        # PERFORMANCE: Use projection to only fetch needed fields
        # This reduces network transfer and memory usage
        conversation_projection = {
            "_id": 0,
            "id": 1,
            "user_id": 1,
            "title": 1,
            "status": 1,
            "is_pinned": 1,
            "is_starred": 1,
            "folder_id": 1,
            "tags": 1,
            "message_count": 1,
            "last_message_at": 1,
            "last_message_preview": 1,
            "created_at": 1,
            "updated_at": 1,
        }
        
        docs = list(
            collection.find(query, conversation_projection)
            .sort([("is_pinned", -1), ("updated_at", -1)])
            .skip(skip)
            .limit(page_size)
        )

        summaries = []
        for doc in docs:
            # Get last message preview (prioritize stored field)
            last_message_preview = doc.get("last_message_preview")
            
            # Fallback: query messages collection if not stored
            if last_message_preview is None and messages_collection is not None:
                # PERFORMANCE: Only fetch content field for preview
                last_msg = messages_collection.find_one(
                    {"conversation_id": doc["id"]},
                    projection={"content": 1, "_id": 0},
                    sort=[("created_at", -1)]
                )
                if last_msg:
                    last_message_preview = last_msg.get("content", "")[:100]

            summaries.append(ConversationSummary(
                id=doc["id"],
                user_id=doc["user_id"],
                title=doc["title"],
                status=doc.get("status", ConversationStatus.ACTIVE.value),
                is_pinned=doc.get("is_pinned", False),
                is_starred=doc.get("is_starred", False),
                folder_id=doc.get("folder_id"),
                tags=doc.get("tags", []),
                message_count=doc.get("message_count", 0),
                last_message_preview=last_message_preview,
                last_message_at=doc.get("last_message_at"),
                created_at=doc["created_at"],
                updated_at=doc["updated_at"],
            ))

        return ConversationListResponse(
            conversations=summaries,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    @staticmethod
    def archive_conversation(conversation_id: str, user_id: str) -> bool:
        """
        Archive a conversation.
        
        Args:
            conversation_id: ID of the conversation
            user_id: ID of the user (for authorization)
            
        Returns:
            True if archived successfully
        """
        collection = CollectionFactory.get_conversations_collection(required=True)
        result = collection.update_one(
            {"id": conversation_id, "user_id": user_id},
            {"$set": {
                "status": ConversationStatus.ARCHIVED.value,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        return result.modified_count > 0

    @staticmethod
    def restore_conversation(conversation_id: str, user_id: str) -> bool:
        """
        Restore an archived or deleted conversation.
        
        Args:
            conversation_id: ID of the conversation
            user_id: ID of the user (for authorization)
            
        Returns:
            True if restored successfully
        """
        collection = CollectionFactory.get_conversations_collection(required=True)
        result = collection.update_one(
            {"id": conversation_id, "user_id": user_id},
            {"$set": {
                "status": ConversationStatus.ACTIVE.value,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        return result.modified_count > 0

    @staticmethod
    def generate_title(messages: List[Message]) -> str:
        """
        Generate a title from the first few messages.
        
        Args:
            messages: List of messages in the conversation
            
        Returns:
            Generated title string
        """
        for msg in messages:
            if msg.role == MessageRole.USER and msg.content:
                # Take first 50 characters of first user message
                title = msg.content[:50]
                if len(msg.content) > 50:
                    title += "..."
                return title
        return "New Conversation"

    @staticmethod
    def update_conversation_stats(
        conversation_id: str,
        tokens_used: int = 0,
        increment_messages: bool = False,
        last_message_preview: Optional[str] = None
    ):
        """
        Update conversation statistics.
        
        Args:
            conversation_id: ID of the conversation
            tokens_used: Number of tokens to add to total
            increment_messages: If True, increments message count
            last_message_preview: Preview text of the last message
        """
        collection = CollectionFactory.get_conversations_collection()
        if collection is None:
            return

        update = {
            "$set": {
                "updated_at": datetime.utcnow().isoformat(),
                "last_message_at": datetime.utcnow().isoformat()
            }
        }
        
        if last_message_preview is not None:
             update["$set"]["last_message_preview"] = last_message_preview

        if tokens_used > 0:
            update["$inc"] = {"total_tokens_used": tokens_used}

        if increment_messages:
            if "$inc" not in update:
                update["$inc"] = {}
            update["$inc"]["message_count"] = 1

        collection.update_one({"id": conversation_id}, update)
