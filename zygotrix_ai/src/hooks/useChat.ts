import { useState, useCallback, useEffect } from "react";
import { chatService } from "../services";
import { generateMessageId } from "../utils";
import type { Message, ChatRequest, MessageAttachment } from "../types";

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  conversationId: string | null;
  conversationTitle: string;
  sendMessage: (
    content: string,
    attachments?: MessageAttachment[],
    enabledTools?: string[]
  ) => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  loadConversation: (conversationId: string) => Promise<void>;
  startNewConversation: () => void;
}

export const useChat = (initialConversationId?: string): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [conversationTitle, setConversationTitle] =
    useState<string>("New Conversation");

  // Persist messages to localStorage
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      localStorage.setItem(
        `zygotrix_msg_cache_${conversationId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, conversationId]);

  // Load an existing conversation
  const loadConversation = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(null);

    // Try loading from cache first to avoid empty state
    try {
      const cached = localStorage.getItem(`zygotrix_msg_cache_${convId}`);
      if (cached) {
        setMessages(JSON.parse(cached));
      } else {
        setMessages([]);
      }
    } catch (e) {
      setMessages([]);
    }

    try {
      const [conversation, messagesResponse] = await Promise.all([
        chatService.getConversation(convId),
        chatService.getMessages(convId),
      ]);

      setConversationId(convId);
      setConversationTitle(conversation.title);
      const fetchedMessages = messagesResponse.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.created_at || Date.now()).getTime(),
      }));
      setMessages(fetchedMessages);
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
    async (
      content: string,
      attachments?: MessageAttachment[],
      enabledTools?: string[]
    ) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;

      // Create optimistic user message
      const userMessage: Message = {
        id: generateMessageId(),
        role: "user",
        content: content.trim(),
        attachments,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Create placeholder for assistant message (shows loading state)
      const tempMessageId = generateMessageId();
      const placeholderMessage: Message = {
        id: tempMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true, // Used for loading indicator
      };

      setMessages((prev) => [...prev, placeholderMessage]);

      const chatRequest: ChatRequest = {
        conversation_id: conversationId || undefined,
        message: content.trim(),
        attachments,
        page_context: "Chat Interface",
        stream: false, // Disable streaming to enable MCP tools (tools only work in non-streaming mode)
        enabled_tools: enabledTools || [],
      };

      try {
        // Use non-streaming API for MCP tool support
        const response = await chatService.sendMessage(chatRequest);

        // Update conversation ID if this was a new conversation
        if (!conversationId && response.conversation_id) {
          setConversationId(response.conversation_id);
        }

        // Update conversation title
        if (response.conversation_title) {
          setConversationTitle(response.conversation_title);
        }

        // Replace placeholder with actual response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessageId
              ? {
                  ...msg,
                  id: response.message.id,
                  content: response.message.content,
                  isStreaming: false,
                  metadata: response.message.metadata,
                  created_at: response.message.created_at,
                }
              : msg
          )
        );
      } catch (err) {
        console.error("[useChat] Error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);

        // Remove the placeholder on error (keep user message)
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
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
    isStreaming,
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
