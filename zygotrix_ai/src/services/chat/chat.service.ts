import axiosInstance from "../api/config/axios.config";
import { API_ENDPOINTS } from "../api/constants/api.constants";
import type {
  ChatRequest,
  ChatResponse,
  ConversationListResponse,
  MessageListResponse,
  Conversation,
} from "../../types";

class ChatService {
  /**
   * Send a message to the AI. If no conversation_id is provided, creates a new conversation.
   * This uses the Zygotrix AI endpoint which persists conversations to MongoDB.
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await axiosInstance.post<ChatResponse>(
      API_ENDPOINTS.ZYGOTRIX_AI.CHAT,
      {
        conversation_id: request.conversation_id,
        message: request.message,
        attachments: request.attachments || [],
        model: request.model,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        parent_message_id: request.parent_message_id,
        page_context: request.page_context || request.pageContext?.pageName,
        stream: request.stream ?? false, // Non-streaming for now
      }
    );
    return response.data;
  }

  /**
   * Get the list of conversations for the current user
   */
  async getConversations(params?: {
    status?: "active" | "archived" | "deleted";
    folder_id?: string;
    is_starred?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<ConversationListResponse> {
    const response = await axiosInstance.get<ConversationListResponse>(
      API_ENDPOINTS.ZYGOTRIX_AI.CONVERSATIONS,
      { params }
    );
    return response.data;
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await axiosInstance.get<Conversation>(
      API_ENDPOINTS.ZYGOTRIX_AI.CONVERSATION(conversationId)
    );
    return response.data;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    params?: {
      limit?: number;
      before_id?: string;
      after_id?: string;
    }
  ): Promise<MessageListResponse> {
    const response = await axiosInstance.get<MessageListResponse>(
      API_ENDPOINTS.ZYGOTRIX_AI.MESSAGES(conversationId),
      { params }
    );
    return response.data;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(
    conversationId: string,
    permanent = false
  ): Promise<void> {
    await axiosInstance.delete(
      API_ENDPOINTS.ZYGOTRIX_AI.CONVERSATION(conversationId),
      { params: { permanent } }
    );
  }

  /**
   * Update conversation (title, pin, star, etc.)
   */
  async updateConversation(
    conversationId: string,
    updates: {
      title?: string;
      is_pinned?: boolean;
      is_starred?: boolean;
      folder_id?: string | null;
      tags?: string[];
    }
  ): Promise<Conversation> {
    const response = await axiosInstance.patch<Conversation>(
      API_ENDPOINTS.ZYGOTRIX_AI.CONVERSATION(conversationId),
      updates
    );
    return response.data;
  }

  // ============= LEGACY COMPATIBILITY METHODS =============

  /**
   * Get chatbot status (uses legacy endpoint)
   */
  async getChatbotStatus(): Promise<{ enabled: boolean }> {
    const response = await axiosInstance.get<{ enabled: boolean }>(
      API_ENDPOINTS.CHATBOT.STATUS
    );
    return response.data;
  }

  /**
   * Get cache statistics (uses legacy endpoint)
   */
  async getCacheStats(): Promise<unknown> {
    const response = await axiosInstance.get(API_ENDPOINTS.CHATBOT.CACHE_STATS);
    return response.data;
  }

  /**
   * Clear cache (uses legacy endpoint)
   */
  async clearCache(): Promise<void> {
    await axiosInstance.delete(API_ENDPOINTS.CHATBOT.CACHE_CLEAR);
  }

  // ============= RATE LIMITING =============

  /**
   * Get current rate limit status for the authenticated user
   */
  async getRateLimitStatus(): Promise<import("../../types").RateLimitStatus> {
    const response = await axiosInstance.get<
      import("../../types").RateLimitStatus
    >(API_ENDPOINTS.ZYGOTRIX_AI.RATE_LIMIT);
    return response.data;
  }
}

export default new ChatService();
