"""
Centralized Claude API Configuration.

All AI services should import configuration from here to maintain DRY principles.
This module provides:
- API credentials and endpoints
- Model configurations for different services
- Token pricing for cost calculations
- Rate limits and operational parameters

Usage:
    from ..ai.config import (
        CLAUDE_API_KEY,
        CLAUDE_API_URL,
        ANTHROPIC_VERSION,
        CLAUDE_DEEP_RESEARCH_MODEL,
        CLAUDE_SCHOLAR_MODEL,
        CLAUDE_WEB_SEARCH_MODEL,
        calculate_token_cost,
    )
"""

import os
from typing import Dict
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())


# =============================================================================
# API CONFIGURATION
# =============================================================================

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"


# =============================================================================
# MODEL CONFIGURATION
# =============================================================================

# Default model for general use
CLAUDE_DEFAULT_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")

# Service-specific models
CLAUDE_DEEP_RESEARCH_MODEL = os.getenv(
    "DEEP_RESEARCH_MODEL", 
    os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")
)
CLAUDE_SCHOLAR_MODEL = os.getenv("SCHOLAR_MODEL", "claude-3-5-haiku-latest")
CLAUDE_WEB_SEARCH_MODEL = os.getenv("WEB_SEARCH_MODEL", "claude-sonnet-4-20250514")
CLAUDE_CHATBOT_MODEL = os.getenv("CHATBOT_MODEL", "claude-sonnet-4-20250514")


# =============================================================================
# PRICING CONFIGURATION (per 1M tokens)
# =============================================================================

# Claude Sonnet pricing
CLAUDE_INPUT_TOKEN_PRICE = 3.0    # $3 per 1M input tokens
CLAUDE_OUTPUT_TOKEN_PRICE = 15.0  # $15 per 1M output tokens

# Additional service costs
WEB_SEARCH_COST_PER_SEARCH = 0.01  # $10 per 1,000 searches = $0.01 per search
COHERE_RERANK_COST_PER_1K = 2.0    # ~$2 per 1,000 documents reranked


# =============================================================================
# RATE LIMITS & OPERATIONAL PARAMETERS
# =============================================================================

# Deep Research limits
MAX_RECURSION_DEPTH = int(os.getenv("DEEP_RESEARCH_MAX_DEPTH", "10"))
MAX_RETRIEVAL_CHUNKS = int(os.getenv("DEEP_RESEARCH_MAX_CHUNKS", "100"))
DEFAULT_TOP_K_RERANKED = int(os.getenv("DEEP_RESEARCH_TOP_K", "20"))

# Context limits (characters, approx 4 chars per token)
MAX_DEEP_RESEARCH_CONTEXT_CHARS = 72000   # ~18k tokens
MAX_SCHOLAR_CONTEXT_CHARS = 60000         # ~15k tokens

# Retry configuration
DEFAULT_MAX_RETRIES = 3
DEFAULT_TIMEOUT_SECONDS = 120.0


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def calculate_token_cost(
    input_tokens: int,
    output_tokens: int,
    input_price: float = None,
    output_price: float = None
) -> Dict[str, float]:
    """
    Calculate token costs using standard pricing.
    
    Args:
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        input_price: Optional custom price per 1M input tokens
        output_price: Optional custom price per 1M output tokens
        
    Returns:
        Dict with input_cost, output_cost, token_cost (total)
    
    Example:
        >>> calculate_token_cost(1000, 500)
        {'input_cost': 0.003, 'output_cost': 0.0075, 'token_cost': 0.0105}
    """
    input_price = input_price or CLAUDE_INPUT_TOKEN_PRICE
    output_price = output_price or CLAUDE_OUTPUT_TOKEN_PRICE
    
    input_cost = (input_tokens / 1_000_000) * input_price
    output_cost = (output_tokens / 1_000_000) * output_price
    
    return {
        "input_cost": input_cost,
        "output_cost": output_cost,
        "token_cost": input_cost + output_cost
    }


def is_api_configured() -> bool:
    """Check if the Claude API is properly configured."""
    return CLAUDE_API_KEY is not None and CLAUDE_API_KEY.strip() != ""
