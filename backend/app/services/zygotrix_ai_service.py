"""
Zygotrix AI Service
====================
Professional conversation management service for the Zygotrix AI chatbot.
Handles conversations, messages, folders, sharing, and analytics.
"""

import logging
import hashlib
import time
import re
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException
from bson import ObjectId

from ..schema.zygotrix_ai import (
    Conversation, ConversationCreate, ConversationUpdate, ConversationSummary,
    ConversationStatus, ConversationSettings, ConversationListResponse,
    Message, MessageCreate, MessageUpdate, MessageRole, MessageStatus,
    MessageMetadata, MessageListResponse, MessageFeedback, FeedbackType,
    Folder, FolderCreate, FolderUpdate, FolderListResponse,
    SharedConversation, ShareConversationRequest, ShareConversationResponse,
    ExportFormat, ExportRequest, ExportResponse,
    SearchRequest, SearchResult, SearchResponse,
    UserChatAnalytics,
    PromptTemplate, PromptTemplateCreate, PromptTemplateUpdate,
)

logger = logging.getLogger(__name__)


# =============================================================================
# DATABASE COLLECTION HELPERS
# =============================================================================

def get_conversations_collection(required: bool = False):
    """Get the conversations collection."""
    from .common import get_mongo_client, get_settings
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["ai_conversations"]
    try:
        collection.create_index("user_id")
        collection.create_index("status")
        collection.create_index([("user_id", 1), ("updated_at", -1)])
        collection.create_index([("user_id", 1), ("is_pinned", -1), ("updated_at", -1)])
        # Use partial index to only enforce uniqueness on non-null share_id
        collection.create_index(
            "share_id", 
            unique=True, 
            partialFilterExpression={"share_id": {"$type": "string"}}
        )
    except Exception as e:
        logger.warning(f"Error creating indexes for conversations: {e}")
        pass
    return collection


def get_messages_collection(required: bool = False):
    """Get the messages collection."""
    from .common import get_mongo_client, get_settings
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["ai_messages"]
    try:
        collection.create_index("conversation_id")
        collection.create_index([("conversation_id", 1), ("created_at", 1)])
        collection.create_index("parent_message_id")
    except Exception:
        pass
    return collection


def get_folders_collection(required: bool = False):
    """Get the folders collection."""
    from .common import get_mongo_client, get_settings
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["ai_folders"]
    try:
        collection.create_index("user_id")
        collection.create_index([("user_id", 1), ("sort_order", 1)])
    except Exception:
        pass
    return collection


def get_shared_conversations_collection(required: bool = False):
    """Get the shared conversations collection."""
    from .common import get_mongo_client, get_settings
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["ai_shared_conversations"]
    try:
        collection.create_index("conversation_id")
        collection.create_index("user_id")
    except Exception:
        pass
    return collection


def get_prompt_templates_collection(required: bool = False):
    """Get the prompt templates collection."""
    from .common import get_mongo_client, get_settings
    client = get_mongo_client()
    if client is None:
        if required:
            raise HTTPException(status_code=503, detail="MongoDB client not available")
        return None
    settings = get_settings()
    db = client[settings.mongodb_db_name]
    collection = db["ai_prompt_templates"]
    try:
        collection.create_index("user_id")
        collection.create_index([("is_public", 1), ("use_count", -1)])
    except Exception:
        pass
    return collection


# =============================================================================
# CONVERSATION SERVICE
# =============================================================================

