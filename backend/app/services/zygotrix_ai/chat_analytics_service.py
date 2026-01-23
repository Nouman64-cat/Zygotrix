"""
Analytics Service
=================
Service for user chat analytics and statistics.

Extracted from zygotrix_ai_service.py as part of the refactoring effort
to eliminate the god object anti-pattern.
"""

import logging
from typing import Dict

from ...schema.zygotrix_ai import (
    ConversationStatus, MessageRole,
    UserChatAnalytics,
)
from ...core.database import CollectionFactory

logger = logging.getLogger(__name__)


class ChatAnalyticsService:
    """Service for analyzing user chat usage and statistics."""

    @staticmethod
    def get_user_analytics(user_id: str) -> UserChatAnalytics:
        """
        Get comprehensive analytics for a user's chat usage.
        
        Includes:
        - Total conversations and messages
        - Token usage and limits
        - Model usage breakdown
        - Averages and statistics
        
        Args:
            user_id: ID of the user
            
        Returns:
            User chat analytics object
        """
        conversations_collection = CollectionFactory.get_conversations_collection()
        messages_collection = CollectionFactory.get_messages_collection()

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
        # Note: This import is kept for backward compatibility
        # In a future refactor, rate limiting should be injected as a dependency
        try:
            from ...routes.chatbot import _rate_limiter
            usage_info = _rate_limiter.get_usage(user_id)
        except ImportError:
            logger.warning("Rate limiter not available, using default values")
            usage_info = {
                "tokens_remaining": 25000,
                "reset_time": None,
                "is_limited": False
            }

        logger.info(f"Generated analytics for user {user_id}: {total_conversations} conversations, {total_messages} messages")
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
