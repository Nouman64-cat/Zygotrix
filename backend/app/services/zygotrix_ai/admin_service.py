"""
Zygotrix Admin Service.

Handles admin-only operations and statistics for Zygotrix AI.

Extracted from zygotrix_ai.py as part of Phase 2.5 refactoring.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class ZygotrixAdminService:
    """
    Service for admin-only Zygotrix AI operations.
    
    Provides:
    - Overall statistics (conversations, messages, users)
    - Per-user statistics
    - Admin conversation management
    - Feedback aggregation
    """
    
    def __init__(self):
        """Initialize the admin service."""
        self._conversations_collection = None
        self._messages_collection = None
        self._folders_collection = None
        self._shared_collection = None
    
    def _get_collections(self):
        """Lazily load collections."""
        if self._conversations_collection is None:
            from ...services.zygotrix_ai_service import (
                get_conversations_collection,
                get_messages_collection,
                get_folders_collection,
                get_shared_conversations_collection,
            )
            self._conversations_collection = get_conversations_collection()
            self._messages_collection = get_messages_collection()
            self._folders_collection = get_folders_collection()
            self._shared_collection = get_shared_conversations_collection()
        
        return {
            "conversations": self._conversations_collection,
            "messages": self._messages_collection,
            "folders": self._folders_collection,
            "shared": self._shared_collection,
        }
    
    def get_overall_stats(self) -> Dict[str, Any]:
        """
        Get overall Zygotrix AI statistics.
        
        Returns:
            Dictionary with total conversations, messages, users, etc.
        """
        from ...schema.zygotrix_ai import ConversationStatus
        
        collections = self._get_collections()
        conversations_collection = collections["conversations"]
        messages_collection = collections["messages"]
        folders_collection = collections["folders"]
        shared_collection = collections["shared"]
        
        stats = {
            "total_conversations": 0,
            "active_conversations": 0,
            "archived_conversations": 0,
            "deleted_conversations": 0,
            "total_messages": 0,
            "total_folders": 0,
            "total_shared": 0,
            "total_users": 0,
            "conversations_today": 0,
            "messages_today": 0,
        }
        
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        if conversations_collection:
            stats["total_conversations"] = conversations_collection.count_documents({})
            stats["active_conversations"] = conversations_collection.count_documents({
                "status": ConversationStatus.ACTIVE.value
            })
            stats["archived_conversations"] = conversations_collection.count_documents({
                "status": ConversationStatus.ARCHIVED.value
            })
            stats["deleted_conversations"] = conversations_collection.count_documents({
                "status": ConversationStatus.DELETED.value
            })
            
            # Unique users
            unique_users = conversations_collection.distinct("user_id")
            stats["total_users"] = len(unique_users)
            
            # Today's conversations
            stats["conversations_today"] = conversations_collection.count_documents({
                "created_at": {"$gte": today.isoformat()}
            })
        
        if messages_collection:
            stats["total_messages"] = messages_collection.count_documents({})
            
            # Today's messages
            stats["messages_today"] = messages_collection.count_documents({
                "created_at": {"$gte": today.isoformat()}
            })
        
        if folders_collection:
            stats["total_folders"] = folders_collection.count_documents({})
        
        if shared_collection:
            stats["total_shared"] = shared_collection.count_documents({})
        
        return stats
    
    def get_user_stats(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Get per-user statistics.
        
        Args:
            page: Page number (1-indexed)
            page_size: Number of users per page
            
        Returns:
            Dictionary with users list and pagination info
        """
        collections = self._get_collections()
        conversations_collection = collections["conversations"]
        
        if not conversations_collection:
            return {"users": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
        
        # Aggregate by user
        pipeline = [
            {"$group": {
                "_id": "$user_id",
                "conversation_count": {"$sum": 1},
                "total_tokens": {"$sum": "$total_tokens_used"},
                "total_messages": {"$sum": "$message_count"},
                "first_conversation": {"$min": "$created_at"},
                "last_conversation": {"$max": "$updated_at"},
            }},
            {"$sort": {"total_tokens": -1}},
            {"$skip": (page - 1) * page_size},
            {"$limit": page_size},
        ]
        
        results = list(conversations_collection.aggregate(pipeline))
        
        # Get total count
        total_pipeline = [
            {"$group": {"_id": "$user_id"}},
            {"$count": "total"}
        ]
        total_result = list(conversations_collection.aggregate(total_pipeline))
        total = total_result[0]["total"] if total_result else 0
        
        users = []
        for r in results:
            users.append({
                "user_id": r["_id"],
                "conversation_count": r["conversation_count"],
                "total_tokens": r.get("total_tokens", 0),
                "total_messages": r.get("total_messages", 0),
                "first_conversation": r.get("first_conversation"),
                "last_conversation": r.get("last_conversation"),
            })
        
        return {
            "users": users,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }
    
    def get_conversations(
        self,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Get all conversations with optional filtering.
        
        Args:
            user_id: Filter by user ID (optional)
            status: Filter by conversation status (optional)
            page: Page number (1-indexed)
            page_size: Number of conversations per page
            
        Returns:
            Dictionary with conversations list and pagination info
        """
        collections = self._get_collections()
        conversations_collection = collections["conversations"]
        
        if not conversations_collection:
            return {"conversations": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
        
        query = {}
        if user_id:
            query["user_id"] = user_id
        if status:
            query["status"] = status
        
        total = conversations_collection.count_documents(query)
        
        docs = list(
            conversations_collection.find(query)
            .sort("updated_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        
        conversations = []
        for doc in docs:
            doc.pop("_id", None)
            conversations.append({
                "id": doc["id"],
                "user_id": doc["user_id"],
                "title": doc["title"],
                "status": doc.get("status"),
                "message_count": doc.get("message_count", 0),
                "total_tokens_used": doc.get("total_tokens_used", 0),
                "is_shared": doc.get("is_shared", False),
                "created_at": doc["created_at"],
                "updated_at": doc["updated_at"],
            })
        
        return {
            "conversations": conversations,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }
    
    def delete_conversation(
        self,
        conversation_id: str,
        permanent: bool = False
    ) -> Dict[str, str]:
        """
        Delete a conversation (admin-level).
        
        Args:
            conversation_id: ID of the conversation to delete
            permanent: If True, hard delete; otherwise soft delete
            
        Returns:
            Success message
            
        Raises:
            ValueError: If database is not available
        """
        from ...schema.zygotrix_ai import ConversationStatus
        
        collections = self._get_collections()
        conversations_collection = collections["conversations"]
        messages_collection = collections["messages"]
        
        if not conversations_collection:
            raise ValueError("Database not available")
        
        if permanent:
            # Hard delete
            conversations_collection.delete_one({"id": conversation_id})
            if messages_collection:
                messages_collection.delete_many({"conversation_id": conversation_id})
        else:
            # Soft delete
            conversations_collection.update_one(
                {"id": conversation_id},
                {"$set": {
                    "status": ConversationStatus.DELETED.value,
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )
        
        return {"message": "Conversation deleted"}
    
    def get_feedback(
        self,
        feedback_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Get all message feedback.
        
        Args:
            feedback_type: Filter by feedback type (optional)
            page: Page number (1-indexed)
            page_size: Number of items per page
            
        Returns:
            Dictionary with feedback list and pagination info
        """
        collections = self._get_collections()
        messages_collection = collections["messages"]
        
        if not messages_collection:
            return {"feedback": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
        
        query = {"feedback": {"$exists": True, "$ne": None}}
        if feedback_type:
            query["feedback.type"] = feedback_type
        
        total = messages_collection.count_documents(query)
        
        docs = list(
            messages_collection.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        
        feedback_items = []
        for doc in docs:
            feedback_items.append({
                "message_id": doc["id"],
                "conversation_id": doc["conversation_id"],
                "content_preview": doc["content"][:200] if doc.get("content") else "",
                "role": doc["role"],
                "feedback": doc["feedback"],
                "created_at": doc["created_at"],
            })
        
        return {
            "feedback": feedback_items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }


# Global singleton instance
_zygotrix_admin_service: Optional[ZygotrixAdminService] = None


def get_zygotrix_admin_service() -> ZygotrixAdminService:
    """Get or create the global ZygotrixAdminService instance."""
    global _zygotrix_admin_service
    if _zygotrix_admin_service is None:
        _zygotrix_admin_service = ZygotrixAdminService()
    return _zygotrix_admin_service