class ConversationService:
    """Service for managing conversations."""

    @staticmethod
    def create_conversation(
        user_id: str,
        data: ConversationCreate
    ) -> Conversation:
        """Create a new conversation."""
        collection = get_conversations_collection(required=True)

        conversation = Conversation(
            user_id=user_id,
            title=data.title or "New Conversation",
            settings=data.settings or ConversationSettings(),
            page_context=data.page_context,
            folder_id=data.folder_id,
            tags=data.tags,
        )

        # Use exclude_none=True to avoid inserting null values for fields like share_id
        # highlighting the unique index constraint on share_id
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
        """Get a conversation by ID."""
        collection = get_conversations_collection(required=True)

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
        """Update a conversation."""
        collection = get_conversations_collection(required=True)

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
        """Delete a conversation (soft or hard delete)."""
        collection = get_conversations_collection(required=True)
        messages_collection = get_messages_collection()

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
        """List conversations for a user."""
        collection = get_conversations_collection(required=True)
        messages_collection = get_messages_collection()

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
        docs = list(
            collection.find(query)
            .sort([("is_pinned", -1), ("updated_at", -1)])
            .skip(skip)
            .limit(page_size)
        )

        summaries = []
        for doc in docs:
            doc.pop("_id", None)

            # Get last message preview
            last_message_preview = None
            if messages_collection is not None:
                last_msg = messages_collection.find_one(
                    {"conversation_id": doc["id"]},
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
        """Archive a conversation."""
        collection = get_conversations_collection(required=True)
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
        """Restore an archived or deleted conversation."""
        collection = get_conversations_collection(required=True)
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
        """Generate a title from the first few messages."""
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
        increment_messages: bool = False
    ):
        """Update conversation statistics."""
        collection = get_conversations_collection()
        if collection is None:
            return

        update = {
            "$set": {
                "updated_at": datetime.utcnow().isoformat(),
                "last_message_at": datetime.utcnow().isoformat()
            }
        }

        if tokens_used > 0:
            update["$inc"] = {"total_tokens_used": tokens_used}

        if increment_messages:
            if "$inc" not in update:
                update["$inc"] = {}
            update["$inc"]["message_count"] = 1

        collection.update_one({"id": conversation_id}, update)


# =============================================================================
# MESSAGE SERVICE
# =============================================================================

class MessageService:
    """Service for managing messages."""

    @staticmethod
    def create_message(
        conversation_id: str,
        role: MessageRole,
        content: str,
        metadata: Optional[MessageMetadata] = None,
        parent_message_id: Optional[str] = None,
        attachments: List[Dict] = None
    ) -> Message:
        """Create a new message."""
        collection = get_messages_collection(required=True)

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
            increment_messages=True
        )

        logger.info(f"Created message {message.id} in conversation {conversation_id}")
        return message

    @staticmethod
    def get_message(message_id: str) -> Optional[Message]:
        """Get a message by ID."""
        collection = get_messages_collection(required=True)
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
        """Get messages for a conversation."""
        collection = get_messages_collection(required=True)

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
        """Update a message (creates new version by default)."""
        collection = get_messages_collection(required=True)

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
        """Add feedback to a message."""
        collection = get_messages_collection(required=True)

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
        """Delete a message."""
        collection = get_messages_collection(required=True)
        result = collection.delete_one({"id": message_id})
        return result.deleted_count > 0

    @staticmethod
    def get_conversation_context(
        conversation_id: str,
        max_messages: int = 20
    ) -> List[Dict[str, str]]:
        """Get conversation context formatted for LLM."""
        collection = get_messages_collection()
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


# =============================================================================
# FOLDER SERVICE
# =============================================================================

class FolderService:
    """Service for managing folders."""

    @staticmethod
    def create_folder(user_id: str, data: FolderCreate) -> Folder:
        """Create a new folder."""
        collection = get_folders_collection(required=True)

        # Get max sort order
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

        return folder

    @staticmethod
    def get_folder(folder_id: str, user_id: str) -> Optional[Folder]:
        """Get a folder by ID."""
        collection = get_folders_collection(required=True)
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
        """Update a folder."""
        collection = get_folders_collection(required=True)

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
        """Delete a folder and move conversations to root."""
        collection = get_folders_collection(required=True)
        conversations_collection = get_conversations_collection()

        # Move conversations to root (folder_id = None)
        if conversations_collection is not None:
            conversations_collection.update_many(
                {"folder_id": folder_id, "user_id": user_id},
                {"$set": {"folder_id": None}}
            )

        result = collection.delete_one({"id": folder_id, "user_id": user_id})
        return result.deleted_count > 0

    @staticmethod
    def list_folders(user_id: str) -> FolderListResponse:
        """List all folders for a user."""
        collection = get_folders_collection(required=True)
        conversations_collection = get_conversations_collection()

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


# =============================================================================
# SHARING SERVICE
# =============================================================================

