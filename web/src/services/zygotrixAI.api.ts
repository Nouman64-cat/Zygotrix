/**
 * Zygotrix AI API Service
 * ========================
 * Professional chatbot API service with conversation management,
 * streaming support, folders, sharing, and export capabilities.
 */

import API from "./api";

const API_BASE = "/api/zygotrix-ai";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "pending" | "streaming" | "completed" | "error" | "stopped";
export type ConversationStatus = "active" | "archived" | "deleted";
export type FeedbackType = "like" | "dislike";
export type ExportFormat = "json" | "markdown" | "txt";

export interface MessageAttachment {
  id: string;
  type: string;
  name: string;
  url?: string;
  content?: string;
  mime_type?: string;
  size_bytes?: number;
}

export interface MessageMetadata {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  model?: string;
  provider?: string;
  latency_ms?: number;
  finish_reason?: string;
  cached: boolean;
}

export interface MessageFeedback {
  type: FeedbackType;
  comment?: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  version: number;
  parent_message_id?: string;
  attachments: MessageAttachment[];
  metadata?: MessageMetadata;
  feedback?: MessageFeedback;
  created_at: string;
  updated_at?: string;
  sibling_ids: string[];
  selected_sibling_index: number;
}

export interface ConversationSettings {
  model: string;
  provider: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  context_window_messages: number;
  include_system_context: boolean;
  stream_response: boolean;
  enable_markdown: boolean;
  enable_code_highlighting: boolean;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  status: ConversationStatus;
  is_pinned: boolean;
  is_starred: boolean;
  folder_id?: string;
  tags: string[];
  settings: ConversationSettings;
  page_context?: string;
  message_count: number;
  is_shared: boolean;
  share_id?: string;
  shared_at?: string;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface ConversationSummary {
  id: string;
  user_id: string;
  title: string;
  status: ConversationStatus;
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

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  icon?: string;
  parent_folder_id?: string;
  sort_order: number;
  conversation_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplate {
  id: string;
  user_id: string;
  title: string;
  content: string;
  description?: string;
  category?: string;
  is_public: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_window: number;
  max_output: number;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
}

export interface UserChatAnalytics {
  user_id: string;
  total_conversations: number;
  total_messages: number;
  total_tokens_used: number;
  tokens_remaining: number;
  reset_time?: string;
  is_rate_limited: boolean;
  favorite_topics: string[];
  active_days: number;
  average_messages_per_conversation: number;
  model_usage: Record<string, number>;
}

export interface SearchResult {
  conversation: ConversationSummary;
  matched_messages: Array<{
    id: string;
    content_preview: string;
    role: string;
    created_at: string;
  }>;
  relevance_score: number;
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

export interface ChatRequest {
  conversation_id?: string;
  message: string;
  attachments?: MessageAttachment[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  parent_message_id?: string;
  regenerate_message_id?: string;
  page_context?: string;
  stream?: boolean;
}

export interface ChatResponse {
  conversation_id: string;
  message: Message;
  conversation_title: string;
  usage?: MessageMetadata;
}

export interface ConversationListResponse {
  conversations: ConversationSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  has_more: boolean;
  conversation_id: string;
}

export interface FolderListResponse {
  folders: Folder[];
  total: number;
}

export interface ShareResponse {
  share_id: string;
  share_url: string;
  expires_at?: string;
}

export interface ExportResponse {
  format: ExportFormat;
  filename: string;
  content: string;
  mime_type: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export interface StatusResponse {
  enabled: boolean;
  default_model: string;
  available_models: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  features: {
    streaming: boolean;
    conversation_history: boolean;
    message_editing: boolean;
    regeneration: boolean;
    folders: boolean;
    sharing: boolean;
    export: boolean;
    search: boolean;
    prompt_templates: boolean;
  };
}

// =============================================================================
// STREAMING TYPES
// =============================================================================

export interface StreamChunk {
  type: "content" | "metadata" | "error" | "done";
  content?: string;
  metadata?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    model?: string;
    full_content?: string;
  };
  error?: string;
  conversation_id?: string;
  message_id?: string;
}

export type StreamCallback = (chunk: StreamChunk) => void;

// =============================================================================
// API FUNCTIONS - CHAT
// =============================================================================

/**
 * Send a chat message (non-streaming)
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await API.post<ChatResponse>(`${API_BASE}/chat`, {
    ...request,
    stream: false,
  });
  return response.data;
}

/**
 * Send a chat message with streaming response
 */
export async function sendMessageStream(
  request: ChatRequest,
  onChunk: StreamCallback,
  signal?: AbortSignal
): Promise<void> {
  const token = localStorage.getItem("zygotrix_token");

  const response = await fetch(`${import.meta.env.VITE_ZYGOTRIX_API}${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    onChunk({ type: "error", error: error.detail || "Failed to send message" });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onChunk({ type: "error", error: "No response body" });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const chunk = JSON.parse(data) as StreamChunk;
            onChunk(chunk);
          } catch {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Regenerate a response
 */
export async function regenerateResponse(
  conversationId: string,
  messageId: string
): Promise<ChatResponse> {
  const response = await API.post<ChatResponse>(
    `${API_BASE}/chat/${conversationId}/regenerate/${messageId}`
  );
  return response.data;
}

// =============================================================================
// API FUNCTIONS - CONVERSATIONS
// =============================================================================

/**
 * List conversations
 */
export async function listConversations(params?: {
  status?: ConversationStatus;
  folder_id?: string;
  is_starred?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<ConversationListResponse> {
  const response = await API.get<ConversationListResponse>(
    `${API_BASE}/conversations`,
    { params }
  );
  return response.data;
}

/**
 * Create a new conversation
 */
export async function createConversation(data: {
  title?: string;
  settings?: Partial<ConversationSettings>;
  page_context?: string;
  folder_id?: string;
  tags?: string[];
}): Promise<Conversation> {
  const response = await API.post<Conversation>(`${API_BASE}/conversations`, data);
  return response.data;
}

/**
 * Get a specific conversation
 */
export async function getConversation(conversationId: string): Promise<Conversation> {
  const response = await API.get<Conversation>(
    `${API_BASE}/conversations/${conversationId}`
  );
  return response.data;
}

/**
 * Update a conversation
 */
export async function updateConversation(
  conversationId: string,
  data: {
    title?: string;
    is_pinned?: boolean;
    is_starred?: boolean;
    folder_id?: string;
    tags?: string[];
    settings?: Partial<ConversationSettings>;
  }
): Promise<Conversation> {
  const response = await API.patch<Conversation>(
    `${API_BASE}/conversations/${conversationId}`,
    data
  );
  return response.data;
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string,
  permanent = false
): Promise<void> {
  await API.delete(`${API_BASE}/conversations/${conversationId}`, {
    params: { permanent },
  });
}

/**
 * Archive a conversation
 */
export async function archiveConversation(conversationId: string): Promise<void> {
  await API.post(`${API_BASE}/conversations/${conversationId}/archive`);
}

/**
 * Restore a conversation
 */
export async function restoreConversation(conversationId: string): Promise<void> {
  await API.post(`${API_BASE}/conversations/${conversationId}/restore`);
}

// =============================================================================
// API FUNCTIONS - MESSAGES
// =============================================================================

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  params?: {
    limit?: number;
    before_id?: string;
    after_id?: string;
  }
): Promise<MessageListResponse> {
  const response = await API.get<MessageListResponse>(
    `${API_BASE}/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
}

/**
 * Update a message (edit)
 */
export async function updateMessage(
  messageId: string,
  content: string
): Promise<Message> {
  const response = await API.patch<Message>(`${API_BASE}/messages/${messageId}`, {
    content,
  });
  return response.data;
}

/**
 * Add feedback to a message
 */
export async function addMessageFeedback(
  messageId: string,
  feedbackType: FeedbackType,
  comment?: string
): Promise<void> {
  await API.post(`${API_BASE}/messages/${messageId}/feedback`, null, {
    params: { feedback_type: feedbackType, comment },
  });
}

// =============================================================================
// API FUNCTIONS - FOLDERS
// =============================================================================

/**
 * List folders
 */
export async function listFolders(): Promise<FolderListResponse> {
  const response = await API.get<FolderListResponse>(`${API_BASE}/folders`);
  return response.data;
}

/**
 * Create a folder
 */
export async function createFolder(data: {
  name: string;
  color?: string;
  icon?: string;
  parent_folder_id?: string;
}): Promise<Folder> {
  const response = await API.post<Folder>(`${API_BASE}/folders`, data);
  return response.data;
}

/**
 * Update a folder
 */
export async function updateFolder(
  folderId: string,
  data: {
    name?: string;
    color?: string;
    icon?: string;
    sort_order?: number;
  }
): Promise<Folder> {
  const response = await API.patch<Folder>(`${API_BASE}/folders/${folderId}`, data);
  return response.data;
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string): Promise<void> {
  await API.delete(`${API_BASE}/folders/${folderId}`);
}

// =============================================================================
// API FUNCTIONS - SHARING
// =============================================================================

/**
 * Share a conversation
 */
export async function shareConversation(
  conversationId: string,
  data?: {
    share_type?: string;
    expires_in_days?: number;
  }
): Promise<ShareResponse> {
  const response = await API.post<ShareResponse>(
    `${API_BASE}/conversations/${conversationId}/share`,
    data || {}
  );
  return response.data;
}

/**
 * Unshare a conversation
 */
export async function unshareConversation(conversationId: string): Promise<void> {
  await API.delete(`${API_BASE}/conversations/${conversationId}/share`);
}

/**
 * Get a shared conversation (public)
 */
export async function getSharedConversation(shareId: string): Promise<{
  conversation: Conversation;
  messages: Message[];
}> {
  const response = await API.get(`${API_BASE}/shared/${shareId}`);
  return response.data;
}

// =============================================================================
// API FUNCTIONS - EXPORT
// =============================================================================

/**
 * Export a conversation
 */
export async function exportConversation(
  conversationId: string,
  data?: {
    format?: ExportFormat;
    include_metadata?: boolean;
    include_timestamps?: boolean;
  }
): Promise<ExportResponse> {
  const response = await API.post<ExportResponse>(
    `${API_BASE}/conversations/${conversationId}/export`,
    data || {}
  );
  return response.data;
}

// =============================================================================
// API FUNCTIONS - SEARCH
// =============================================================================

/**
 * Search conversations
 */
export async function searchConversations(data: {
  query: string;
  search_in?: string[];
  folder_id?: string;
  status?: ConversationStatus;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}): Promise<SearchResponse> {
  const response = await API.post<SearchResponse>(`${API_BASE}/search`, data);
  return response.data;
}

// =============================================================================
// API FUNCTIONS - ANALYTICS
// =============================================================================

/**
 * Get user analytics
 */
export async function getUserAnalytics(): Promise<UserChatAnalytics> {
  const response = await API.get<UserChatAnalytics>(`${API_BASE}/analytics`);
  return response.data;
}

// =============================================================================
// API FUNCTIONS - TEMPLATES
// =============================================================================

/**
 * List prompt templates
 */
export async function listTemplates(params?: {
  category?: string;
  include_public?: boolean;
}): Promise<{ templates: PromptTemplate[]; total: number }> {
  const response = await API.get(`${API_BASE}/templates`, { params });
  return response.data;
}

/**
 * Create a prompt template
 */
export async function createTemplate(data: {
  title: string;
  content: string;
  description?: string;
  category?: string;
  is_public?: boolean;
}): Promise<PromptTemplate> {
  const response = await API.post<PromptTemplate>(`${API_BASE}/templates`, data);
  return response.data;
}

/**
 * Use a template (increment count)
 */
export async function useTemplate(templateId: string): Promise<void> {
  await API.post(`${API_BASE}/templates/${templateId}/use`);
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  await API.delete(`${API_BASE}/templates/${templateId}`);
}

// =============================================================================
// API FUNCTIONS - STATUS & MODELS
// =============================================================================

/**
 * Get chatbot status and features
 */
export async function getStatus(): Promise<StatusResponse> {
  const response = await API.get<StatusResponse>(`${API_BASE}/status`);
  return response.data;
}

/**
 * Get available AI models
 */
export async function getModels(): Promise<{ models: AIModel[] }> {
  const response = await API.get(`${API_BASE}/models`);
  return response.data;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Download exported content
 */
export function downloadExport(exportData: ExportResponse): void {
  const blob = new Blob([exportData.content], { type: exportData.mime_type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportData.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy share link to clipboard
 */
export async function copyShareLink(shareUrl: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch {
    return false;
  }
}
