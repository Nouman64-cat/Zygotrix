"""
AI Services Module.

Contains the unified Claude service and base classes for AI interactions.
This module provides centralized configuration and shared functionality
for all AI-related services following DRY principles.
"""

# Centralized configuration (primary source)
from .config import (
    CLAUDE_API_KEY,
    CLAUDE_API_URL,
    ANTHROPIC_VERSION,
    CLAUDE_DEFAULT_MODEL,
    CLAUDE_DEEP_RESEARCH_MODEL,
    CLAUDE_SCHOLAR_MODEL,
    CLAUDE_WEB_SEARCH_MODEL,
    CLAUDE_CHATBOT_MODEL,
    CLAUDE_INPUT_TOKEN_PRICE,
    CLAUDE_OUTPUT_TOKEN_PRICE,
    WEB_SEARCH_COST_PER_SEARCH,
    COHERE_RERANK_COST_PER_1K,
    MAX_RECURSION_DEPTH,
    MAX_RETRIEVAL_CHUNKS,
    DEFAULT_TOP_K_RERANKED,
    MAX_DEEP_RESEARCH_CONTEXT_CHARS,
    MAX_SCHOLAR_CONTEXT_CHARS,
    DEFAULT_MAX_RETRIES,
    DEFAULT_TIMEOUT_SECONDS,
    calculate_token_cost,
    is_api_configured,
)

# Base class (re-exports config for backward compatibility)
from .base_claude_service import BaseClaudeService

# Unified service
from .claude_service import (
    ClaudeService,
    PageContext,
    get_claude_service,
)

__all__ = [
    # Configuration
    "CLAUDE_API_KEY",
    "CLAUDE_API_URL",
    "ANTHROPIC_VERSION",
    "CLAUDE_DEFAULT_MODEL",
    "CLAUDE_DEEP_RESEARCH_MODEL",
    "CLAUDE_SCHOLAR_MODEL",
    "CLAUDE_WEB_SEARCH_MODEL",
    "CLAUDE_CHATBOT_MODEL",
    "CLAUDE_INPUT_TOKEN_PRICE",
    "CLAUDE_OUTPUT_TOKEN_PRICE",
    "WEB_SEARCH_COST_PER_SEARCH",
    "COHERE_RERANK_COST_PER_1K",
    "MAX_RECURSION_DEPTH",
    "MAX_RETRIEVAL_CHUNKS",
    "DEFAULT_TOP_K_RERANKED",
    "MAX_DEEP_RESEARCH_CONTEXT_CHARS",
    "MAX_SCHOLAR_CONTEXT_CHARS",
    "DEFAULT_MAX_RETRIES",
    "DEFAULT_TIMEOUT_SECONDS",
    "calculate_token_cost",
    "is_api_configured",
    # Base class
    "BaseClaudeService",
    # Unified service
    "ClaudeService",
    "PageContext",
    "get_claude_service",
]
