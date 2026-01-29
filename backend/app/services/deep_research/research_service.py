"""
Deep Research Service using LangGraph.

Implements a multi-step research workflow:
1. Clarification (GPT-4o-mini) - Optional follow-up questions
2. Retrieval (Pinecone) - Get relevant chunks
3. Reranking (Cohere) - Improve precision
4. Synthesis (Claude) - Generate final response

Features:
- Cycle detection and prevention
- Recursive depth limits
- Comprehensive error handling
- Detailed logging
"""

import os
import uuid
import time
import logging
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any, List, Literal, AsyncGenerator

from dotenv import load_dotenv, find_dotenv
from langgraph.graph import StateGraph, END
from langgraph.errors import GraphRecursionError

from .schemas import (
    ResearchState,
    ResearchPhase,
    ResearchStatus,
    DeepResearchRequest,
    DeepResearchResponse,
    ClarificationQuestion,
    ResearchSource,
    StreamingResearchChunk,
)
from .clarification_service import get_clarification_service
from .cohere_reranker import get_cohere_reranker

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

# Configuration
MAX_RECURSION_DEPTH = int(os.getenv("DEEP_RESEARCH_MAX_DEPTH", "10"))
MAX_RETRIEVAL_CHUNKS = int(os.getenv("DEEP_RESEARCH_MAX_CHUNKS", "100"))  # Pinecone retrieval
DEFAULT_TOP_K_RERANKED = int(os.getenv("DEEP_RESEARCH_TOP_K", "20"))  # Cohere rerank output

# Claude configuration
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")