class SharingService:
    """Service for sharing conversations."""

    @staticmethod
    def share_conversation(
        conversation_id: str,
        user_id: str,
        data: ShareConversationRequest
    ) -> ShareConversationResponse:
        """Share a conversation and get a public link."""
        from ..config import get_settings
        settings = get_settings()

        conversations_collection = get_conversations_collection(required=True)
        shared_collection = get_shared_conversations_collection(required=True)

        # Verify ownership
        conv = conversations_collection.find_one({
            "id": conversation_id,
            "user_id": user_id
        })
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Generate share ID
        share_id = hashlib.sha256(
            f"{conversation_id}{user_id}{time.time()}".encode()
        ).hexdigest()[:16]

        # Calculate expiration
        expires_at = None
        if data.expires_in_days:
            expires_at = (datetime.utcnow() + timedelta(days=data.expires_in_days)).isoformat()

        # Create shared record
        shared = SharedConversation(
            conversation_id=conversation_id,
            user_id=user_id,
            share_type=data.share_type,
            expires_at=expires_at,
        )
        shared.id = share_id

        doc = shared.model_dump()
        shared_collection.insert_one(doc)

        # Update conversation
        conversations_collection.update_one(
            {"id": conversation_id},
            {"$set": {
                "is_shared": True,
                "share_id": share_id,
                "shared_at": datetime.utcnow().isoformat()
            }}
        )

        share_url = f"{settings.frontend_url}/shared/{share_id}"

        return ShareConversationResponse(
            share_id=share_id,
            share_url=share_url,
            expires_at=expires_at
        )

    @staticmethod
    def get_shared_conversation(share_id: str) -> Tuple[Optional[Conversation], Optional[List[Message]]]:
        """Get a shared conversation by share ID."""
        shared_collection = get_shared_conversations_collection(required=True)
        conversations_collection = get_conversations_collection(required=True)
        messages_collection = get_messages_collection(required=True)

        # Find share record
        shared = shared_collection.find_one({"id": share_id})
        if not shared:
            return None, None

        # Check expiration
        if shared.get("expires_at"):
            expires = datetime.fromisoformat(shared["expires_at"])
            if datetime.utcnow() > expires:
                return None, None

        # Increment view count
        shared_collection.update_one(
            {"id": share_id},
            {"$inc": {"view_count": 1}}
        )

        # Get conversation
        conv_doc = conversations_collection.find_one({"id": shared["conversation_id"]})
        if not conv_doc:
            return None, None

        conv_doc.pop("_id", None)
        conversation = Conversation(**conv_doc)

        # Get messages
        msg_docs = list(
            messages_collection.find({"conversation_id": conversation.id})
            .sort("created_at", 1)
        )

        messages = []
        for doc in msg_docs:
            doc.pop("_id", None)
            messages.append(Message(**doc))

        return conversation, messages

    @staticmethod
    def unshare_conversation(conversation_id: str, user_id: str) -> bool:
        """Remove sharing from a conversation."""
        conversations_collection = get_conversations_collection(required=True)
        shared_collection = get_shared_conversations_collection()

        # Get conversation
        conv = conversations_collection.find_one({
            "id": conversation_id,
            "user_id": user_id
        })
        if not conv:
            return False

        # Delete share record
        if shared_collection and conv.get("share_id"):
            shared_collection.delete_one({"id": conv["share_id"]})

        # Update conversation
        conversations_collection.update_one(
            {"id": conversation_id},
            {"$set": {
                "is_shared": False,
                "share_id": None,
                "shared_at": None
            }}
        )

        return True


# =============================================================================
# EXPORT SERVICE
# =============================================================================

