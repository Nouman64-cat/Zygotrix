"""
Scholar Mode Service Package.

Combines Deep Research (RAG), Web Search, and Cohere Reranking
for comprehensive research with synthesized responses.
"""

from .scholar_service import ScholarService, get_scholar_service

__all__ = ["ScholarService", "get_scholar_service"]
