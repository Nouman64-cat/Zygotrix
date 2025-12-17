import { useState, useCallback } from 'react';
import { chatService, authService } from '../services';
import { generateMessageId } from '../utils';
import type { Message, ChatRequest } from '../types';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
}

export const useChat = (sessionId?: string): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const user = authService.getStoredUser();

        const chatRequest: ChatRequest = {
          message: content.trim(),
          userName: user?.full_name || undefined,
          userId: user?.id,
          sessionId,
          pageContext: {
            pageName: 'Chat Interface',
            description: 'Main chat interface for Zygotrix AI',
            features: [
              'Real-time AI Chat',
              'Conversation History',
              'Context-Aware Responses',
            ],
          },
        };

        const response = await chatService.sendMessage(chatRequest);

        const assistantMessage: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.response,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);

        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setMessages,
  };
};
