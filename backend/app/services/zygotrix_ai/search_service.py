"""
Search Service
==============
Service for searching conversations and messages.

Extracted from zygotrix_ai_service.py as part of the refactoring effort
to eliminate the god object anti-pattern.
"""

import logging
from typing import Dict, Any, List

from ...schema.zygotrix_ai import (
    ConversationStatus, ConversationSummary,
    SearchRequest, SearchResult, SearchResponse,
)
from ...core.database import CollectionFactory

logger = logging.getLogger(__name__)


class SearchService:
    """Service for searching conversations and messages."""

    @staticmethod
    def search(user_id: str, data: SearchRequest) -> SearchResponse:
        """
        Search conversations and messages.
        
        Supports searching in:
        - Conversation titles
        - Message content
        
        With filters for:
        - Folder
        - Status
        - Date range
        
        Args:
            user_id: ID of the user performing the search
            data: Search request with query and filters
            
        Returns:
            Search response with results sorted by relevance
        """
        conversations_collection = CollectionFactory.get_conversations_collection(required=True)
        messages_collection = CollectionFactory.get_messages_collection(required=True)

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

        logger.info(f"Search for '{data.query}' returned {total} results for user {user_id}")
        return SearchResponse(
            results=results,
            total=total,
            query=data.query
        )
