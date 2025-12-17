import axiosInstance from '../api/config/axios.config';
import { API_ENDPOINTS } from '../api/constants/api.constants';
import type {
  SendMessageRequest,
  SendMessageResponse,
  Conversation,
  ConversationsResponse,
} from '../../types';

class ChatService {
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await axiosInstance.post<SendMessageResponse>(
      API_ENDPOINTS.CHAT.SEND_MESSAGE,
      data
    );
    return response.data;
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await axiosInstance.get<ConversationsResponse>(
      API_ENDPOINTS.CHAT.GET_CONVERSATIONS
    );
    return response.data.conversations;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await axiosInstance.get<Conversation>(
      API_ENDPOINTS.CHAT.GET_CONVERSATION(id)
    );
    return response.data;
  }

  async createConversation(): Promise<Conversation> {
    const response = await axiosInstance.post<Conversation>(
      API_ENDPOINTS.CHAT.CREATE_CONVERSATION
    );
    return response.data;
  }

  async deleteConversation(id: string): Promise<void> {
    await axiosInstance.delete(API_ENDPOINTS.CHAT.DELETE_CONVERSATION(id));
  }

  async clearHistory(): Promise<void> {
    await axiosInstance.post(API_ENDPOINTS.CHAT.CLEAR_HISTORY);
  }
}

export default new ChatService();