class ExportService:
    """Service for exporting conversations."""

    @staticmethod
    def export_conversation(
        conversation_id: str,
        user_id: str,
        data: ExportRequest
    ) -> ExportResponse:
        """Export a conversation in the specified format."""
        conversation = ConversationService.get_conversation(conversation_id, user_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        messages_response = MessageService.get_messages(conversation_id, limit=1000)
        messages = messages_response.messages

        if data.format == ExportFormat.JSON:
            return ExportService._export_json(conversation, messages, data)
        elif data.format == ExportFormat.MARKDOWN:
            return ExportService._export_markdown(conversation, messages, data)
        elif data.format == ExportFormat.TXT:
            return ExportService._export_txt(conversation, messages, data)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {data.format}")

    @staticmethod
    def _export_json(
        conversation: Conversation,
        messages: List[Message],
        data: ExportRequest
    ) -> ExportResponse:
        """Export as JSON."""
        import json

        export_data = {
            "conversation": {
                "id": conversation.id,
                "title": conversation.title,
                "created_at": conversation.created_at,
            },
            "messages": []
        }

        if data.include_metadata:
            export_data["conversation"]["settings"] = conversation.settings.model_dump()
            export_data["conversation"]["total_tokens_used"] = conversation.total_tokens_used

        for msg in messages:
            msg_data = {
                "role": msg.role.value,
                "content": msg.content,
            }
            if data.include_timestamps:
                msg_data["created_at"] = msg.created_at
            if data.include_metadata and msg.metadata:
                msg_data["metadata"] = msg.metadata.model_dump()

            export_data["messages"].append(msg_data)

        content = json.dumps(export_data, indent=2)
        filename = f"{conversation.title[:30]}_{conversation.id[:8]}.json"

        return ExportResponse(
            format=ExportFormat.JSON,
            filename=filename,
            content=content,
            mime_type="application/json"
        )

    @staticmethod
    def _export_markdown(
        conversation: Conversation,
        messages: List[Message],
        data: ExportRequest
    ) -> ExportResponse:
        """Export as Markdown."""
        lines = [
            f"# {conversation.title}",
            "",
            f"*Exported from Zygotrix AI on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}*",
            "",
            "---",
            "",
        ]

        for msg in messages:
            role_label = "**You:**" if msg.role == MessageRole.USER else "**Zigi:**"

            if data.include_timestamps:
                timestamp = datetime.fromisoformat(msg.created_at).strftime('%Y-%m-%d %H:%M')
                lines.append(f"{role_label} *({timestamp})*")
            else:
                lines.append(role_label)

            lines.append("")
            lines.append(msg.content)
            lines.append("")
            lines.append("---")
            lines.append("")

        content = "\n".join(lines)
        filename = f"{conversation.title[:30]}_{conversation.id[:8]}.md"

        return ExportResponse(
            format=ExportFormat.MARKDOWN,
            filename=filename,
            content=content,
            mime_type="text/markdown"
        )

    @staticmethod
    def _export_txt(
        conversation: Conversation,
        messages: List[Message],
        data: ExportRequest
    ) -> ExportResponse:
        """Export as plain text."""
        lines = [
            f"Conversation: {conversation.title}",
            f"Exported: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            "=" * 50,
            "",
        ]

        for msg in messages:
            role_label = "You:" if msg.role == MessageRole.USER else "Zigi:"

            if data.include_timestamps:
                timestamp = datetime.fromisoformat(msg.created_at).strftime('%Y-%m-%d %H:%M')
                lines.append(f"[{timestamp}] {role_label}")
            else:
                lines.append(role_label)

            lines.append(msg.content)
            lines.append("")
            lines.append("-" * 30)
            lines.append("")

        content = "\n".join(lines)
        filename = f"{conversation.title[:30]}_{conversation.id[:8]}.txt"

        return ExportResponse(
            format=ExportFormat.TXT,
            filename=filename,
            content=content,
            mime_type="text/plain"
        )


# =============================================================================
# SEARCH SERVICE
# =============================================================================

class SearchService:
    """Service for searching conversations and messages."""

    @staticmethod
    def search(user_id: str, data: SearchRequest) -> SearchResponse:
        """Search conversations and messages."""
        conversations_collection = get_conversations_collection(required=True)
        messages_collection = get_messages_collection(required=True)

        results = []

        # Build conversation query
        conv_query: Dict[str, Any] = {
            "user_id": user_id,
            "status": {"$ne": ConversationStatus.DELETED.value}
        }

        if data.folder_id:
            conv_query["folder_id"] = data.folder_id

        if data.status:
            conv_query["status"] = data.status.value

        if data.date_from:
            conv_query["created_at"] = {"$gte": data.date_from}

        if data.date_to:
            if "created_at" in conv_query:
                conv_query["created_at"]["$lte"] = data.date_to
            else:
                conv_query["created_at"] = {"$lte": data.date_to}

        # Search in titles
        if "title" in data.search_in:
            title_query = {**conv_query, "title": {"$regex": data.query, "$options": "i"}}
            title_matches = list(conversations_collection.find(title_query))

            for doc in title_matches:
                doc.pop("_id", None)
                results.append(SearchResult(
                    conversation=ConversationSummary(
                        id=doc["id"],
                        user_id=doc["user_id"],
                        title=doc["title"],
                        status=doc.get("status", ConversationStatus.ACTIVE.value),
                        is_pinned=doc.get("is_pinned", False),
                        is_starred=doc.get("is_starred", False),
                        folder_id=doc.get("folder_id"),
                        tags=doc.get("tags", []),
                        message_count=doc.get("message_count", 0),
                        last_message_at=doc.get("last_message_at"),
                        created_at=doc["created_at"],
                        updated_at=doc["updated_at"],
                    ),
                    relevance_score=1.0
                ))

        # Search in message content
        if "content" in data.search_in:
            # Get user's conversation IDs
            user_convs = conversations_collection.find(conv_query, {"id": 1})
            conv_ids = [c["id"] for c in user_convs]

            # Search messages
            msg_query = {
                "conversation_id": {"$in": conv_ids},
                "content": {"$regex": data.query, "$options": "i"}
            }
            msg_matches = list(messages_collection.find(msg_query).limit(100))

            # Group by conversation
            conv_messages: Dict[str, List] = {}
            for msg in msg_matches:
                conv_id = msg["conversation_id"]
                if conv_id not in conv_messages:
                    conv_messages[conv_id] = []
                conv_messages[conv_id].append({
                    "id": msg["id"],
                    "content_preview": msg["content"][:200],
                    "role": msg["role"],
                    "created_at": msg["created_at"]
                })

            # Add to results
            for conv_id, matched_msgs in conv_messages.items():
                # Check if already in results
                existing = next((r for r in results if r.conversation.id == conv_id), None)
                if existing:
                    existing.matched_messages.extend(matched_msgs)
                    existing.relevance_score += 0.5 * len(matched_msgs)
                else:
                    conv_doc = conversations_collection.find_one({"id": conv_id})
                    if conv_doc:
                        conv_doc.pop("_id", None)
                        results.append(SearchResult(
                            conversation=ConversationSummary(
                                id=conv_doc["id"],
                                user_id=conv_doc["user_id"],
                                title=conv_doc["title"],
                                status=conv_doc.get("status", ConversationStatus.ACTIVE.value),
                                is_pinned=conv_doc.get("is_pinned", False),
                                is_starred=conv_doc.get("is_starred", False),
                                folder_id=conv_doc.get("folder_id"),
                                tags=conv_doc.get("tags", []),
                                message_count=conv_doc.get("message_count", 0),
                                last_message_at=conv_doc.get("last_message_at"),
                                created_at=conv_doc["created_at"],
                                updated_at=conv_doc["updated_at"],
                            ),
                            matched_messages=matched_msgs,
                            relevance_score=0.5 * len(matched_msgs)
                        ))

        # Sort by relevance and apply pagination
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        total = len(results)
        results = results[data.offset:data.offset + data.limit]

        return SearchResponse(
            results=results,
            total=total,
            query=data.query
        )


# =============================================================================
# ANALYTICS SERVICE
# =============================================================================

class AnalyticsService:
    """Service for chat analytics."""

    @staticmethod
    def get_user_analytics(user_id: str) -> UserChatAnalytics:
        """Get analytics for a user's chat usage."""
        conversations_collection = get_conversations_collection()
        messages_collection = get_messages_collection()

        total_conversations = 0
        total_messages = 0
        total_tokens = 0
        model_usage: Dict[str, int] = {}

        if conversations_collection is not None:
            total_conversations = conversations_collection.count_documents({
                "user_id": user_id,
                "status": {"$ne": ConversationStatus.DELETED.value}
            })

            # Get token totals
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {
                    "_id": None,
                    "total_tokens": {"$sum": "$total_tokens_used"}
                }}
            ]
            result = list(conversations_collection.aggregate(pipeline))
            if result:
                total_tokens = result[0].get("total_tokens", 0)

        if messages_collection is not None:
            # Count messages
            conv_ids = []
            if conversations_collection is not None:
                convs = conversations_collection.find(
                    {"user_id": user_id},
                    {"id": 1}
                )
                conv_ids = [c["id"] for c in convs]

            if conv_ids:
                total_messages = messages_collection.count_documents({
                    "conversation_id": {"$in": conv_ids}
                })

                # Get model usage
                pipeline = [
                    {"$match": {
                        "conversation_id": {"$in": conv_ids},
                        "role": MessageRole.ASSISTANT.value,
                        "metadata.model": {"$exists": True}
                    }},
                    {"$group": {
                        "_id": "$metadata.model",
                        "count": {"$sum": 1}
                    }}
                ]
                model_results = list(messages_collection.aggregate(pipeline))
                for r in model_results:
                    if r["_id"]:
                        model_usage[r["_id"]] = r["count"]

        # Calculate averages
        avg_messages = (
            total_messages / total_conversations
            if total_conversations > 0 else 0
        )

        # Get rate limit info
        from ..routes.chatbot import _rate_limiter
        usage_info = _rate_limiter.get_usage(user_id)

        return UserChatAnalytics(
            user_id=user_id,
            total_conversations=total_conversations,
            total_messages=total_messages,
            total_tokens_used=total_tokens,
            tokens_remaining=usage_info.get("tokens_remaining", 25000),
            reset_time=usage_info.get("reset_time"),
            is_rate_limited=usage_info.get("is_limited", False),
            favorite_topics=[],  # Could be enhanced with NLP
            active_days=0,  # Could calculate from timestamps
            average_messages_per_conversation=round(avg_messages, 1),
            model_usage=model_usage,
        )


