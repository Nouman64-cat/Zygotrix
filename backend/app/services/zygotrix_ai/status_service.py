"""
Zygotrix AI Status Service.

Handles status checks and available models information.
"""

import logging
from typing import Dict, List, Any, Optional

from ...services.chatbot_settings import get_chatbot_settings

logger = logging.getLogger(__name__)


class ZygotrixStatusService:
    """Service for handling Zygotrix AI status and models information."""

    def get_status(self) -> Dict[str, Any]:
        """
        Get chatbot status and available models.

        Returns:
            Dictionary containing enabled status, default model, available models, and features.
        """
        try:
            settings = get_chatbot_settings()
            return {
                "enabled": settings.enabled,
                "default_model": settings.model,
                "available_models": [
                    {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "description": "Fast and efficient"},
                    {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet", "description": "Balanced performance"},
                    {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "description": "Most capable"},
                    {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "description": "Latest and most intelligent"},
                ],
                "features": {
                    "streaming": True,
                    "conversation_history": True,
                    "message_editing": True,
                    "regeneration": True,
                    "folders": True,
                    "sharing": True,
                    "export": True,
                    "search": True,
                    "prompt_templates": True,
                }
            }
        except Exception as e:
            logger.warning(f"Failed to get chatbot status: {e}")
            return {"enabled": True}

    def get_available_models(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get list of available AI models with accurate 2025 pricing.

        Returns:
            Dictionary containing list of models with detailed information including
            pricing, context windows, and capabilities.
        """
        return {
            "models": [
                {
                    "id": "claude-3-haiku-20240307",
                    "name": "Claude 3 Haiku",
                    "provider": "anthropic",
                    "description": "Fast and efficient for simple tasks",
                    "context_window": 200000,
                    "max_output": 4096,
                    "input_cost_per_1k": 0.00025,  # $0.25 per MTok
                    "output_cost_per_1k": 0.00125,  # $1.25 per MTok
                },
                {
                    "id": "claude-3-sonnet-20240229",
                    "name": "Claude 3 Sonnet",
                    "provider": "anthropic",
                    "description": "Balanced performance and cost",
                    "context_window": 200000,
                    "max_output": 4096,
                    "input_cost_per_1k": 0.003,  # $3 per MTok
                    "output_cost_per_1k": 0.015,  # $15 per MTok
                },
                {
                    "id": "claude-3-opus-20240229",
                    "name": "Claude 3 Opus",
                    "provider": "anthropic",
                    "description": "Most capable for complex tasks",
                    "context_window": 200000,
                    "max_output": 4096,
                    "input_cost_per_1k": 0.015,  # $15 per MTok
                    "output_cost_per_1k": 0.075,  # $75 per MTok
                },
                {
                    "id": "claude-3-5-sonnet-20241022",
                    "name": "Claude 3.5 Sonnet",
                    "provider": "anthropic",
                    "description": "Latest model with improved reasoning",
                    "context_window": 200000,
                    "max_output": 8192,
                    "input_cost_per_1k": 0.003,  # $3 per MTok
                    "output_cost_per_1k": 0.015,  # $15 per MTok
                },
                {
                    "id": "claude-3-5-haiku-20241022",
                    "name": "Claude 3.5 Haiku",
                    "provider": "anthropic",
                    "description": "Faster and more affordable than 3.0",
                    "context_window": 200000,
                    "max_output": 8192,
                    "input_cost_per_1k": 0.0008,  # $0.80 per MTok
                    "output_cost_per_1k": 0.004,  # $4 per MTok
                },
                {
                    "id": "claude-sonnet-4-5-20250514",
                    "name": "Claude Sonnet 4.5",
                    "provider": "anthropic",
                    "description": "Advanced reasoning and performance (2025)",
                    "context_window": 200000,
                    "max_output": 8192,
                    "input_cost_per_1k": 0.003,  # $3 per MTok
                    "output_cost_per_1k": 0.015,  # $15 per MTok
                },
                {
                    "id": "claude-opus-4-5-20251101",
                    "name": "Claude Opus 4.5",
                    "provider": "anthropic",
                    "description": "Most capable Claude model (2025)",
                    "context_window": 200000,
                    "max_output": 8192,
                    "input_cost_per_1k": 0.005,  # $5 per MTok
                    "output_cost_per_1k": 0.025,  # $25 per MTok
                },
                {
                    "id": "claude-haiku-4-5-20250514",
                    "name": "Claude Haiku 4.5",
                    "provider": "anthropic",
                    "description": "Fast and affordable (2025)",
                    "context_window": 200000,
                    "max_output": 8192,
                    "input_cost_per_1k": 0.001,  # $1 per MTok
                    "output_cost_per_1k": 0.005,  # $5 per MTok
                },
            ]
        }


# Singleton instance
_status_service_instance: Optional[ZygotrixStatusService] = None


def get_zygotrix_status_service() -> ZygotrixStatusService:
    """Get singleton instance of ZygotrixStatusService."""
    global _status_service_instance
    if _status_service_instance is None:
        _status_service_instance = ZygotrixStatusService()
    return _status_service_instance
