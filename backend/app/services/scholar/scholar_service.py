"""
Scholar Mode Service for Zygotrix AI.

Combines Deep Research (Pinecone RAG), Web Search (Claude), and Cohere Reranking
to produce comprehensive, well-cited research responses.

Flow:
1. Perform Deep Research (Pinecone retrieval)
2. Perform Web Search (Claude's web search tool)
3. Combine all results and rerank with Cohere
4. Synthesize final response with citations using Claude

This is a PRO-only feature with usage tracking.
"""

import os
import logging
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from bson import ObjectId
from dataclasses import dataclass

import httpx
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

# Configuration
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
SCHOLAR_MODEL = os.getenv("SCHOLAR_MODEL", "claude-3-5-haiku-latest")


@dataclass
class ScholarSource:
    """A source from scholar mode research."""
    title: str
    url: Optional[str] = None
    content_preview: Optional[str] = None
    source_type: str = "unknown"  # 'deep_research', 'web_search'
    relevance_score: Optional[float] = None
    rerank_score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "url": self.url,
            "content_preview": self.content_preview,
            "source_type": self.source_type,
            "relevance_score": self.relevance_score,
            "rerank_score": self.rerank_score,
            "metadata": self.metadata or {}
        }


@dataclass
class ScholarResponse:
    """Response from scholar mode research."""
    response: str
    sources: List[ScholarSource]
    total_sources_found: int
    sources_used: int
    deep_research_sources: int
    web_search_sources: int
    processing_time_ms: int
    token_usage: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class ScholarService:
    """
    Service for Scholar Mode - comprehensive research with multiple data sources.
    
    Features:
    - Combines Deep Research (Pinecone RAG) and Web Search
    - Reranks all sources using Cohere for optimal relevance
    - Synthesizes response with proper citations
    - PRO-only access control
    - Usage tracking for billing
    """
    
    def __init__(self, db=None):
        """
        Initialize the scholar service.
        
        Args:
            db: MongoDB database instance (optional, defaults to singleton)
        """
        self.api_key = CLAUDE_API_KEY
        self.model = SCHOLAR_MODEL
        
        if db is None:
            from ..common import get_database
            self._db = get_database()
        else:
            self._db = db
        
        if not self.api_key:
            logger.warning("CLAUDE_API_KEY not configured - scholar mode will be disabled")
    
    @property
    def is_available(self) -> bool:
        """Check if scholar mode is available."""
        return self.api_key is not None and self.api_key.strip() != ""
    
    async def check_access(self, user_id: str) -> Tuple[bool, str, int]:
        """
        Check if user has access to scholar mode (PRO feature with monthly limit).
        
        Args:
            user_id: The user's ID
            
        Returns:
            Tuple of (can_access, reason, remaining_count or -1 if unlimited)
        """
        from ..auth.subscription_service import get_subscription_service
        
        subscription_service = get_subscription_service()
        return subscription_service.check_scholar_mode_access(user_id)
    
    async def research(
        self,
        query: str,
        user_id: str,
        user_name: Optional[str] = None,
        max_deep_research_sources: int = 10,   # Reduced for cost/speed
        max_web_search_sources: int = 3,      # Reduced for cost/speed
        top_k_reranked: int = 8,  # Reduced from 15 for faster synthesis
        max_tokens: int = 4096,  # Reduced from 8192 for faster response
        temperature: float = 0.7
    ) -> ScholarResponse:
        """
        Perform comprehensive scholar research.
        
        Args:
            query: The research query
            user_id: User ID for tracking
            user_name: Optional user name for logging
            max_deep_research_sources: Max sources from Pinecone RAG
            max_web_search_sources: Max sources from web search
            top_k_reranked: Number of top sources after reranking
            max_tokens: Maximum tokens for response
            temperature: Temperature setting
            
        Returns:
            ScholarResponse with synthesized response and sources
        """
        start_time = time.perf_counter()
        total_input_tokens = 0
        total_output_tokens = 0
        
        logger.info(f"🎓 Scholar Mode research started for user {user_id}: {query[:100]}...")
        
        all_sources: List[ScholarSource] = []
        deep_research_count = 0
        web_search_count = 0
        
        try:
            # Step 1: Perform Deep Research (Pinecone RAG)
            logger.info("🔬 Step 1: Starting Deep Research...")
            deep_research_sources = await self._get_deep_research_sources(
                query, user_id, max_deep_research_sources
            )
            deep_research_count = len(deep_research_sources)
            all_sources.extend(deep_research_sources)
            logger.info(f"📚 Deep Research returned {deep_research_count} sources")
            
            # Step 2: Perform Web Search (Conditional)
            # Check if we have enough high-quality sources from Deep Research to skip expensive Web Search
            # Threshold 0.82 implies very high relevance in vector space
            high_quality_dr_sources = [s for s in deep_research_sources if (s.relevance_score or 0) > 0.82]
            skip_web_search = len(high_quality_dr_sources) >= 4
            
            web_search_sources = []
            web_metadata = {}
            
            if skip_web_search:
                logger.info(f"🌐 Skipping Web Search: Found {len(high_quality_dr_sources)} high-quality knowledge base sources.")
            else:
                logger.info("🌐 Step 2: Starting Web Search (insufficient high-confidence internal sources)...")
                web_search_sources, web_metadata = await self._get_web_search_sources(
                    query, user_id, user_name
                )
            
            web_search_count = len(web_search_sources)
            all_sources.extend(web_search_sources)
            total_input_tokens += web_metadata.get("input_tokens", 0)
            total_output_tokens += web_metadata.get("output_tokens", 0)
            
            if not skip_web_search:
                logger.info(f"🌐 Web Search returned {web_search_count} sources")
            
            # Step 3: Rerank all sources with Cohere
            logger.info("📊 Step 3: Reranking with Cohere...")
            reranked_sources = await self._rerank_sources(
                query, all_sources, top_k_reranked
            )
            logger.info(f"📊 Reranking complete: {len(reranked_sources)} top sources selected")
            
            # Step 4: Synthesize response with Claude
            logger.info("✨ Step 4: Synthesizing response with Claude...")
            response_content, synthesis_metadata = await self._synthesize_response(
                query, reranked_sources, max_tokens, temperature
            )
            total_input_tokens += synthesis_metadata.get("input_tokens", 0)
            total_output_tokens += synthesis_metadata.get("output_tokens", 0)
            logger.info("✅ Synthesis complete")
            
            processing_time_ms = int((time.perf_counter() - start_time) * 1000)
            
            # Record usage
            await self._record_usage(
                user_id=user_id,
                user_name=user_name,
                input_tokens=total_input_tokens,
                output_tokens=total_output_tokens,
                deep_research_sources=deep_research_count,
                web_search_sources=web_search_count,
                query_preview=query[:100]
            )
            
            logger.info(
                f"✅ Scholar Mode complete | "
                f"Deep Research: {deep_research_count} | "
                f"Web Search: {web_search_count} | "
                f"Final Sources: {len(reranked_sources)} | "
                f"Time: {processing_time_ms}ms"
            )
            
            return ScholarResponse(
                response=response_content,
                sources=reranked_sources,
                total_sources_found=len(all_sources),
                sources_used=len(reranked_sources),
                deep_research_sources=deep_research_count,
                web_search_sources=web_search_count,
                processing_time_ms=processing_time_ms,
                token_usage={
                    "input_tokens": total_input_tokens,
                    "output_tokens": total_output_tokens,
                    "total_tokens": total_input_tokens + total_output_tokens
                }
            )
            
        except Exception as e:
            logger.error(f"Scholar Mode error: {e}", exc_info=True)
            processing_time_ms = int((time.perf_counter() - start_time) * 1000)
            
            return ScholarResponse(
                response="",
                sources=[],
                total_sources_found=0,
                sources_used=0,
                deep_research_sources=0,
                web_search_sources=0,
                processing_time_ms=processing_time_ms,
                token_usage={},
                error_message=str(e)
            )
    
    async def _get_deep_research_sources(
        self,
        query: str,
        user_id: str,
        max_sources: int
    ) -> List[ScholarSource]:
        """Get sources from Deep Research (Pinecone RAG)."""
        try:
            from ..chatbot.rag_service import get_rag_service
            
            rag_service = get_rag_service()
            
            # Get chunks from Pinecone
            chunks = await rag_service.retrieve_chunks(
                query=query,
                user_id=user_id,
                top_k=max_sources
            )
            
            sources = []
            for chunk in chunks:
                source = ScholarSource(
                    title=chunk.get("metadata", {}).get("title", "Research Document"),
                    url=chunk.get("metadata", {}).get("url"),
                    content_preview=chunk.get("text", "")[:300] if chunk.get("text") else None,  # Reduced from 500
                    source_type="deep_research",
                    relevance_score=chunk.get("score"),
                    metadata=chunk.get("metadata", {})
                )
                sources.append(source)
            
            return sources
            
        except Exception as e:
            logger.error(f"Error getting deep research sources: {e}", exc_info=True)
            return []
    
    async def _get_web_search_sources(
        self,
        query: str,
        user_id: str,
        user_name: Optional[str]
    ) -> Tuple[List[ScholarSource], Dict[str, Any]]:
        """Get sources from Web Search."""
        try:
            from ..web_search import get_web_search_service
            
            web_search_service = get_web_search_service()
            
            if not web_search_service.is_available:
                logger.warning("Web search service not available")
                return [], {}
            
            # Perform web search
            response_text, metadata = await web_search_service.search(
                query=query,
                user_id=user_id,
                user_name=user_name,
                max_tokens=2048,  # Shorter for source extraction
                temperature=0.5
            )
            
            sources = []
            raw_sources = metadata.get("sources", [])
            
            for raw_source in raw_sources:
                source = ScholarSource(
                    title=raw_source.get("title", "Web Source"),
                    url=raw_source.get("url"),
                    content_preview=raw_source.get("snippet", "")[:300] if raw_source.get("snippet") else None,  # Reduced from 500
                    source_type="web_search",
                    metadata=raw_source
                )
                sources.append(source)
            
            return sources, metadata
            
        except Exception as e:
            logger.error(f"Error getting web search sources: {e}", exc_info=True)
            return [], {}
    
    async def _rerank_sources(
        self,
        query: str,
        sources: List[ScholarSource],
        top_k: int
    ) -> List[ScholarSource]:
        """Rerank sources using Cohere."""
        if not sources:
            return []
        
        try:
            from ..deep_research.cohere_reranker import get_cohere_reranker
            
            reranker = get_cohere_reranker()
            
            if not reranker.is_available:
                logger.warning("Cohere reranker not available, returning original order")
                return sources[:top_k]
            
            # Prepare documents for reranking
            documents = []
            for source in sources:
                doc_text = f"{source.title}"
                if source.content_preview:
                    doc_text += f": {source.content_preview}"
                documents.append({
                    "text": doc_text,
                    "source": source
                })
            
            # Rerank
            reranked_docs = await reranker.rerank_documents(
                query=query,
                documents=documents,
                top_k=min(top_k, len(documents)),
                text_key="text"
            )
            
            # Extract sources with rerank scores
            reranked_sources = []
            for doc in reranked_docs:
                source = doc.get("source")
                if source:
                    source.rerank_score = doc.get("rerank_score", 0.0)
                    reranked_sources.append(source)
            
            return reranked_sources
            
        except Exception as e:
            logger.error(f"Error reranking sources: {e}", exc_info=True)
            return sources[:top_k]
    
    async def _synthesize_response(
        self,
        query: str,
        sources: List[ScholarSource],
        max_tokens: int,
        temperature: float
    ) -> Tuple[str, Dict[str, Any]]:
        """Synthesize the final response using Claude."""
        
        # Build context from sources - truncate content to save tokens
        context_parts = []
        MAX_CONTEXT_CHARS = 60000  # Approx 15k tokens safe limit
        current_chars = 0
        
        for i, source in enumerate(sources, 1):
            source_text = f"[Source {i}] {source.title}"
            if source.url:
                source_text += f" ({source.url})"
            source_text += f"\nType: {source.source_type}"
            if source.content_preview:
                # Truncate to first 400 chars to allow decent context but save space
                preview = source.content_preview[:400]
                source_text += f"\nContent: {preview}"
            
            # Check context size
            if current_chars + len(source_text) > MAX_CONTEXT_CHARS:
                logger.warning(f"Scholar synthesis context full ({current_chars}/{MAX_CONTEXT_CHARS}). Stopping at source {i}.")
                break
            
            context_parts.append(source_text)
            current_chars += len(source_text)
        
        context = "\n\n".join(context_parts)
        
        # Build system prompt for scholarly synthesis
        system_prompt = """You are Zygotrix, an elite AI specialized in Genetics, Genomics, and Bioinformatics.
You are operating in 'Scholar Mode', a high-precision research pipeline that aggregates data from academic repositories (Deep Research) and live web data (Web Search).

Your Mission:
Synthesize the provided sources into a Nature-quality research summary that answers the user's query with extreme accuracy.

Response Structure:
1. **Executive Summary**: A 2-3 sentence direct answer.
2. **Deep Dive**: Detailed technical analysis (mechanism of action, biological pathways, genetic variants).
3. **Clinical/Practical Implications**: How this applies to gene therapy, medicine, or research.
4. **Ethical & Societal Context**: Address any bioethical, religious, or regulatory considerations (crucial for CRISPR/Gene Therapy topics).
5. **Key Sources**: Briefly highlight the most influential papers/sources used.

Guidelines:
- **Cite Everything**: Use inline citations like [Source 1], [Source 3] for every specific claim.
- **Be Critical**: If sources conflict, explicitly mention the controversy.
- **No Fluff**: Get straight to the science. Use professional terminology but explain complex concepts briefly.
- **Markdown**: Use bolding for key terms, tables for comparisons if data permits.

If the provided sources are insufficient to answer specific parts of the query, state this clearly rather than hallucinating."""

        # Build user message
        user_message = f"""Research Query: {query}

Sources (ranked by relevance):
{context}

Please provide a comprehensive, well-cited response to the research query based on these sources."""

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    CLAUDE_API_URL,
                    headers={
                        "x-api-key": self.api_key,
                        "content-type": "application/json",
                        "anthropic-version": ANTHROPIC_VERSION,
                    },
                    json={
                        "model": self.model,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "system": system_prompt,
                        "messages": [
                            {"role": "user", "content": user_message}
                        ]
                    }
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"Claude API error: {response.status_code} - {error_text}")
                    return f"Error synthesizing response: {error_text}", {"error": error_text}
                
                data = response.json()
                
                content_blocks = data.get("content", [])
                usage = data.get("usage", {})
                
                response_text = ""
                for block in content_blocks:
                    if block.get("type") == "text":
                        response_text += block.get("text", "")
                
                return response_text, {
                    "input_tokens": usage.get("input_tokens", 0),
                    "output_tokens": usage.get("output_tokens", 0),
                    "model": self.model
                }
                
        except Exception as e:
            logger.error(f"Error synthesizing response: {e}", exc_info=True)
            return f"Error: {str(e)}", {"error": str(e)}
    
    async def _record_usage(
        self,
        user_id: str,
        user_name: Optional[str],
        input_tokens: int,
        output_tokens: int,
        deep_research_sources: int,
        web_search_sources: int,
        query_preview: str
    ):
        """Record scholar mode usage for billing and monthly limit tracking."""
        try:
            # Calculate cost (Scholar Mode combines multiple services)
            # Token costs (Claude Sonnet pricing: $3/1M input, $15/1M output)
            input_cost = (input_tokens / 1_000_000) * 3.0
            output_cost = (output_tokens / 1_000_000) * 15.0
            
            # Source costs (Cohere reranking: ~$2 per 1000 documents)
            source_cost = ((deep_research_sources + web_search_sources) / 1000) * 2.0
            
            total_cost = input_cost + output_cost + source_cost
            
            # Record in scholar_usage collection
            usage_record = {
                "user_id": user_id,
                "user_name": user_name,
                "timestamp": datetime.now(timezone.utc),
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "deep_research_sources": deep_research_sources,
                "web_search_sources": web_search_sources,
                "query_preview": query_preview,
                "token_cost": input_cost + output_cost,
                "source_cost": source_cost,
                "total_cost": total_cost,
                "model": self.model
            }
            
            self._db.scholar_usage.insert_one(usage_record)
            
            # Also update user's aggregate usage
            try:
                query_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
            except Exception:
                query_id = user_id
                
            self._db.users.update_one(
                {"_id": query_id},
                {
                    "$inc": {
                        "scholar_usage.total_queries": 1,
                        "scholar_usage.total_cost": total_cost
                    },
                    "$set": {
                        "scholar_usage.last_used": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Record usage for monthly limit tracking via subscription service
            from ..auth.subscription_service import get_subscription_service
            subscription_service = get_subscription_service()
            subscription_service.record_scholar_mode_usage(user_id)
            
            logger.info(
                f"📊 Scholar Mode usage recorded | "
                f"User: {user_id} | "
                f"Cost: ${total_cost:.4f}"
            )
            
        except Exception as e:
            logger.error(f"Failed to record scholar mode usage: {e}")


# Global singleton instance
_scholar_service: Optional[ScholarService] = None


def get_scholar_service() -> ScholarService:
    """Get or create the global ScholarService instance."""
    global _scholar_service
    if _scholar_service is None:
        _scholar_service = ScholarService()
    return _scholar_service
