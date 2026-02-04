"""
Query Router Service for Intelligent Routing.

Routes queries to appropriate data sources based on classification:
- CONVERSATIONAL → Claude only (no context, no tools)
- KNOWLEDGE → Pinecone + Claude (context, no tools)
- GENETICS_TOOLS → MCP tools + Claude (tools, no Pinecone)
- HYBRID → Pinecone + MCP tools + Claude (full context + tools)
"""

import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime

from .query_classifier import QueryType, get_query_classifier
from .rag_service import get_rag_service
from .traits_enrichment_service import get_traits_service

logger = logging.getLogger(__name__)


class RoutingDecision:
    """Represents a routing decision with metadata."""

    def __init__(
        self,
        query_type: QueryType,
        confidence: float,
        sources_used: List[str],
        response_time_ms: float = 0.0
    ):
        self.query_type = query_type
        self.confidence = confidence
        self.sources_used = sources_used
        self.response_time_ms = response_time_ms
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/analytics."""
        return {
            "query_type": self.query_type.value,
            "confidence": self.confidence,
            "sources_used": self.sources_used,
            "response_time_ms": self.response_time_ms,
            "timestamp": self.timestamp.isoformat()
        }


class QueryRouter:
    """
    Routes queries to appropriate data sources and processing pipeline.

    Optimizes cost and performance by only using necessary data sources.
    """

    def __init__(self):
        self.classifier = get_query_classifier()
        self.rag_service = get_rag_service()
        self.traits_service = get_traits_service()

    async def route_and_execute(
        self,
        query: str,
        user_id: Optional[str] = None,
        user_name: Optional[str] = None,
        page_context: Optional[str] = None,
        conversation_history: Optional[List] = None
    ) -> Dict[str, Any]:
        """
        Classify query and execute appropriate routing strategy.

        Args:
            query: User query string
            user_id: User ID for tracking
            user_name: User name for personalization
            page_context: Current page context
            conversation_history: Previous conversation messages

        Returns:
            {
                "response": str,
                "route_type": str,
                "sources_used": List[str],
                "confidence": float,
                "response_time_ms": float,
                "token_usage": Optional[Dict]
            }
        """
        start_time = time.time()

        # Step 1: Classify query (with user info for token tracking)
        query_type, confidence = await self.classifier.classify(query, user_id, user_name)

        logger.info(
            f"Query classified as {query_type.value} "
            f"(confidence: {confidence:.2f}): '{query[:60]}...'"
        )

        # Step 2: Route based on classification
        try:
            if query_type == QueryType.CONVERSATIONAL:
                result = await self._handle_conversational(
                    query, user_name, conversation_history
                )
            elif query_type == QueryType.KNOWLEDGE:
                result = await self._handle_knowledge(
                    query, user_id, user_name, page_context, conversation_history
                )
            elif query_type == QueryType.GENETICS_TOOLS:
                result = await self._handle_genetics_tools(
                    query, user_name, conversation_history
                )
            else:  # HYBRID
                result = await self._handle_hybrid(
                    query, user_id, user_name, page_context, conversation_history
                )

            # Step 3: Add routing metadata
            response_time_ms = (time.time() - start_time) * 1000

            result.update({
                "route_type": query_type.value,
                "confidence": confidence,
                "response_time_ms": response_time_ms,
            })

            logger.info(
                f"Routed as {query_type.value}, "
                f"sources: {result.get('sources_used', [])}, "
                f"time: {response_time_ms:.0f}ms"
            )

            return result

        except Exception as e:
            logger.error(f"Routing error for {query_type.value}: {e}", exc_info=True)
            raise

    async def _handle_conversational(
        self,
        query: str,
        user_name: Optional[str],
        conversation_history: Optional[List]
    ) -> Dict[str, Any]:
        """
        Handle simple conversational queries.

        No data sources needed - direct Claude response.
        Optimizes for: speed, cost
        """
        from ..ai import get_claude_service

        logger.debug("Routing: CONVERSATIONAL (no data sources)")

        # Simple system prompt for conversational responses
        system_prompt = f"""You are a friendly genetics education assistant named Zigi.
The user just said: "{query}"

