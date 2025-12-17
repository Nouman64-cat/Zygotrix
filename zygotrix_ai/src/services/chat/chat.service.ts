import axiosInstance from '../api/config/axios.config';
import { API_ENDPOINTS } from '../api/constants/api.constants';
import type { ChatRequest, ChatResponse } from '../../types';

class ChatService {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await axiosInstance.post<ChatResponse>(
      API_ENDPOINTS.CHATBOT.CHAT,
      request
    );
    return response.data;
  }

  async getChatbotStatus(): Promise<{ enabled: boolean }> {
    const response = await axiosInstance.get<{ enabled: boolean }>(
      API_ENDPOINTS.CHATBOT.STATUS
    );
    return response.data;
  }

  async getCacheStats(): Promise<unknown> {
    const response = await axiosInstance.get(API_ENDPOINTS.CHATBOT.CACHE_STATS);
    return response.data;
  }

  async clearCache(): Promise<void> {
    await axiosInstance.delete(API_ENDPOINTS.CHATBOT.CACHE_CLEAR);
  }
}

export default new ChatService();
