"""
Sharing Service
===============
Service for sharing AI conversations publicly.

Extracted from zygotrix_ai_service.py as part of the refactoring effort
to eliminate the god object anti-pattern.
"""

import logging
import hashlib
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from fastapi import HTTPException

from ...schema.zygotrix_ai import (
    Conversation, Message,
    SharedConversation, ShareConversationRequest, ShareConversationResponse,
)
from ...core.database import CollectionFactory
from ...config import get_settings

logger = logging.getLogger(__name__)


class SharingService:
    """Service for sharing conversations publicly."""

    @staticmethod
    def share_conversation(
        conversation_id: str,
        user_id: str,
        data: ShareConversationRequest
    ) -> ShareConversationResponse:
        """
        Share a conversation and generate a public link.
        
        Args:
            conversation_id: ID of the conversation to share
            user_id: ID of the user (for authorization)
            data: Sharing configuration (type, expiration)
            
        Returns:
            Share response with share ID and URL
            
        Raises:
            HTTPException: If conversation not found
        """
        settings = get_settings()
        conversations_collection = CollectionFactory.get_conversations_collection(required=True)
        shared_collection = CollectionFactory.get_shared_conversations_collection(required=True)

        # Verify ownership
        conv = conversations_collection.find_one({
            "id": conversation_id,
            "user_id": user_id
        })
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Generate unique share ID
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

        logger.info(f"Shared conversation {conversation_id} with share_id {share_id}")
        return ShareConversationResponse(
            share_id=share_id,
            share_url=share_url,
            expires_at=expires_at
        )

    @staticmethod
    def get_shared_conversation(
        share_id: str
    ) -> Tuple[Optional[Conversation], Optional[List[Message]]]:
        """
        Get a shared conversation by share ID.
        
        Args:
            share_id: Public share ID
            
        Returns:
            Tuple of (conversation, messages) or (None, None) if not found/expired
        """
        shared_collection = CollectionFactory.get_shared_conversations_collection(required=True)
        conversations_collection = CollectionFactory.get_conversations_collection(required=True)
        messages_collection = CollectionFactory.get_messages_collection(required=True)

        # Find share record
        shared = shared_collection.find_one({"id": share_id})
        if not shared:
            return None, None

        # Check expiration
        if shared.get("expires_at"):
            expires = datetime.fromisoformat(shared["expires_at"])
            if datetime.utcnow() > expires:
                logger.info(f"Share {share_id} has expired")
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
        """
        Remove sharing from a conversation.
        
        Args:
            conversation_id: ID of the conversation
            user_id: ID of the user (for authorization)
            
        Returns:
            True if unshared successfully
        """
        conversations_collection = CollectionFactory.get_conversations_collection(required=True)
        shared_collection = CollectionFactory.get_shared_conversations_collection()

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

        logger.info(f"Unshared conversation {conversation_id}")
        return True
