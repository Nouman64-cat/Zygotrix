import { useState, useCallback, useEffect, useRef } from "react";
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

// Debounce delay in milliseconds - prevents duplicate rapid submissions
const SEND_DEBOUNCE_MS = 300;

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

  // Ref to track pending request and prevent duplicates
  const pendingRequestRef = useRef<string | null>(null);
  const lastSendTimeRef = useRef<number>(0);

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

    // Performance mark for monitoring
    if (typeof performance !== "undefined") {
      performance.mark("load-conversation-start");
    }

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

      // Performance measure
      if (typeof performance !== "undefined") {
        performance.mark("load-conversation-end");
        performance.measure(
          "load-conversation",
          "load-conversation-start",
          "load-conversation-end"
        );
      }
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
    pendingRequestRef.current = null;
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: MessageAttachment[],
      enabledTools?: string[]
    ) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;

      const trimmedContent = content.trim();

      // Debounce: prevent duplicate rapid submissions
      const now = Date.now();
      if (now - lastSendTimeRef.current < SEND_DEBOUNCE_MS) {
        console.log("[useChat] Debounced - too fast");
        return;
      }
      lastSendTimeRef.current = now;

      // Prevent duplicate requests for same content
      const requestKey = `${trimmedContent}-${conversationId}`;
      if (pendingRequestRef.current === requestKey) {
        console.log("[useChat] Duplicate request prevented");
        return;
      }
      pendingRequestRef.current = requestKey;

      // Performance mark for monitoring
      if (typeof performance !== "undefined") {
        performance.mark("chat-request-start");
      }

      // Create optimistic user message
      const userMessage: Message = {
        id: generateMessageId(),
        role: "user",
        content: trimmedContent,
        attachments,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Create enhanced placeholder for assistant message
      const tempMessageId = generateMessageId();
      const placeholderMessage: Message = {
        id: tempMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
        // Enhanced: add estimated wait time for better UX
        metadata: {
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          estimatedWaitMs: enabledTools?.length ? 5000 : 3000,
        },
      };

      setMessages((prev) => [...prev, placeholderMessage]);

      const chatRequest: ChatRequest = {
        conversation_id: conversationId || undefined,
        message: trimmedContent,
        attachments,
        page_context: "Chat Interface",
        stream: false,
        enabled_tools: enabledTools || [],
      };

      try {
        const response = await chatService.sendMessage(chatRequest);

        // Performance measure
        if (typeof performance !== "undefined") {
          performance.mark("chat-request-end");
          performance.measure(
            "chat-request",
            "chat-request-start",
            "chat-request-end"
          );
          const measure = performance.getEntriesByName("chat-request").pop();
          if (measure) {
            console.log(
              `[useChat] Request completed in ${measure.duration.toFixed(0)}ms`
            );
          }
        }

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
        pendingRequestRef.current = null;
      }
    },
    [conversationId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    pendingRequestRef.current = null;
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
