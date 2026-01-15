import { useState, useCallback, useEffect, useRef } from "react";
import { chatService } from "../services";
import { generateMessageId, truncateText } from "../utils";
import type {
  Message,
  ChatRequest,
  MessageAttachment,
  ConversationSummary,
} from "../types";

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
  submitDeepResearchAnswers: (
    originalQuery: string,
    answers: Array<{ question_id: string; answer: string }>
  ) => Promise<void>;
}

// Debounce delay in milliseconds - prevents duplicate rapid submissions
const SEND_DEBOUNCE_MS = 300;

interface UseChatOptions {
  onAddConversation?: (conversation: ConversationSummary) => void;
  onUpdateTitle?: (id: string, title: string) => void;
  userId?: string;
}

export const useChat = (
  initialConversationId?: string,
  options?: UseChatOptions
): UseChatReturn => {
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

  // Ref to track the current active conversation ID to prevent race conditions
  const activeConversationIdRef = useRef<string | null>(
    initialConversationId || null
  );

  // Load an existing conversation
  const loadConversation = useCallback(async (convId: string) => {
    // Update active ref immediately
    activeConversationIdRef.current = convId;

    setIsLoading(true);
    setError(null);

    // Performance mark for monitoring
    if (typeof performance !== "undefined") {
      performance.mark("load-conversation-start");
    }

    try {
      const [conversation, messagesResponse] = await Promise.all([
        chatService.getConversation(convId),
        chatService.getMessages(convId),
      ]);

      // Check if we are still on the same conversation
      if (activeConversationIdRef.current !== convId) {
        console.log(
          `[useChat] Ignoring stale response for ${convId}, active is ${activeConversationIdRef.current}`
        );
        return;
      }

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
      // Ignore errors for stale requests too
      if (activeConversationIdRef.current !== convId) return;

      const errorMessage =
        err instanceof Error ? err.message : "Failed to load conversation";
      setError(errorMessage);
    } finally {
      // Only turn off loading if we are still on the same conversation
      if (activeConversationIdRef.current === convId) {
        setIsLoading(false);
      }
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
    // Clear the active conversation ref to prevent race conditions from pending loads
    activeConversationIdRef.current = null;

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
            // Log commented out for production
            // console.log(`[useChat] Request completed in ${measure.duration.toFixed(0)}ms`);
          }
        }

        // Update conversation ID if this was a new conversation
        if (!conversationId && response.conversation_id) {
          setConversationId(response.conversation_id);

          // Immediately add the conversation to the sidebar with placeholder title
          if (options?.onAddConversation && options?.userId) {
            const now = new Date().toISOString();
            const placeholderTitle = truncateText(trimmedContent, 50);

            options.onAddConversation({
              id: response.conversation_id,
              user_id: options.userId,
              title: placeholderTitle,
              status: "active",
              is_pinned: false,
              is_starred: false,
              tags: [],
              message_count: 1,
              created_at: now,
              updated_at: now,
              is_generating_title: true, // Mark as generating title
            });
          }
        }

        // Update conversation title (internal state only)
        // Note: We don't update the sidebar here - the skeleton will remain visible
        // until loadConversations brings in the real generated title from the backend
        // Update conversation title (internal state only)
        // Note: We don't update the sidebar here - the skeleton will remain visible
        // until loadConversations brings in the real generated title from the backend
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
    [conversationId, options]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    pendingRequestRef.current = null;
  }, []);

  // Submit answers to deep research clarification questions
  const submitDeepResearchAnswers = useCallback(
    async (
      originalQuery: string,
      answers: Array<{ question_id: string; answer: string }>
    ) => {
      // Build a message that includes the original query and user's answers
      // The deep_research tool will be enabled to continue the research
      const answersText = answers
        .map((a, i) => `Answer ${i + 1}: ${a.answer}`)
        .join("\n");

      const messageContent = `${originalQuery}\n\nClarification answers:\n${answersText}`;

      // Send with deep_research tool enabled
      await sendMessage(messageContent, undefined, ["deep_research"]);
    },
    [sendMessage]
  );

  // Listen for deep research submit events from the widget
  useEffect(() => {
    const handleDeepResearchSubmit = (event: Event) => {
      const customEvent = event as CustomEvent<{
        sessionId: string;
        originalQuery: string;
        answers: Array<{ question_id: string; answer: string }>;
      }>;

      if (customEvent.detail) {
        submitDeepResearchAnswers(
          customEvent.detail.originalQuery,
          customEvent.detail.answers
        );
      }
    };

    window.addEventListener("deepResearchSubmit", handleDeepResearchSubmit);

    return () => {
      window.removeEventListener(
        "deepResearchSubmit",
        handleDeepResearchSubmit
      );
    };
  }, [submitDeepResearchAnswers]);

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
    submitDeepResearchAnswers,
  };
};
