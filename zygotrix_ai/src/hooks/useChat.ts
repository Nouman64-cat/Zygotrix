import { useState, useCallback, useEffect, useRef } from "react";
import { chatService } from "../services";
import { generateMessageId } from "../utils";
import type { Message, ChatRequest } from "../types";

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [conversationTitle, setConversationTitle] =
    useState<string>("New Conversation");

  // RAF throttling for streaming updates
  const chunkBuffer = useRef<string>("");
  const updateScheduled = useRef(false);
  const streamingMessageId = useRef<string>("");

  // Load an existing conversation
  const loadConversation = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(null);
    setMessages([]); // Clear messages to show loading state
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

      // Create placeholder for streaming message
      const tempMessageId = generateMessageId();
      streamingMessageId.current = tempMessageId;

      const placeholderMessage: Message = {
        id: tempMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, placeholderMessage]);
      setIsStreaming(true);

      const chatRequest: ChatRequest = {
        conversation_id: conversationId || undefined,
        message: content.trim(),
        page_context: "Chat Interface",
        stream: true, // Enable streaming
      };

      // RAF-throttled update function
      const scheduleUpdate = () => {
        if (!updateScheduled.current) {
          updateScheduled.current = true;
          requestAnimationFrame(() => {
            const contentToAdd = chunkBuffer.current;
            chunkBuffer.current = "";
            updateScheduled.current = false;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingMessageId.current
                  ? { ...msg, content: msg.content + contentToAdd }
                  : msg
              )
            );
          });
        }
      };

      await chatService.sendMessageStreaming(
        chatRequest,
        // onChunk callback
        (chunk) => {
          if (chunk.type === "content") {
            chunkBuffer.current += chunk.content || "";
            scheduleUpdate();
          }
        },
        // onComplete callback
        (response) => {
          setIsStreaming(false);
          setIsLoading(false);

          // Update conversation ID if this was a new conversation
          if (!conversationId && response.conversation_id) {
            setConversationId(response.conversation_id);
          }

          // Update conversation title
          if (response.conversation_title) {
            setConversationTitle(response.conversation_title);
          }

          // Flush any remaining buffer content and finalize the message
          const finalContent = chunkBuffer.current;
          const msgId = streamingMessageId.current;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === msgId
                ? {
                  ...msg,
                  id: response.message.id,
                  // Use the full content from response, or append remaining buffer
                  content: response.message.content || (msg.content + finalContent),
                  isStreaming: false,
                  metadata: response.message.metadata,
                  created_at: response.message.created_at,
                }
                : msg
            )
          );

          // Clear refs
          chunkBuffer.current = "";
          streamingMessageId.current = "";
        },
        // onError callback
        (error) => {
          console.error("[useChat] Streaming error:", error.message);
          setError(error.message);
          setIsStreaming(false);
          setIsLoading(false);

          // Remove the streaming placeholder on error (keep user message)
          const streamingId = streamingMessageId.current;
          if (streamingId) {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== streamingId)
            );
          }

          // Clear refs
          chunkBuffer.current = "";
          streamingMessageId.current = "";
        }
      );
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