Respond naturally and conversationally. Keep it brief and friendly."""

        claude_service = get_claude_service()

        # Generate simple response (no context, no tools)
        response, token_usage = await claude_service.generate_response(
            user_message=query,
            context="",  # No context
            page_context=None,
            user_name=user_name or "there",
            conversation_history=conversation_history or []
        )

        return {
            "response": response,
            "sources_used": ["claude_only"],
            "token_usage": token_usage
        }

    async def _handle_knowledge(
        self,
        query: str,
        user_id: Optional[str],
        user_name: Optional[str],
        page_context: Optional[str],
        conversation_history: Optional[List]
    ) -> Dict[str, Any]:
        """
        Handle knowledge retrieval queries.

        Uses: Pinecone (RAG) + Claude
        Skips: MCP tools
        Optimizes for: relevant context, no tool overhead
        """
        from ..ai import get_claude_service

        logger.debug("Routing: KNOWLEDGE (Pinecone only)")

        # Retrieve context from Pinecone
        rag_context = await self.rag_service.retrieve_context(
            query=query,
            user_id=user_id,
            user_name=user_name
        )

        claude_service = get_claude_service()

        # Generate response with context but NO MCP tools
        response, token_usage = await claude_service.generate_response(
            user_message=query,
            context=rag_context,
            page_context=page_context,
            user_name=user_name or "there",
            conversation_history=conversation_history or []
        )

        sources = ["pinecone", "claude"]
        if rag_context:
            sources.append("rag_context")

        return {
            "response": response,
            "sources_used": sources,
            "token_usage": token_usage
        }

    async def _handle_genetics_tools(
        self,
        query: str,
        user_name: Optional[str],
        conversation_history: Optional[List]
    ) -> Dict[str, Any]:
        """
        Handle genetics tools queries.

        Uses: MCP tools + Traits DB + Claude
        Skips: Pinecone (no semantic search needed)
        Optimizes for: tool availability, no embedding cost
        """
        from ..zygotrix_ai.chat_service import ZygotrixChatService

        logger.debug("Routing: GENETICS_TOOLS (MCP tools only)")

        # Get traits context (small, structured data)
        traits_context = self.traits_service.get_traits_context(query)

        # Use Zygotrix AI service with MCP tools enabled
        # This service has built-in MCP tool support
        chat_service = ZygotrixChatService()

        # Create a minimal request object
        from ...schema.zygotrix_ai import ChatRequest

        # Convert page_context to string if it's an object
        page_context_str = None
        if page_context:
            page_context_str = page_context.pageName if hasattr(page_context, 'pageName') else str(page_context)

        chat_request = ChatRequest(
            message=query,
            stream=False,
            conversation_id=None,  # New conversation
            page_context=page_context_str
        )

        # Create a mock user object
        class MockUser:
            def __init__(self, name: str):
                self.id = "genetics_tools_user"
                self.name = name
                self.user_role = "user"

        mock_user = MockUser(user_name or "User")

        # Process with MCP tools enabled
        response_data, conversation_id, message_id = await chat_service.process_chat_request(
            chat_request=chat_request,
            current_user=mock_user
        )

        return {
            "response": response_data.message.content,
            "sources_used": ["mcp_tools", "traits_db", "claude"],
            "token_usage": response_data.usage.model_dump() if response_data.usage else None,
            "conversation_id": conversation_id,
            "message_id": message_id
        }

    async def _handle_hybrid(
        self,
        query: str,
        user_id: Optional[str],
        user_name: Optional[str],
        page_context: Optional[str],
        conversation_history: Optional[List]
    ) -> Dict[str, Any]:
        """
        Handle hybrid queries requiring both knowledge and tools.

        Uses: Pinecone + MCP tools + Traits DB + Claude
        Optimizes for: comprehensive context, full capabilities
        """
        from ..zygotrix_ai.chat_service import ZygotrixChatService

        logger.debug("Routing: HYBRID (Pinecone + MCP tools)")

        # Step 1: Retrieve knowledge context from Pinecone
        rag_context = await self.rag_service.retrieve_context(
            query=query,
            user_id=user_id,
            user_name=user_name
        )

        # Step 2: Get traits context
        traits_context = self.traits_service.get_traits_context(query)

        # Step 3: Combine contexts
        combined_context = []
        if rag_context:
            combined_context.append(rag_context)
        if traits_context:
            combined_context.append(traits_context)

        context_str = "\n\n".join(combined_context) if combined_context else ""

        # Step 4: Use Zygotrix AI service with full capabilities
        chat_service = ZygotrixChatService()

        from ...schema.zygotrix_ai import ChatRequest

        # Convert page_context to string if it's an object
        page_context_str = None
        if page_context:
            page_context_str = page_context.pageName if hasattr(page_context, 'pageName') else str(page_context)

        chat_request = ChatRequest(
            message=query,
            stream=False,
            conversation_id=None,
            page_context=page_context_str
        )

        class MockUser:
            def __init__(self, user_id: str, name: str):
                self.id = user_id or "hybrid_user"
                self.name = name
                self.user_role = "user"

        mock_user = MockUser(user_id, user_name or "User")

        # Process with full context and MCP tools
        response_data, conversation_id, message_id = await chat_service.process_chat_request(
            chat_request=chat_request,
            current_user=mock_user
        )

        sources = ["pinecone", "mcp_tools", "traits_db", "claude"]
        if rag_context:
            sources.append("rag_context")

        return {
            "response": response_data.message.content,
            "sources_used": sources,
            "token_usage": response_data.usage.model_dump() if response_data.usage else None,
            "conversation_id": conversation_id,
            "message_id": message_id
        }


# Singleton instance
_query_router: Optional[QueryRouter] = None


def get_query_router() -> QueryRouter:
    """Get or create the global query router instance."""
    global _query_router
    if _query_router is None:
        _query_router = QueryRouter()
        logger.info("Initialized QueryRouter")
    return _query_router
