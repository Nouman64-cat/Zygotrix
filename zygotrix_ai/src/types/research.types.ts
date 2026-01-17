/**
 * Deep Research Types
 *
 * Types for the LangGraph-based deep research feature.
 */

// Research phases
export type ResearchPhase =
  | "clarification"
  | "retrieval"
  | "reranking"
  | "synthesis"
  | "completed"
  | "error";

// Research status
export type ResearchStatus =
  | "pending"
  | "needs_clarification"
  | "in_progress"
  | "completed"
  | "failed";

// Clarification question from the AI
export interface ClarificationQuestion {
  id: string;
  question: string;
  context?: string;
  suggested_answers: string[];
}

// User's answer to a clarification question
export interface ClarificationAnswer {
  question_id: string;
  answer: string;
}

// A source used in the research
export interface ResearchSource {
  id: string;
  title?: string;
  content_preview: string;
  relevance_score: number;
  rerank_score?: number;
  metadata: Record<string, unknown>;
}

// Request to start/continue deep research
export interface DeepResearchRequest {
  query: string;
  conversation_id?: string;
  clarification_answers?: ClarificationAnswer[];
  max_sources?: number;
  top_k_reranked?: number;
  skip_clarification?: boolean;
}

// Response from deep research
export interface DeepResearchResponse {
  session_id: string;
  status: ResearchStatus;
  phase: ResearchPhase;
  clarification_questions: ClarificationQuestion[];
  response?: string;
  sources: ResearchSource[];
  total_sources_found: number;
  sources_used: number;
  token_usage: Record<string, { input_tokens: number; output_tokens: number }>;
  processing_time_ms: number;
  error_message?: string;
}

// Streaming chunk types
export type StreamingChunkType =
  | "phase_update"
  | "clarification"
  | "source"
  | "content"
  | "done"
  | "error";

// Streaming research chunk
export interface StreamingResearchChunk {
  type: StreamingChunkType;
  phase?: ResearchPhase;
  content?: string;
  clarification?: ClarificationQuestion;
  source?: ResearchSource;
  metadata?: Record<string, unknown>;
  error?: string;
}

// Deep research service status
export interface DeepResearchServiceStatus {
  status: "operational" | "error";
  cohere_reranker: "available" | "unavailable";
  graph_compiled: boolean;
  max_recursion_depth?: number;
  models: {
    clarification: string;
    reranking?: string;
    synthesis: string;
  };
  error?: string;
}

// Deep research usage info (for PRO users)
export interface DeepResearchUsageInfo {
  used: number;
  remaining: number;
  limit: number;
  can_access: boolean;
  is_pro: boolean;
  message?: string | null;
  error?: string;
}

// Deep research capabilities
export interface DeepResearchCapabilities {
  feature: string;
  version: string;
  description: string;
  workflow: {
    steps: Array<{
      name: string;
      model?: string;
      service?: string;
      description: string;
    }>;
  };
  configuration: {
    max_sources: number;
    default_top_k: number;
    max_clarification_questions: number;
    supported_formats: string[];
  };
  features: string[];
}

// Deep research session state (for frontend state management)
export interface DeepResearchSession {
  sessionId?: string;
  query: string;
  status: ResearchStatus;
  phase: ResearchPhase;
  clarificationQuestions: ClarificationQuestion[];
  userAnswers: ClarificationAnswer[];
  response?: string;
  sources: ResearchSource[];
  isLoading: boolean;
  error?: string;
  processingTimeMs?: number;
  tokenUsage?: Record<string, { input_tokens: number; output_tokens: number }>;
}

// Initial session state
export const initialResearchSession: DeepResearchSession = {
  query: "",
  status: "pending",
  phase: "clarification",
  clarificationQuestions: [],
  userAnswers: [],
  sources: [],
  isLoading: false,
};
