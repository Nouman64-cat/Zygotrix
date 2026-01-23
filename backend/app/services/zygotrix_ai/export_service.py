"""
Export Service
==============
Service for exporting AI conversations to various formats.

Extracted from zygotrix_ai_service.py as part of the refactoring effort
to eliminate the god object anti-pattern.
"""

import logging
import json
from datetime import datetime
from typing import List
from fastapi import HTTPException

from ...schema.zygotrix_ai import (
    Conversation, Message, MessageRole,
    ExportFormat, ExportRequest, ExportResponse,
)
from .conversation_service import ConversationService
from .message_service import MessageService

logger = logging.getLogger(__name__)


class ExportService:
    """Service for exporting conversations to various formats."""

    @staticmethod
    def export_conversation(
        conversation_id: str,
        user_id: str,
        data: ExportRequest
    ) -> ExportResponse:
        """
        Export a conversation in the specified format.
        
        Args:
            conversation_id: ID of the conversation to export
            user_id: ID of the user (for authorization)
            data: Export configuration (format, options)
            
        Returns:
            Export response with content and metadata
            
        Raises:
            HTTPException: If conversation not found or format unsupported
        """
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
        """
        Export conversation as JSON.
        
        Args:
            conversation: Conversation to export
            messages: List of messages
            data: Export options
            
        Returns:
            Export response with JSON content
        """
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

        logger.info(f"Exported conversation {conversation_id} as JSON")
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
        """
        Export conversation as Markdown.
        
        Args:
            conversation: Conversation to export
            messages: List of messages
            data: Export options
            
        Returns:
            Export response with Markdown content
        """
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

        logger.info(f"Exported conversation {conversation_id} as Markdown")
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
        """
        Export conversation as plain text.
        
        Args:
            conversation: Conversation to export
            messages: List of messages
            data: Export options
            
        Returns:
            Export response with plain text content
        """
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

        logger.info(f"Exported conversation {conversation_id} as TXT")
        return ExportResponse(
            format=ExportFormat.TXT,
            filename=filename,
            content=content,
            mime_type="text/plain"
        )