# =============================================================================
# PROMPT TEMPLATE SERVICE
# =============================================================================

class PromptTemplateService:
    """Service for managing prompt templates."""

    @staticmethod
    def create_template(user_id: str, data: PromptTemplateCreate) -> PromptTemplate:
        """Create a new prompt template."""
        collection = get_prompt_templates_collection(required=True)

        template = PromptTemplate(
            user_id=user_id,
            title=data.title,
            content=data.content,
            description=data.description,
            category=data.category,
            is_public=data.is_public,
        )

        doc = template.model_dump()
        collection.insert_one(doc)

        return template

    @staticmethod
    def get_template(template_id: str, user_id: str) -> Optional[PromptTemplate]:
        """Get a template by ID."""
        collection = get_prompt_templates_collection(required=True)

        doc = collection.find_one({
            "id": template_id,
            "$or": [
                {"user_id": user_id},
                {"is_public": True}
            ]
        })

        if not doc:
            return None

        doc.pop("_id", None)
        return PromptTemplate(**doc)

    @staticmethod
    def list_templates(
        user_id: str,
        include_public: bool = True,
        category: Optional[str] = None
    ) -> List[PromptTemplate]:
        """List templates for a user."""
        collection = get_prompt_templates_collection(required=True)

        query: Dict[str, Any] = {"$or": [{"user_id": user_id}]}
        if include_public:
            query["$or"].append({"is_public": True})

        if category:
            query["category"] = category

        docs = list(
            collection.find(query)
            .sort([("use_count", -1), ("created_at", -1)])
        )

        templates = []
        for doc in docs:
            doc.pop("_id", None)
            templates.append(PromptTemplate(**doc))

        return templates

    @staticmethod
    def use_template(template_id: str) -> bool:
        """Increment use count for a template."""
        collection = get_prompt_templates_collection()
        if collection is None:
            return False

        result = collection.update_one(
            {"id": template_id},
            {"$inc": {"use_count": 1}}
        )
        return result.modified_count > 0

    @staticmethod
    def delete_template(template_id: str, user_id: str) -> bool:
        """Delete a template."""
        collection = get_prompt_templates_collection(required=True)
        result = collection.delete_one({"id": template_id, "user_id": user_id})
        return result.deleted_count > 0
