import { useState, useCallback, useEffect } from "react";
import { chatService } from "../services";
import { generateMessageId } from "../utils";
import type { Message, ChatRequest } from "../types";

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  conversationTitle: string;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  loadConversation: (conversationId: string) => Promise<void>;
  startNewConversation: () => void;
}

export const useChat = (initialConversationId?: string): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [conversationTitle, setConversationTitle] =
    useState<string>("New Conversation");

  // Load an existing conversation
  const loadConversation = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [conversation, messagesResponse] = await Promise.all([
        chatService.getConversation(convId),
        chatService.getMessages(convId),
      ]);

      setConversationId(convId);
      setConversationTitle(conversation.title);
      setMessages(
        messagesResponse.messages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.created_at || Date.now()).getTime(),
        }))
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load conversation";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial conversation if provided
  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, [initialConversationId, loadConversation]);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConversationTitle("New Conversation");
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Create optimistic user message
      const userMessage: Message = {
        id: generateMessageId(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const chatRequest: ChatRequest = {
          conversation_id: conversationId || undefined,
          message: content.trim(),
          page_context: "Chat Interface",
          stream: false,
        };

        const response = await chatService.sendMessage(chatRequest);

        // Update conversation ID if this was a new conversation
        if (!conversationId && response.conversation_id) {
          setConversationId(response.conversation_id);
        }

        // Update conversation title
        if (response.conversation_title) {
          setConversationTitle(response.conversation_title);
        }

        // Add assistant message from response
        const assistantMessage: Message = {
          id: response.message.id,
          conversation_id: response.conversation_id,
          role: "assistant",
          content: response.message.content,
          status: response.message.status,
          metadata: response.message.metadata,
          timestamp: new Date(
            response.message.created_at || Date.now()
          ).getTime(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);

        // Remove the optimistic user message on error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    conversationTitle,
    sendMessage,
    clearMessages,
    setMessages,
    loadConversation,
    startNewConversation,
  };
};
