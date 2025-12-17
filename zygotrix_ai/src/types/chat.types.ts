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
}

// Legacy type alias for backwards compatibility
export type { TokenUsage };
