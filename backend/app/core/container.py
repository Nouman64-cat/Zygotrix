"""
Dependency Injection Container.

Centralized service and repository instantiation for the application.
"""

from functools import lru_cache
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class ServiceContainer:
    """
    Dependency injection container for services and repositories.

    Provides singleton access to service instances with lazy initialization.
    """

    def __init__(self):
        """Initialize the service container."""
        self._services = {}
        self._repositories = {}

    # =========================================================================
    # AUTH SERVICES (Placeholder - will be implemented in Phase 2)
    # =========================================================================

    def get_authentication_service(self):
        """
        Get authentication service instance.

        Note: This is a placeholder. Full implementation will be added in Phase 2
        when auth.py is refactored into multiple services.

        Returns:
            Authentication service instance
        """
        if "authentication" not in self._services:
            # Import here to avoid circular dependencies
            from ..services import auth as auth_services

            # For now, return the auth module directly
            # In Phase 2, this will return a proper AuthenticationService class
            self._services["authentication"] = auth_services

        return self._services["authentication"]

    # =========================================================================
    # TRAIT SERVICES
    # =========================================================================

    def get_trait_service(self):
        """
        Get trait service instance.

        Returns:
            Trait service instance
        """
        if "trait" not in self._services:
            try:
                from ..services.service_factory import get_trait_service

                self._services["trait"] = get_trait_service()
            except Exception as e:
                logger.error(f"Failed to create trait service: {e}")
                raise

        return self._services["trait"]

    # =========================================================================
    # CHATBOT SERVICES
    # =========================================================================

    def get_chatbot_settings_service(self):
        """
        Get chatbot settings service.

        Returns:
            Chatbot settings service
        """
        if "chatbot_settings" not in self._services:
            from ..services.chatbot_settings import get_chatbot_settings

            self._services["chatbot_settings"] = get_chatbot_settings

        return self._services["chatbot_settings"]

    def get_rate_limiter(self):
        """
        Get rate limiter service.

        Returns:
            Rate limiter instance
        """
        if "rate_limiter" not in self._services:
            from ..services.chatbot.rate_limiting_service import get_rate_limiter

            self._services["rate_limiter"] = get_rate_limiter()

        return self._services["rate_limiter"]

    def get_token_analytics_service(self):
        """
        Get token analytics service.

        Returns:
            Token analytics service instance
        """
        if "token_analytics" not in self._services:
            from ..services.chatbot.token_analytics_service import (
                get_token_analytics_service,
            )

            self._services["token_analytics"] = get_token_analytics_service()

        return self._services["token_analytics"]

    # =========================================================================
    # ZYGOTRIX AI SERVICES
    # =========================================================================

    def get_zygotrix_claude_service(self):
        """
        Get Zygotrix Claude service.

        Returns:
            Claude service instance
        """
        if "zygotrix_claude" not in self._services:
            from ..services.ai import get_claude_service

            self._services["zygotrix_claude"] = get_claude_service()

        return self._services["zygotrix_claude"]

    def get_zygotrix_chat_service(self):
        """
        Get Zygotrix chat service.

        Returns:
            Zygotrix chat service instance
        """
        if "zygotrix_chat" not in self._services:
            from ..services.zygotrix_ai.chat_service import get_zygotrix_chat_service

            self._services["zygotrix_chat"] = get_zygotrix_chat_service()

        return self._services["zygotrix_chat"]

    def get_zygotrix_admin_service(self):
        """
        Get Zygotrix admin service.

        Returns:
            Zygotrix admin service instance
        """
        if "zygotrix_admin" not in self._services:
            from ..services.zygotrix_ai.admin_service import get_zygotrix_admin_service

            self._services["zygotrix_admin"] = get_zygotrix_admin_service()

        return self._services["zygotrix_admin"]

    def get_zygotrix_status_service(self):
        """
        Get Zygotrix status service.

        Returns:
            Zygotrix status service instance
        """
        if "zygotrix_status" not in self._services:
            from ..services.zygotrix_ai.status_service import (
                get_zygotrix_status_service,
            )

            self._services["zygotrix_status"] = get_zygotrix_status_service()

        return self._services["zygotrix_status"]

    # =========================================================================
    # UTILITY SERVICES
    # =========================================================================

    def get_client_info_extractor(self):
        """
        Get client info extractor.

        Returns:
            ClientInfoExtractor class
        """
        if "client_info_extractor" not in self._services:
            from ..infrastructure.http.client_info import ClientInfoExtractor

            self._services["client_info_extractor"] = ClientInfoExtractor

        return self._services["client_info_extractor"]


# ============================================================================
# SINGLETON CONTAINER
# ============================================================================

@lru_cache()
def get_container() -> ServiceContainer:
    """
    Get singleton service container instance.

    Returns:
        ServiceContainer singleton
    """
    return ServiceContainer()


# ============================================================================
# DEPENDENCY PROVIDER FUNCTIONS
# ============================================================================
# These functions are used with FastAPI's Depends() for dependency injection

def get_authentication_service():
    """Dependency provider for authentication service."""
    return get_container().get_authentication_service()


def get_trait_service():
    """Dependency provider for trait service."""
    return get_container().get_trait_service()


def get_chatbot_settings_service():
    """Dependency provider for chatbot settings."""
    return get_container().get_chatbot_settings_service()


def get_rate_limiter():
    """Dependency provider for rate limiter."""
    return get_container().get_rate_limiter()


def get_token_analytics_service():
    """Dependency provider for token analytics."""
    return get_container().get_token_analytics_service()


def get_zygotrix_claude_service():
    """Dependency provider for Zygotrix Claude service."""
    return get_container().get_zygotrix_claude_service()


def get_zygotrix_chat_service():
    """Dependency provider for Zygotrix chat service."""
    return get_container().get_zygotrix_chat_service()


def get_zygotrix_admin_service():
    """Dependency provider for Zygotrix admin service."""
    return get_container().get_zygotrix_admin_service()


def get_zygotrix_status_service():
    """Dependency provider for Zygotrix status service."""
    return get_container().get_zygotrix_status_service()


def get_client_info_extractor():
    """Dependency provider for client info extractor."""
    return get_container().get_client_info_extractor()
