import type { TokenUsage } from "./auth.types";

// Message roles
export type MessageRole = "user" | "assistant" | "system";

// Message status from backend
export type MessageStatus =
  | "pending"
  | "streaming"
  | "completed"
  | "error"
  | "stopped";

// Message attachment
export interface MessageAttachment {
  id: string;
  type: string;
  name: string;
  url?: string;
  content?: string;
  mime_type?: string;
  size_bytes?: number;
}

// Message metadata (token usage, etc.)
export interface MessageMetadata {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  model?: string;
  provider?: string;
  latency_ms?: number;
  cached?: boolean;
  // Widget data for interactive visualizations
  widget_type?:
  | "breeding_lab"
  | "dna_rna_visualizer"
  | "gwas_results"
  | "deep_research_clarification"
  | "web_search"
  | "scholar_mode";
  breeding_data?: {
    parent1?: any;
    parent2?: any;
    traits?: string[];
    results?: any;
  };
  // Deep research data (handles both clarification and results)
  deep_research_data?: {
    // Clarification fields
    session_id?: string;
    original_query?: string;
    questions?: Array<{
      id: string;
      question: string;
      context?: string;
      suggested_answers: string[];
    }>;
    status?: string;

    // Result fields
    sources?: Array<{
      title: string;
      url?: string;
      content_preview?: string;
      relevance_score?: number;
      rerank_score?: number;
      author?: string;
      published_date?: string;
      // Scholar Mode specific
      source_type?: string; // 'deep_research' | 'web_search'
      metadata?: Record<string, unknown>;
    }>;
    stats?: {
      time_ms: number;
      sources_count: number;
      // Scholar Mode specific
      deep_research_sources?: number;
      web_search_sources?: number;
    };
  };
  // Web search data with sources
  web_search_data?: {
    sources?: Array<{
      title: string;
      url: string;
      snippet?: string;
    }>;
    stats?: {
      time_ms: number;
      sources_count: number;
      search_count: number;
    };
  };
  dna_rna_data?: {
    dna_sequence?: string;
    mrna_sequence?: string;
    operation?: "generate_dna" | "transcribe_to_mrna" | "both";
    metadata?: {
      length?: number;
      gc_content?: number;
      base_counts?: Record<string, number>;
    };
  };
  gwas_data?: {
    job_id: string;
    dataset_id: string;
    analysis_type: string;
    phenotype: string;
    status: string;
    manhattan_data?: {
      chromosomes: Array<{
        chr: number;
        positions: number[];
        p_values: number[];
        labels: string[];
      }>;
    };
    qq_data?: {
      expected: number[];
      observed: number[];
      genomic_inflation_lambda: number;
    };
    top_associations?: Array<{
      rsid: string;
      chromosome: number;
      position: number;
      ref_allele: string;
      alt_allele: string;
      p_value: number;
      beta?: number;
      se?: number;
      maf: number;
      n_samples: number;
    }>;
    summary?: {
      total_snps: number;
      significant_snps_bonferroni: number;
      significant_snps_fdr: number;
      execution_time_seconds?: number;
      genomic_inflation_lambda: number;
    };
  };
  // Performance optimization: estimated wait time for UX feedback
  estimatedWaitMs?: number;
  // Cache hit indicator from backend
  cache_hit?: boolean;
}

// Message from the API
export interface Message {
  id: string;
  conversation_id?: string;
  role: MessageRole;
  content: string;
  status?: MessageStatus;
  version?: number;
  parent_message_id?: string;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  created_at?: string;
  updated_at?: string;
  // Frontend-only properties
  timestamp?: number;
  isStreaming?: boolean;
}

// Conversation settings
export interface ConversationSettings {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  context_window_messages?: number;
  stream_response?: boolean;
}

// Conversation from the API
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  status: "active" | "archived" | "deleted";
  is_pinned: boolean;
  is_starred: boolean;
  folder_id?: string;
  tags: string[];
  settings: ConversationSettings;
  page_context?: string;
  message_count: number;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

// Conversation summary for listing
export interface ConversationSummary {
  id: string;
  user_id: string;
  title: string;
  status: string;
  is_pinned: boolean;
  is_starred: boolean;
  folder_id?: string;
  tags: string[];
  message_count: number;
  last_message_preview?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  // Frontend-only: indicates title is being generated
  is_generating_title?: boolean;
}

// Page context for chat
export interface PageContext {
  pageName?: string;
  description?: string;
  features?: string[];
}

// ============= API REQUEST/RESPONSE MODELS =============

// Request to create/continue a chat (maps to backend ChatRequest)
export interface ChatRequest {
  conversation_id?: string; // If null, creates new conversation
  message: string;
  attachments?: MessageAttachment[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  parent_message_id?: string;
  page_context?: string;
  stream?: boolean;
  // Tools that are explicitly enabled for this message
  enabled_tools?: string[];
  // Legacy fields for backwards compatibility with old API
  userName?: string;
  userId?: string;
  sessionId?: string;
  pageContext?: PageContext;
}

// Response from chat endpoint (maps to backend ChatResponse)
export interface ChatResponse {
  conversation_id: string;
  message: Message;
  conversation_title: string;
  usage?: MessageMetadata;
  // Legacy field for backwards compatibility
  response?: string;
}

// List conversations response
export interface ConversationListResponse {
  conversations: ConversationSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Message list response
export interface MessageListResponse {
  messages: Message[];
  total: number;
  has_more: boolean;
  conversation_id: string;
}

// API error
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Local conversation for localStorage (different from API Conversation)
// This stores messages directly and uses camelCase for compatibility with existing code
export interface LocalConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

// Rate limit status from the API
export interface RateLimitStatus {
  tokens_used: number;
  tokens_remaining: number;
  max_tokens: number;
  reset_time: string | null;
  is_limited: boolean;
  cooldown_active: boolean;
  cooldown_hours: number;
}

// Legacy type alias for backwards compatibility
export type { TokenUsage };
