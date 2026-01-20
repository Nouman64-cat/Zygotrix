"""
Web Search Service Package.

Provides web search functionality using Claude's built-in web search tool.
This is a PRO-only feature with usage tracking.
"""

from .web_search_service import (
    WebSearchService,
    get_web_search_service,
    WEB_SEARCH_MODEL
)
from .analytics_service import (
    WebSearchAnalyticsService,
    get_web_search_analytics_service
)

__all__ = [
    "WebSearchService",
    "get_web_search_service",
    "WEB_SEARCH_MODEL",
    "WebSearchAnalyticsService",
    "get_web_search_analytics_service"
]