class DeepResearchService:
    """
    LangGraph-based deep research service.
    
    Implements a stateful workflow for conducting in-depth research
    with clarification, retrieval, reranking, and synthesis phases.
    """
    
    def __init__(self):
        """Initialize the deep research service."""
        self.clarification_service = get_clarification_service()
        self.cohere_reranker = get_cohere_reranker()
        self._graph = None
        self._compiled_graph = None
        
        logger.info(
            f"DeepResearchService initialized with "
            f"max_depth={MAX_RECURSION_DEPTH}, "
            f"max_chunks={MAX_RETRIEVAL_CHUNKS}"
        )
    
    @property
    def graph(self):
        """Lazy initialization of the LangGraph workflow."""
        if self._compiled_graph is None:
            self._build_graph()
        return self._compiled_graph
    
    def _build_graph(self):
        """Build the LangGraph workflow."""
        logger.info("Building LangGraph workflow for deep research...")
        
        # Create the state graph
        workflow = StateGraph(ResearchState)
        
        # Add nodes
        workflow.add_node("clarification", self._clarification_node)
        workflow.add_node("await_answers", self._await_answers_node)
        workflow.add_node("retrieval", self._retrieval_node)
        workflow.add_node("reranking", self._reranking_node)
        workflow.add_node("synthesis", self._synthesis_node)
        workflow.add_node("error_handler", self._error_handler_node)
        
        # Set entry point
        workflow.set_entry_point("clarification")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "clarification",
            self._route_after_clarification,
            {
                "await_answers": "await_answers",
                "retrieval": "retrieval",
                "error": "error_handler"
            }
        )
        
        workflow.add_conditional_edges(
            "await_answers",
            self._route_after_answers,
            {
                "retrieval": "retrieval",
                "error": "error_handler"
            }
        )
        
        workflow.add_conditional_edges(
            "retrieval",
            self._route_after_retrieval,
            {
                "reranking": "reranking",
                "synthesis": "synthesis",  # Skip reranking if not available
                "error": "error_handler"
            }
        )
        
        workflow.add_edge("reranking", "synthesis")
        workflow.add_edge("synthesis", END)
        workflow.add_edge("error_handler", END)
        
        # Compile with recursion limit
        self._compiled_graph = workflow.compile()
        
        logger.info("LangGraph workflow compiled successfully")
    
    # =========================================================================
    # GRAPH NODES
    # =========================================================================
    
    async def _clarification_node(self, state: ResearchState) -> ResearchState:
        """
        Clarification node: Analyze query and generate clarifying questions.
        
        Uses GPT-4o-mini to determine if clarification is needed.
        """
        start_time = time.time()
        node_name = "clarification"
        
        logger.info(f"[{node_name}] Processing query: {state['original_query'][:100]}...")
        
        try:
            # Check for cycle
            if not self._check_cycle(state, node_name):
                return self._create_error_state(state, "Cycle detected in clarification node")
            
            # Skip clarification if explicitly requested or answers already provided
            if state.get("clarification_complete") or len(state.get("user_answers", [])) > 0:
                logger.info(f"[{node_name}] Skipping - clarification already complete")
                return {
                    **state,
                    "needs_clarification": False,
                    "clarification_complete": True,
                    "phase": ResearchPhase.RETRIEVAL.value,
                    "phase_timings": {
                        **state.get("phase_timings", {}),
                        node_name: time.time() - start_time
                    }
                }
            
            # Analyze query
            needs_clarification, questions, token_usage = await self.clarification_service.analyze_query(
                state["original_query"]
            )
            
            # Update token tracking
            model_usage = state.get("model_usage", {})
            model_usage["gpt-4o-mini"] = {
                "input_tokens": model_usage.get("gpt-4o-mini", {}).get("input_tokens", 0) + token_usage["input_tokens"],
                "output_tokens": model_usage.get("gpt-4o-mini", {}).get("output_tokens", 0) + token_usage["output_tokens"]
            }
            
            if needs_clarification and questions:
                logger.info(f"[{node_name}] Generated {len(questions)} clarification questions")
                return {
                    **state,
                    "clarification_questions": questions,
                    "needs_clarification": True,
                    "clarification_complete": False,
                    "phase": ResearchPhase.CLARIFICATION.value,
                    "status": ResearchStatus.NEEDS_CLARIFICATION.value,
                    "model_usage": model_usage,
                    "total_input_tokens": state.get("total_input_tokens", 0) + token_usage["input_tokens"],
                    "total_output_tokens": state.get("total_output_tokens", 0) + token_usage["output_tokens"],
                    "phase_timings": {
                        **state.get("phase_timings", {}),
                        node_name: time.time() - start_time
                    }
                }
            else:
                logger.info(f"[{node_name}] No clarification needed, proceeding to retrieval")
                return {
                    **state,
                    "needs_clarification": False,
                    "clarification_complete": True,
                    "clarified_query": state["original_query"],
                    "phase": ResearchPhase.RETRIEVAL.value,
                    "status": ResearchStatus.IN_PROGRESS.value,
                    "model_usage": model_usage,
                    "total_input_tokens": state.get("total_input_tokens", 0) + token_usage["input_tokens"],
                    "total_output_tokens": state.get("total_output_tokens", 0) + token_usage["output_tokens"],
                    "phase_timings": {
                        **state.get("phase_timings", {}),
                        node_name: time.time() - start_time
                    }
                }
                
        except Exception as e:
            logger.error(f"[{node_name}] Error: {e}", exc_info=True)
            return self._create_error_state(state, f"Clarification error: {str(e)}")
    
    async def _await_answers_node(self, state: ResearchState) -> ResearchState:
        """
        Await answers node: Process user's answers to clarification questions.
        
        This is an intermediate state that waits for user input.
        """
        start_time = time.time()
        node_name = "await_answers"
        
        logger.info(f"[{node_name}] Processing user answers...")
        
        try:
            if not self._check_cycle(state, node_name):
                return self._create_error_state(state, "Cycle detected in await_answers node")
            
            user_answers = state.get("user_answers", [])
            questions = state.get("clarification_questions", [])
            
            if not user_answers:
                # No answers yet - return to wait
                logger.info(f"[{node_name}] Waiting for user answers")
                return {
                    **state,
                    "status": ResearchStatus.NEEDS_CLARIFICATION.value,
                    "phase_timings": {
                        **state.get("phase_timings", {}),
                        node_name: time.time() - start_time
                    }
                }
            
            # Build clarified query
            clarified_query, token_usage = await self.clarification_service.build_clarified_query(
                state["original_query"],
                questions,
                user_answers
            )
            
            # Update token tracking
            model_usage = state.get("model_usage", {})
            model_usage["gpt-4o-mini"] = {
                "input_tokens": model_usage.get("gpt-4o-mini", {}).get("input_tokens", 0) + token_usage["input_tokens"],
                "output_tokens": model_usage.get("gpt-4o-mini", {}).get("output_tokens", 0) + token_usage["output_tokens"]
            }
            
            logger.info(f"[{node_name}] Built clarified query: {clarified_query[:100]}...")
            
            return {
                **state,
                "clarified_query": clarified_query,
                "clarification_complete": True,
                "needs_clarification": False,
                "phase": ResearchPhase.RETRIEVAL.value,
                "status": ResearchStatus.IN_PROGRESS.value,
                "model_usage": model_usage,
                "total_input_tokens": state.get("total_input_tokens", 0) + token_usage["input_tokens"],
                "total_output_tokens": state.get("total_output_tokens", 0) + token_usage["output_tokens"],
                "phase_timings": {
                    **state.get("phase_timings", {}),
                    node_name: time.time() - start_time
                }
            }
            
        except Exception as e:
            logger.error(f"[{node_name}] Error: {e}", exc_info=True)
            return self._create_error_state(state, f"Answer processing error: {str(e)}")
    
    async def _retrieval_node(self, state: ResearchState) -> ResearchState:
        """
        Retrieval node: Fetch relevant chunks from Pinecone.
        """
        start_time = time.time()
        node_name = "retrieval"
        
        query = state.get("clarified_query") or state["original_query"]
        logger.info(f"[{node_name}] Retrieving chunks for: {query[:100]}...")
        
        try:
            if not self._check_cycle(state, node_name):
                return self._create_error_state(state, "Cycle detected in retrieval node")
            
            # Import RAG service
            from ..chatbot.rag_service import get_rag_service
            rag_service = get_rag_service()
            
            # Get more chunks than final top_k for better reranking
            top_k_retrieval = state.get("top_k_chunks", DEFAULT_TOP_K_RERANKED) * 4
            top_k_retrieval = min(top_k_retrieval, MAX_RETRIEVAL_CHUNKS)
            
            # Generate embedding and search
            query_embedding = await rag_service.generate_embedding(query)
            
            results = rag_service.index.query(
                vector=query_embedding,
                top_k=top_k_retrieval,
                include_metadata=True
            )
            
            # Convert to list of dicts
            retrieved_chunks = []
            retrieval_scores = []
            
            for match in results.matches:
                chunk = {
                    "id": match.id,
                    "text": match.metadata.get("text", ""),
                    "score": match.score,
                    "metadata": match.metadata
                }
                retrieved_chunks.append(chunk)
                retrieval_scores.append(match.score)
            
            logger.info(f"[{node_name}] Retrieved {len(retrieved_chunks)} chunks")
            
            return {
                **state,
                "retrieved_chunks": retrieved_chunks,
                "retrieval_scores": retrieval_scores,
                "phase": ResearchPhase.RERANKING.value,
                "phase_timings": {
                    **state.get("phase_timings", {}),
                    node_name: time.time() - start_time
                }
            }
            
        except Exception as e:
            logger.error(f"[{node_name}] Error: {e}", exc_info=True)
            return self._create_error_state(state, f"Retrieval error: {str(e)}")
    
    async def _reranking_node(self, state: ResearchState) -> ResearchState:
        """
        Reranking node: Use Cohere to rerank retrieved chunks.
        """
        start_time = time.time()
        node_name = "reranking"
        
        logger.info(f"[{node_name}] Reranking {len(state.get('retrieved_chunks', []))} chunks...")
        
        try:
            if not self._check_cycle(state, node_name):
                return self._create_error_state(state, "Cycle detected in reranking node")
            
            retrieved_chunks = state.get("retrieved_chunks", [])
            
            if not retrieved_chunks:
                logger.warning(f"[{node_name}] No chunks to rerank")
                return {
                    **state,
                    "reranked_chunks": [],
                    "rerank_scores": [],
                    "phase": ResearchPhase.SYNTHESIS.value,
                    "phase_timings": {
                        **state.get("phase_timings", {}),
                        node_name: time.time() - start_time
                    }
                }
            
            query = state.get("clarified_query") or state["original_query"]
            top_k = state.get("top_k_chunks", DEFAULT_TOP_K_RERANKED)
            
            # Rerank using Cohere
            rerank_result = await self.cohere_reranker.rerank_with_metadata(
                query=query,
                documents=retrieved_chunks,
                top_k=top_k,
                text_key="text"
            )
            
            reranked_chunks = rerank_result["documents"]
            rerank_scores = rerank_result["scores"]
            
            logger.info(
                f"[{node_name}] Reranking complete: "
                f"{len(reranked_chunks)} chunks, "
                f"top score: {rerank_scores[0] if rerank_scores else 0:.4f}"
            )
            
            return {
                **state,
                "reranked_chunks": reranked_chunks,
                "rerank_scores": rerank_scores,
                "phase": ResearchPhase.SYNTHESIS.value,
                "phase_timings": {
                    **state.get("phase_timings", {}),
                    node_name: time.time() - start_time
                }
            }
            
        except Exception as e:
            logger.error(f"[{node_name}] Error: {e}", exc_info=True)
            # Fallback: use original chunks without reranking
            logger.warning(f"[{node_name}] Falling back to original retrieval order")
            return {
                **state,
                "reranked_chunks": state.get("retrieved_chunks", [])[:state.get("top_k_chunks", DEFAULT_TOP_K_RERANKED)],
                "rerank_scores": state.get("retrieval_scores", [])[:state.get("top_k_chunks", DEFAULT_TOP_K_RERANKED)],
                "phase": ResearchPhase.SYNTHESIS.value,
                "phase_timings": {
                    **state.get("phase_timings", {}),
                    node_name: time.time() - start_time
                }
            }
    
    async def _synthesis_node(self, state: ResearchState) -> ResearchState:
        """
        Synthesis node: Generate final response using Claude.
        """
        start_time = time.time()
        node_name = "synthesis"
        
        logger.info(f"[{node_name}] Synthesizing response...")
        
        try:
            if not self._check_cycle(state, node_name):
                return self._create_error_state(state, "Cycle detected in synthesis node")
            
            # Get chunks (prefer reranked, fallback to retrieved)
            chunks = state.get("reranked_chunks") or state.get("retrieved_chunks", [])
            
            if not chunks:
                logger.warning(f"[{node_name}] No chunks available for synthesis")
                return {
                    **state,
                    "final_response": "I couldn't find relevant information to answer your research query. Please try rephrasing your question or providing more context.",
                    "sources": [],
                    "phase": ResearchPhase.COMPLETED.value,
                    "status": ResearchStatus.COMPLETED.value,
                    "completed_at": datetime.utcnow().isoformat(),
                    "phase_timings": {
                        **state.get("phase_timings", {}),
                        node_name: time.time() - start_time
                    }
                }
            
            # Build context from chunks
            context_parts = []
            sources = []
            
            MAX_CONTEXT_CHARS = 72000  # Approx 18k tokens (safe buffer for 30k TPM)
            current_chars = 0
            
            for i, chunk in enumerate(chunks):
                text = chunk.get("text", "")
                if not text:
                    continue
                
                metadata = chunk.get("metadata", {})
                
                # Extract citation info
                author = metadata.get("author") or "Unknown Author"
                title = metadata.get("title") or metadata.get("source") or "Untitled"
                year = metadata.get("publication_year") or metadata.get("year") or "n.d."
                
                # Create a smart citation label (e.g. "Smith, 2023")
                # If author is a list or looks like "Smith, J.", handle nicely? 
                # For now, blindly trust the metadata.
                # If author is excessively long (e.g. a whole abstract), truncate it
                if len(author) > 50:
                    author = author[:47] + "..."
                    
                citation_key = f"({author}, {year})"
                
                # Format the chunk with explicit metadata for the model
                # We give it a Source ID (for us) and a Citation Key (for the text)
                chunk_context = f"""[Source {i+1}]
CITATION_KEY: {citation_key}
TITLE: {title}
YEAR: {year}
CONTENT:
{text}
"""
                
                # Check length limit before adding
                chunk_len = len(chunk_context)
                if current_chars + chunk_len > MAX_CONTEXT_CHARS:
                    logger.warning(
                        f"[{node_name}] Context limit reached ({current_chars} chars). "
                        f"Stopping at chunk {i}/{len(chunks)}."
                    )
                    break
                    
                context_parts.append(chunk_context)
                current_chars += chunk_len
                
                # Clean up text for preview - remove reference noise and normalize whitespace
                preview_text = self._clean_content_preview(text)
                
                # Extract citation-relevant fields for Harvard referencing
                sources.append({
                    "id": chunk.get("id", f"source_{i}"),
                    "title": title,
                    "content_preview": preview_text,
                    "relevance_score": chunk.get("score", 0),
                    "rerank_score": chunk.get("rerank_score"),
                    # Citation fields for Harvard-style referencing
                    "author": metadata.get("author"),
                    "publication_year": year if year != "n.d." else None,
                    "publisher": metadata.get("publisher"),
                    "journal": metadata.get("journal"),
                    "doi": metadata.get("doi"),
                    "isbn": metadata.get("isbn"),
                    "url": metadata.get("url") or metadata.get("source_url"),
                    "source_type": metadata.get("source_type", "other"),
                    "page_numbers": metadata.get("page_numbers") or metadata.get("pages"),
                    "edition": metadata.get("edition"),
                    "place_of_publication": metadata.get("place_of_publication") or metadata.get("location"),
                    # Keep full metadata for any additional fields
                    "metadata": metadata
                })

            context = "\n\n".join(context_parts)
            query = state.get("clarified_query") or state["original_query"]
            
            # Generate response using Claude
            response, token_usage = await self._call_claude(query, context)
            
            # Update token tracking
            model_usage = state.get("model_usage", {})
            model_usage[CLAUDE_MODEL] = {
                "input_tokens": model_usage.get(CLAUDE_MODEL, {}).get("input_tokens", 0) + token_usage["input_tokens"],
                "output_tokens": model_usage.get(CLAUDE_MODEL, {}).get("output_tokens", 0) + token_usage["output_tokens"]
            }
            
            logger.info(f"[{node_name}] Synthesis complete: {len(response)} chars, {len(sources)} sources")
            
            return {
                **state,
                "final_response": response,
                "sources": sources,
                "phase": ResearchPhase.COMPLETED.value,
                "status": ResearchStatus.COMPLETED.value,
                "model_usage": model_usage,
                "total_input_tokens": state.get("total_input_tokens", 0) + token_usage["input_tokens"],
                "total_output_tokens": state.get("total_output_tokens", 0) + token_usage["output_tokens"],
                "completed_at": datetime.utcnow().isoformat(),
                "phase_timings": {
                    **state.get("phase_timings", {}),
                    node_name: time.time() - start_time
                }
            }
            
        except Exception as e:
            logger.error(f"[{node_name}] Error: {e}", exc_info=True)
            return self._create_error_state(state, f"Synthesis error: {str(e)}")
    
    async def _error_handler_node(self, state: ResearchState) -> ResearchState:
        """Error handler node: Finalize error state."""
        logger.error(f"[error_handler] Processing error: {state.get('error_message')}")
        return {
            **state,
            "phase": ResearchPhase.ERROR.value,
            "status": ResearchStatus.FAILED.value,
            "completed_at": datetime.utcnow().isoformat()
        }
    
    # =========================================================================
    # CONDITIONAL ROUTING
    # =========================================================================
    
    def _route_after_clarification(self, state: ResearchState) -> Literal["await_answers", "retrieval", "error"]:
        """Route after clarification node."""
        if state.get("error_message"):
            return "error"
        if state.get("needs_clarification") and not state.get("clarification_complete"):
            return "await_answers"
        return "retrieval"
    
    def _route_after_answers(self, state: ResearchState) -> Literal["retrieval", "error"]:
        """Route after await_answers node."""
        if state.get("error_message"):
            return "error"
        return "retrieval"
    
    def _route_after_retrieval(self, state: ResearchState) -> Literal["reranking", "synthesis", "error"]:
        """Route after retrieval node."""
        if state.get("error_message"):
            return "error"
        if self.cohere_reranker.is_available:
            return "reranking"
        return "synthesis"
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _clean_content_preview(self, text: str, max_length: int = 150) -> str:
        """
        Clean up raw chunk text for a more readable content preview.
        
        - Removes reference citations like [99], [1-5], etc.
        - Normalizes whitespace and line breaks
        - Removes bibliography/reference entries
        - Tries to extract complete sentences
        """
        import re
        
        if not text:
            return ""
        
        # Normalize whitespace - replace multiple spaces/newlines with single space
        clean = re.sub(r'\s+', ' ', text).strip()
        
        # Remove citation brackets like [1], [99], [1-5], [1, 2, 3]
        clean = re.sub(r'\[\d+(?:[-–,\s]\d+)*\]', '', clean)
        
        # Remove bibliographic patterns like "vol. 18, no. 10, pp. 1990"
        clean = re.sub(r'vol\.\s*\d+,?\s*(?:no\.\s*\d+,?\s*)?(?:pp?\.\s*[\d–-]+)?', '', clean, flags=re.IGNORECASE)
        
        # Remove year patterns in parentheses that look like citations: (2018), (2019)
        clean = re.sub(r'\(\d{4}\)', '', clean)
        
        # Remove author citation patterns: "H. Ledford," or "D. Baltimore,"
        clean = re.sub(r'[A-Z]\.\s*[A-Z][a-z]+,', '', clean)
        
        # Remove DOI patterns
        clean = re.sub(r'doi:\s*[\S]+', '', clean, flags=re.IGNORECASE)
        
        # Clean up any resulting double spaces
        clean = re.sub(r'\s+', ' ', clean).strip()
        
        # Skip if the text looks like a reference list (contains many commas and periods in short span)
        if clean.count(',') > 5 and len(clean) < 300:
            # Try to find the first meaningful sentence
            sentences = re.split(r'(?<=[.!?])\s+', clean)
            for sent in sentences:
                # Skip very short sentences or ones that look like citations
                if len(sent) > 30 and not re.match(r'^[\[\d]', sent):
                    clean = sent
                    break
        
        # Truncate to max length, trying to end at a word boundary
        if len(clean) > max_length:
            truncated = clean[:max_length]
            # Try to end at a space
            last_space = truncated.rfind(' ')
            if last_space > max_length * 0.7:
                truncated = truncated[:last_space]
            clean = truncated.strip() + "..."
        
        return clean
    
    def _check_cycle(self, state: ResearchState, node_name: str) -> bool:
        """
        Check for cycles and update visited nodes.
        
        Returns False if a cycle is detected.
        """
        visited = state.get("visited_nodes", [])
        iteration_count = state.get("iteration_count", 0)
        max_iterations = state.get("max_iterations", MAX_RECURSION_DEPTH)
        
        # Check iteration limit
        if iteration_count >= max_iterations:
            logger.error(f"Max iterations ({max_iterations}) reached at node: {node_name}")
            return False
        
        # Check for repeated visits (cycle detection)
        # Allow some nodes to be visited multiple times, but not in succession
        if len(visited) >= 2 and visited[-1] == node_name and visited[-2] == node_name:
            logger.error(f"Cycle detected: node '{node_name}' visited consecutively")
            return False
        
        # Update state (will be merged in return)
        visited.append(node_name)
        state["visited_nodes"] = visited
        state["iteration_count"] = iteration_count + 1
        
        return True
    
    def _create_error_state(self, state: ResearchState, error_message: str) -> ResearchState:
        """Create an error state."""
        return {
            **state,
            "error_message": error_message,
            "phase": ResearchPhase.ERROR.value,
            "status": ResearchStatus.FAILED.value
        }
    
    async def _call_claude(self, query: str, context: str) -> tuple[str, Dict[str, int]]:
        """
        Call Claude API to generate the research synthesis.
        """
        import httpx
        
        system_prompt = """You are a research synthesis expert for Zygotrix, a genetics and genomics platform.

Your task is to synthesize information from multiple sources to provide a comprehensive, accurate answer to the user's research query.

GUIDELINES:
1. Synthesize information from all provided sources into a detailed research report.
2. Structure the response with clear headings, subheadings, and bullet points.
3. CITE SOURCES FREQUENTLY. Use the "CITATION_KEY" provided in each source header (e.g., (Smith, 2023) or (Genome Assoc, 2024)).
4. If a CITATION_KEY is not explicitly clear or looks generic, default to [Source N].
5. Do NOT list a bibliography at the end; the system will handle that automatically. Just cite inline.
6. Acknowledge any limitations or conflicting information.
7. Focus on genetics, genomics, and life sciences topics.
8. Be comprehensive and extensive - favor depth over brevity.
9. Use markdown formatting for readability.

Example Citation Style:
"Recent studies have shown that variance in height is largely polygenic (Smith et al., 2023), though environmental factors play a role [Source 2]."
"""

        user_message = f"""Research Query: {query}

Sources:
{context}

Please synthesize the information from these sources to answer the research query comprehensively."""

        headers = {
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        payload = {
            "model": CLAUDE_MODEL,
            "max_tokens": 4096,
            "temperature": 0.3,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}]
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            for attempt in range(3):
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 429 and attempt < 2:
                    wait_time = 2 * (2 ** attempt)
                    logger.warning(f"Claude API rate limit (429) hit. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
                
                response.raise_for_status()
                data = response.json()
                break
        
        content = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                content += block.get("text", "")
        
        token_usage = {
            "input_tokens": data.get("usage", {}).get("input_tokens", 0),
            "output_tokens": data.get("usage", {}).get("output_tokens", 0)
        }
        
        return content, token_usage
    
    # =========================================================================
    # PUBLIC API
    # =========================================================================
    
    async def research(
        self,
        request: DeepResearchRequest,
        user_id: str,
        user_name: Optional[str] = None
    ) -> DeepResearchResponse:
        """
        Execute deep research for a query.
        
        Args:
            request: The research request
            user_id: User's ID
            user_name: Optional user name
            
        Returns:
            DeepResearchResponse with results or clarification questions
        """
        session_id = str(uuid.uuid4())
        start_time = time.time()
        
        logger.info(f"Starting deep research session {session_id} for user {user_id}")
        
        try:
            # Initialize state
            initial_state: ResearchState = {
                "original_query": request.query,
                "user_id": user_id,
                "user_name": user_name,
                "conversation_id": request.conversation_id,
                "clarification_questions": [],
                "user_answers": [a.answer for a in request.clarification_answers],
                "clarified_query": "",
                "needs_clarification": False,
                "clarification_complete": request.skip_clarification or len(request.clarification_answers) > 0,
                "retrieved_chunks": [],
                "retrieval_scores": [],
                "reranked_chunks": [],
                "rerank_scores": [],
                "top_k_chunks": request.top_k_reranked,
                "final_response": "",
                "sources": [],
                "phase": ResearchPhase.CLARIFICATION.value,
                "status": ResearchStatus.PENDING.value,
                "error_message": None,
                "iteration_count": 0,
                "max_iterations": MAX_RECURSION_DEPTH,
                "visited_nodes": [],
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "model_usage": {},
                "started_at": datetime.utcnow().isoformat(),
                "completed_at": None,
                "phase_timings": {}
            }
            
            # Run the graph with recursion limit
            config = {
                "recursion_limit": MAX_RECURSION_DEPTH,
            }
            
            # Execute the workflow
            final_state = None
            async for state in self.graph.astream(initial_state, config=config):
                # Get the last state from the stream
                for node_name, node_state in state.items():
                    final_state = node_state
                    
                    # Check if we need to return early for clarification
                    if (node_state.get("status") == ResearchStatus.NEEDS_CLARIFICATION.value 
                        and node_state.get("clarification_questions")):
                        logger.info(f"Returning for clarification: {len(node_state['clarification_questions'])} questions")
                        return self._build_response(session_id, node_state, start_time)
            
            if final_state is None:
                raise ValueError("No final state from research workflow")
            
            return self._build_response(session_id, final_state, start_time)
            
        except GraphRecursionError as e:
            logger.error(f"Recursion limit reached: {e}")
            return DeepResearchResponse(
                session_id=session_id,
                status=ResearchStatus.FAILED,
                phase=ResearchPhase.ERROR,
                error_message="Research workflow exceeded maximum iterations. Please try a simpler query.",
                processing_time_ms=int((time.time() - start_time) * 1000)
            )
        except Exception as e:
            logger.error(f"Deep research error: {e}", exc_info=True)
            return DeepResearchResponse(
                session_id=session_id,
                status=ResearchStatus.FAILED,
                phase=ResearchPhase.ERROR,
                error_message=f"Research failed: {str(e)}",
                processing_time_ms=int((time.time() - start_time) * 1000)
            )
    
    def _build_response(
        self,
        session_id: str,
        state: ResearchState,
        start_time: float
    ) -> DeepResearchResponse:
        """Build a DeepResearchResponse from the final state."""
        
        # Convert clarification questions
        clarification_questions = []
        for q in state.get("clarification_questions", []):
            clarification_questions.append(ClarificationQuestion(
                id=q.get("id", str(uuid.uuid4())),
                question=q.get("question", ""),
                context=q.get("context"),
                suggested_answers=q.get("suggested_answers", [])
            ))
        
        # Convert sources with Harvard citation fields
        sources = []
        for s in state.get("sources", []):
            sources.append(ResearchSource(
                id=s.get("id", str(uuid.uuid4())),
                title=s.get("title"),
                content_preview=s.get("content_preview", ""),
                relevance_score=s.get("relevance_score", 0),
                rerank_score=s.get("rerank_score"),
                metadata=s.get("metadata", {}),
                # Harvard citation fields
                author=s.get("author"),
                publication_year=str(s.get("publication_year")) if s.get("publication_year") else None,
                publisher=s.get("publisher"),
                journal=s.get("journal"),
                doi=s.get("doi"),
                isbn=s.get("isbn"),
                url=s.get("url"),
                source_type=s.get("source_type", "other"),
                page_numbers=s.get("page_numbers"),
                edition=s.get("edition"),
                place_of_publication=s.get("place_of_publication")
            ))
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        status_value = state.get("status", ResearchStatus.PENDING.value)
        
        # Log analytics for completed, failed, or clarification-needed research
        if status_value in (ResearchStatus.COMPLETED.value, ResearchStatus.FAILED.value, ResearchStatus.NEEDS_CLARIFICATION.value):
            try:
                from .analytics_service import get_deep_research_analytics_service
                analytics_service = get_deep_research_analytics_service()
                
                # Map model_usage to the expected format
                model_usage = state.get("model_usage", {})
                token_usage = {
                    "openai": {
                        "input_tokens": model_usage.get("gpt-4o-mini", {}).get("input_tokens", 0),
                        "output_tokens": model_usage.get("gpt-4o-mini", {}).get("output_tokens", 0)
                    },
                    "claude": {
                        "input_tokens": sum(
                            v.get("input_tokens", 0) for k, v in model_usage.items() 
                            if "claude" in k.lower()
                        ),
                        "output_tokens": sum(
                            v.get("output_tokens", 0) for k, v in model_usage.items() 
                            if "claude" in k.lower()
                        )
                    }
                }
                
                analytics_service.log_usage(
                    user_id=state.get("user_id", ""),
                    user_name=state.get("user_name"),
                    session_id=session_id,
                    query=state.get("original_query", ""),
                    status=status_value,
                    token_usage=token_usage,
                    sources_used=len(sources),
                    processing_time_ms=processing_time_ms,
                    phase=state.get("phase", ""),
                    claude_model=CLAUDE_MODEL
                )
            except Exception as e:
                logger.error(f"Failed to log deep research analytics: {e}")
        
        return DeepResearchResponse(
            session_id=session_id,
            status=ResearchStatus(status_value),
            phase=ResearchPhase(state.get("phase", ResearchPhase.CLARIFICATION.value)),
            clarification_questions=clarification_questions,
            response=state.get("final_response") or None,
            sources=sources,
            total_sources_found=len(state.get("retrieved_chunks", [])),
            sources_used=len(sources),
            token_usage=state.get("model_usage", {}),
            processing_time_ms=processing_time_ms,
            error_message=state.get("error_message")
        )
    
    async def research_stream(
        self,
        request: DeepResearchRequest,
        user_id: str,
        user_name: Optional[str] = None
    ) -> AsyncGenerator[StreamingResearchChunk, None]:
        """
        Execute deep research with streaming updates.
        
        Yields StreamingResearchChunk objects as the research progresses.
        """
        session_id = str(uuid.uuid4())
        start_time = time.time()
        
        logger.info(f"Starting streaming deep research session {session_id}")
        
        try:
            # Initialize state (same as non-streaming)
            initial_state: ResearchState = {
                "original_query": request.query,
                "user_id": user_id,
                "user_name": user_name,
                "conversation_id": request.conversation_id,
                "clarification_questions": [],
                "user_answers": [a.answer for a in request.clarification_answers],
                "clarified_query": "",
                "needs_clarification": False,
                "clarification_complete": request.skip_clarification or len(request.clarification_answers) > 0,
                "retrieved_chunks": [],
                "retrieval_scores": [],
                "reranked_chunks": [],
                "rerank_scores": [],
                "top_k_chunks": request.top_k_reranked,
                "final_response": "",
                "sources": [],
                "phase": ResearchPhase.CLARIFICATION.value,
                "status": ResearchStatus.PENDING.value,
                "error_message": None,
                "iteration_count": 0,
                "max_iterations": MAX_RECURSION_DEPTH,
                "visited_nodes": [],
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "model_usage": {},
                "started_at": datetime.utcnow().isoformat(),
                "completed_at": None,
                "phase_timings": {}
            }
            
            config = {"recursion_limit": MAX_RECURSION_DEPTH}
            current_phase = None
            
            async for state in self.graph.astream(initial_state, config=config):
                for node_name, node_state in state.items():
                    new_phase = node_state.get("phase")
                    
                    # Emit phase update
                    if new_phase != current_phase:
                        current_phase = new_phase
                        yield StreamingResearchChunk(
                            type="phase_update",
                            phase=ResearchPhase(new_phase) if new_phase else None,
                            metadata={"node": node_name}
                        )
                    
                    # Check for clarification
                    if (node_state.get("status") == ResearchStatus.NEEDS_CLARIFICATION.value
                        and node_state.get("clarification_questions")):
                        for q in node_state["clarification_questions"]:
                            yield StreamingResearchChunk(
                                type="clarification",
                                clarification=ClarificationQuestion(
                                    id=q.get("id", str(uuid.uuid4())),
                                    question=q.get("question", ""),
                                    context=q.get("context"),
                                    suggested_answers=q.get("suggested_answers", [])
                                )
                            )
                        yield StreamingResearchChunk(
                            type="done",
                            metadata={"status": "needs_clarification"}
                        )
                        return
                    
                    # Check for completion
                    if node_state.get("status") == ResearchStatus.COMPLETED.value:
                        # Emit sources
                        for s in node_state.get("sources", []):
                            yield StreamingResearchChunk(
                                type="source",
                                source=ResearchSource(
                                    id=s.get("id", str(uuid.uuid4())),
                                    title=s.get("title"),
                                    content_preview=s.get("content_preview", ""),
                                    relevance_score=s.get("relevance_score", 0),
                                    rerank_score=s.get("rerank_score"),
                                    metadata=s.get("metadata", {})
                                )
                            )
                        
                        # Emit content
                        if node_state.get("final_response"):
                            yield StreamingResearchChunk(
                                type="content",
                                content=node_state["final_response"]
                            )
                        
                        yield StreamingResearchChunk(
                            type="done",
                            metadata={
                                "status": "completed",
                                "processing_time_ms": int((time.time() - start_time) * 1000),
                                "token_usage": node_state.get("model_usage", {})
                            }
                        )
                        return
                    
                    # Check for error
                    if node_state.get("status") == ResearchStatus.FAILED.value:
                        yield StreamingResearchChunk(
                            type="error",
                            error=node_state.get("error_message", "Unknown error")
                        )
                        return
            
        except GraphRecursionError as e:
            logger.error(f"Recursion limit reached in stream: {e}")
            yield StreamingResearchChunk(
                type="error",
                error="Research workflow exceeded maximum iterations"
            )
        except Exception as e:
            logger.error(f"Streaming research error: {e}", exc_info=True)
            yield StreamingResearchChunk(
                type="error",
                error=f"Research failed: {str(e)}"
            )


# Global singleton instance
_deep_research_service: Optional[DeepResearchService] = None


def get_deep_research_service() -> DeepResearchService:
    """Get or create the global DeepResearchService instance."""
    global _deep_research_service
    if _deep_research_service is None:
        _deep_research_service = DeepResearchService()
    return _deep_research_service
