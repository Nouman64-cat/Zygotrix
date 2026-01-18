"""
Deep Research Schemas.

Pydantic models and TypedDicts for the deep research workflow.
"""

from enum import Enum
from typing import Optional, List, Dict, Any, TypedDict
from pydantic import BaseModel, Field
from datetime import datetime


# =============================================================================
# ENUMS
# =============================================================================

class ResearchPhase(str, Enum):
    """Current phase of the research workflow."""
    CLARIFICATION = "clarification"
    RETRIEVAL = "retrieval"
    RERANKING = "reranking"
    SYNTHESIS = "synthesis"
    COMPLETED = "completed"
    ERROR = "error"


class ResearchStatus(str, Enum):
    """Status of a research session."""
    PENDING = "pending"
    NEEDS_CLARIFICATION = "needs_clarification"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


# =============================================================================
# LANGGRAPH STATE
# =============================================================================

class ResearchState(TypedDict, total=False):
    """
    State object for the LangGraph research workflow.
    
    This is passed between nodes and tracks the entire research process.
    """
    # Input
    original_query: str
    user_id: str
    user_name: Optional[str]
    conversation_id: Optional[str]
    
    # Clarification
    clarification_questions: List[Dict[str, Any]]
    user_answers: List[str]
    clarified_query: str
    needs_clarification: bool
    clarification_complete: bool
    
    # Retrieval
    retrieved_chunks: List[Dict[str, Any]]
    retrieval_scores: List[float]
    
    # Reranking
    reranked_chunks: List[Dict[str, Any]]
    rerank_scores: List[float]
    top_k_chunks: int
    
    # Synthesis
    final_response: str
    sources: List[Dict[str, Any]]
    
    # Metadata
    phase: str
    status: str
    error_message: Optional[str]
    iteration_count: int
    max_iterations: int
    visited_nodes: List[str]
    
    # Token tracking
    total_input_tokens: int
    total_output_tokens: int
    model_usage: Dict[str, Dict[str, int]]
    
    # Timing
    started_at: str
    completed_at: Optional[str]
    phase_timings: Dict[str, float]


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class ClarificationQuestion(BaseModel):
    """A clarification question from the AI."""
    id: str
    question: str
    context: Optional[str] = None
    suggested_answers: List[str] = Field(default_factory=list)


class ClarificationAnswer(BaseModel):
    """User's answer to a clarification question."""
    question_id: str
    answer: str


class DeepResearchRequest(BaseModel):
    """Request to start or continue deep research."""
    query: str = Field(min_length=1, max_length=10000)
    conversation_id: Optional[str] = None
    
    # If continuing with answers to clarification questions
    clarification_answers: List[ClarificationAnswer] = Field(default_factory=list)
    
    # Research parameters
    max_sources: int = Field(default=25, ge=1, le=50)
    top_k_reranked: int = Field(default=10, ge=1, le=20)
    
    # Force skip clarification (for simple queries)
    skip_clarification: bool = False


class ResearchSource(BaseModel):
    """A source used in the research with Harvard citation support."""
    id: str
    title: Optional[str] = None
    content_preview: str
    relevance_score: float
    rerank_score: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Harvard-style citation fields
    author: Optional[str] = None
    publication_year: Optional[str] = None  # String to handle various year formats
    publisher: Optional[str] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    isbn: Optional[str] = None
    url: Optional[str] = None
    source_type: Optional[str] = "other"  # 'book', 'journal', 'website', 'paper', 'other'
    page_numbers: Optional[str] = None
    edition: Optional[str] = None
    place_of_publication: Optional[str] = None


class DeepResearchResponse(BaseModel):
    """Response from deep research."""
    session_id: str
    status: ResearchStatus
    phase: ResearchPhase
    
    # If needs clarification
    clarification_questions: List[ClarificationQuestion] = Field(default_factory=list)
    
    # If completed
    response: Optional[str] = None
    sources: List[ResearchSource] = Field(default_factory=list)
    
    # Metadata
    total_sources_found: int = 0
    sources_used: int = 0
    
    # Token usage
    token_usage: Dict[str, Dict[str, int]] = Field(default_factory=dict)
    
    # Timing
    processing_time_ms: int = 0
    
    # Error info
    error_message: Optional[str] = None


class StreamingResearchChunk(BaseModel):
    """A chunk of streaming research response."""
    type: str  # 'phase_update', 'clarification', 'content', 'source', 'done', 'error'
    phase: Optional[ResearchPhase] = None
    content: Optional[str] = None
    clarification: Optional[ClarificationQuestion] = None
    source: Optional[ResearchSource] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
