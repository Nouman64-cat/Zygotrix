"""
Message Service
===============
Service for managing AI conversation messages.

Extracted from zygotrix_ai_service.py as part of the refactoring effort
to eliminate the god object anti-pattern.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from ...schema.zygotrix_ai import (
    Message, MessageRole, MessageStatus, MessageMetadata,
    MessageListResponse, MessageFeedback, FeedbackType,
)
from ...core.database import CollectionFactory
from .conversation_service import ConversationService

logger = logging.getLogger(__name__)


class MessageService:
    """Service for managing AI conversation messages."""

    @staticmethod
    def create_message(
        conversation_id: str,
        role: MessageRole,
        content: str,
        metadata: Optional[MessageMetadata] = None,
        parent_message_id: Optional[str] = None,
        attachments: List[Dict] = None
    ) -> Message:
        """
        Create a new message in a conversation.
        
        Args:
            conversation_id: ID of the conversation
            role: Message role (USER, ASSISTANT, SYSTEM)
            content: Message content
            metadata: Optional metadata (tokens, model, etc.)
            parent_message_id: Optional parent message for threading
            attachments: Optional list of attachments
            
        Returns:
            Created message object
        """
        collection = CollectionFactory.get_messages_collection(required=True)

        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata,
            parent_message_id=parent_message_id,
            attachments=attachments or [],
        )

        doc = message.model_dump(exclude_none=True)
        collection.insert_one(doc)

        # Update conversation stats
        ConversationService.update_conversation_stats(
            conversation_id,
            tokens_used=metadata.total_tokens if metadata else 0,
            increment_messages=True,
            last_message_preview=content[:100] if content else None
        )

        logger.info(f"Created message {message.id} in conversation {conversation_id}")
        return message

    @staticmethod
    def get_message(message_id: str) -> Optional[Message]:
        """
        Get a message by ID.
        
        Args:
            message_id: ID of the message
            
        Returns:
            Message object or None if not found
        """
        collection = CollectionFactory.get_messages_collection(required=True)
        doc = collection.find_one({"id": message_id})
        if not doc:
            return None
        doc.pop("_id", None)
        return Message(**doc)

    @staticmethod
    def get_messages(
        conversation_id: str,
        limit: int = 50,
        before_id: Optional[str] = None,
        after_id: Optional[str] = None
    ) -> MessageListResponse:
        """
        Get messages for a conversation with pagination.
        
        Args:
            conversation_id: ID of the conversation
            limit: Maximum number of messages to return
            before_id: Get messages before this message ID
            after_id: Get messages after this message ID
            
        Returns:
            Paginated list of messages
        """
        collection = CollectionFactory.get_messages_collection(required=True)

        query: Dict[str, Any] = {"conversation_id": conversation_id}

        if before_id:
            before_msg = collection.find_one({"id": before_id})
            if before_msg:
                query["created_at"] = {"$lt": before_msg["created_at"]}

        if after_id:
            after_msg = collection.find_one({"id": after_id})
            if after_msg:
                query["created_at"] = {"$gt": after_msg["created_at"]}

        total = collection.count_documents({"conversation_id": conversation_id})

        docs = list(
            collection.find(query)
            .sort("created_at", 1)
            .limit(limit + 1)  # Get one extra to check if there are more
        )

        has_more = len(docs) > limit
        if has_more:
            docs = docs[:limit]

        messages = []
        for doc in docs:
            doc.pop("_id", None)
            messages.append(Message(**doc))

        return MessageListResponse(
            messages=messages,
            total=total,
            has_more=has_more,
            conversation_id=conversation_id,
        )

    @staticmethod
    def update_message(
        message_id: str,
        content: str,
        create_new_version: bool = True
    ) -> Optional[Message]:
        """
        Update a message (creates new version by default).
        
        Args:
            message_id: ID of the message to update
            content: New content
            create_new_version: If True, creates a new version as sibling
            
        Returns:
            Updated or new message, or None if original not found
        """
        collection = CollectionFactory.get_messages_collection(required=True)

        original = collection.find_one({"id": message_id})
        if not original:
            return None

        if create_new_version:
            # Create a new message as a sibling
            original.pop("_id", None)
            new_message = Message(
                conversation_id=original["conversation_id"],
                role=original["role"],
                content=content,
                parent_message_id=original.get("parent_message_id"),
                version=original.get("version", 1) + 1,
            )

            doc = new_message.model_dump()
            collection.insert_one(doc)

            # Update original to track sibling
            siblings = original.get("sibling_ids", [])
            siblings.append(new_message.id)
            collection.update_one(
                {"id": message_id},
                {"$set": {"sibling_ids": siblings}}
            )

            return new_message
        else:
            # Direct update
            collection.update_one(
                {"id": message_id},
                {"$set": {
                    "content": content,
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )
            return MessageService.get_message(message_id)

    @staticmethod
    def add_feedback(
        message_id: str,
        feedback_type: FeedbackType,
        comment: Optional[str] = None
    ) -> bool:
        """
        Add user feedback to a message.
        
        Args:
            message_id: ID of the message
            feedback_type: Type of feedback (POSITIVE, NEGATIVE)
            comment: Optional feedback comment
            
        Returns:
            True if feedback was added successfully
        """
        collection = CollectionFactory.get_messages_collection(required=True)

        feedback = MessageFeedback(
            type=feedback_type,
            comment=comment
        )

        result = collection.update_one(
            {"id": message_id},
            {"$set": {"feedback": feedback.model_dump()}}
        )
        return result.modified_count > 0

    @staticmethod
    def delete_message(message_id: str) -> bool:
        """
        Delete a message.
        
        Args:
            message_id: ID of the message to delete
            
        Returns:
            True if message was deleted successfully
        """
        collection = CollectionFactory.get_messages_collection(required=True)
        result = collection.delete_one({"id": message_id})
        return result.deleted_count > 0

    @staticmethod
    def get_conversation_context(
        conversation_id: str,
        max_messages: int = 20
    ) -> List[Dict[str, str]]:
        """
        Get conversation context formatted for LLM.
        
        Args:
            conversation_id: ID of the conversation
            max_messages: Maximum number of messages to include
            
        Returns:
            List of message dictionaries with role and content
        """
        collection = CollectionFactory.get_messages_collection()
        if collection is None:
            return []

        docs = list(
            collection.find({"conversation_id": conversation_id})
            .sort("created_at", -1)
            .limit(max_messages)
        )

        # Reverse to get chronological order
        docs.reverse()

        context = []
        for doc in docs:
            if doc.get("status") == MessageStatus.COMPLETED.value:
                context.append({
                    "role": doc["role"],
                    "content": doc["content"]
                })

        return context
