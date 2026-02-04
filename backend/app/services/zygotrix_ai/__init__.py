"""
Zygotrix AI Services Module.

This module contains services extracted from zygotrix_ai.py routes
following the Single Responsibility Principle.
"""

# Import Claude service from unified ai module
from ..ai import ClaudeService, get_claude_service

# Backward compatibility aliases
ZygotrixClaudeService = ClaudeService
get_zygotrix_claude_service = get_claude_service

from .admin_service import ZygotrixAdminService, get_zygotrix_admin_service
from .chat_service import ZygotrixChatService, get_zygotrix_chat_service
from .status_service import ZygotrixStatusService, get_zygotrix_status_service
from .conversation_service import ConversationService
from .message_service import MessageService
from .folder_service import FolderService
from .sharing_service import SharingService
from .export_service import ExportService
from .search_service import SearchService
from .chat_analytics_service import ChatAnalyticsService
from .prompt_template_service import PromptTemplateService

__all__ = [
    # Claude service (from unified ai module)
    "ClaudeService",
    "get_claude_service",
    # Backward compatibility aliases
    "ZygotrixClaudeService",
    "get_zygotrix_claude_service",
    # Other services
    "ZygotrixAdminService",
    "get_zygotrix_admin_service",
    "ZygotrixChatService",
    "get_zygotrix_chat_service",
    "ZygotrixStatusService",
    "get_zygotrix_status_service",
    "ConversationService",
    "MessageService",
    "FolderService",
    "SharingService",
    "ExportService",
    "SearchService",
    "ChatAnalyticsService",
    "PromptTemplateService",
]
