"""
Deep Research Service Module.

This module implements a LangGraph-based deep research workflow that:
1. Uses GPT-4o-mini for clarifying questions
2. Retrieves embeddings from Pinecone
3. Reranks results using Cohere
4. Generates final response using Claude
"""

from .research_service import (
    DeepResearchService,
    get_deep_research_service,
)
from .schemas import (
    DeepResearchRequest,
    DeepResearchResponse,
    ResearchState,
    ClarificationQuestion,
)

__all__ = [
    "DeepResearchService",
    "get_deep_research_service",
    "DeepResearchRequest",
    "DeepResearchResponse",
    "ResearchState",
    "ClarificationQuestion",
]
