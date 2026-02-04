"""
AI Services Module.

Contains the unified Claude service and base classes for AI interactions.
"""

from .base_claude_service import (
    BaseClaudeService,
    CLAUDE_API_KEY,
    CLAUDE_API_URL,
    ANTHROPIC_VERSION,
)

from .claude_service import (
    ClaudeService,
    PageContext,
    get_claude_service,
)

__all__ = [
    # Base class
    "BaseClaudeService",
    "CLAUDE_API_KEY",
    "CLAUDE_API_URL",
    "ANTHROPIC_VERSION",
    # Unified service
    "ClaudeService",
    "PageContext",
    "get_claude_service",
]
