import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { MessageList, ChatInput, RateLimitModal, RateLimitBanner } from '../components/chat';
import { useChat } from '../hooks';
import { useConversations } from '../contexts';

export const Chat: React.FC = () => {
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [resetTime, setResetTime] = useState<string | null>(null);

  // Access shared conversations context
  const { conversations, refreshConversations } = useConversations();

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    conversationId,
    sendMessage,
    loadConversation,
    startNewConversation
  } = useChat();

  // Parse error to check for rate limit - check multiple patterns
  const isRateLimited = error ? (
    error.includes('429') ||
    error.toLowerCase().includes('rate limit') ||
    error.toLowerCase().includes('too many requests') ||
    error.toLowerCase().includes('cooldown')
  ) : false;

  // Parse rate limit error details (when error comes from API response)
  useEffect(() => {
    if (isRateLimited && error) {
      try {
        // Try to extract JSON from error message
        const jsonMatch = error.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0]);
          const detail = errorData.detail || errorData;
          if (detail.reset_time) {
            setResetTime(detail.reset_time);
          }
        }
        setShowRateLimitModal(true);
      } catch (e) {
        console.error('[Chat] Failed to parse rate limit error:', e);
        setShowRateLimitModal(true);
      }
    }
  }, [error, isRateLimited]);

  // Handle URL changes and initial load
  // Use sessionStorage to persist across component remounts (caused by route changes)
  const JUST_CREATED_KEY = 'zygotrix_just_created_conv_id';

  // Update sessionStorage when conversationId changes from null to something (new chat created)
  useEffect(() => {
    if (conversationId) {
      // We got a conversation ID - save it to sessionStorage
      sessionStorage.setItem(JUST_CREATED_KEY, conversationId);
    }
  }, [conversationId]);

  // Track previous URL to detect intentional navigation to /chat
  const prevUrlConversationIdRef = React.useRef(urlConversationId);

  useEffect(() => {
    const justCreatedId = sessionStorage.getItem(JUST_CREATED_KEY);
    const prevUrlId = prevUrlConversationIdRef.current;

    console.log('[Chat] URL effect:', {
      urlConversationId,
      prevUrlId,
      conversationId,
      justCreatedId,
      messagesLength: messages.length
    });

    // Update the ref for next render
    prevUrlConversationIdRef.current = urlConversationId;

    // If URL has an ID and it differs from current loaded conversation
    if (urlConversationId && urlConversationId !== conversationId) {
      // Skip refetch if this is the conversation we just created
      if (urlConversationId === justCreatedId) {
        console.log('[Chat] Skipping refetch - just created this conversation');
        // Clear the sessionStorage flag since we've handled it
        sessionStorage.removeItem(JUST_CREATED_KEY);
        return;
      }
      console.log('[Chat] Loading conversation from URL');
      // Clear the flag when loading a different conversation
      sessionStorage.removeItem(JUST_CREATED_KEY);
      loadConversation(urlConversationId);
    }
    // If URL is empty (New Chat) and user NAVIGATED here (prevUrlId was truthy)
    // This handles: user clicks "New Chat" or says "create new chat" while on existing chat
    else if (!urlConversationId && prevUrlId && conversationId) {
      console.log('[Chat] User navigated to /chat - starting fresh');
      sessionStorage.removeItem(JUST_CREATED_KEY);
      startNewConversation();
    }
  }, [urlConversationId, conversationId, loadConversation, startNewConversation, messages.length]);


  // Track previous conversation ID to detect ONLY fresh creations
  const prevConversationIdRef = React.useRef(conversationId);

  // Update URL ONLY when we have a conversation ID but no URL ID (i.e. just created a new chat)
  // This prevents race conditions where navigating to a new URL would cause the old state to push the old URL back
  useEffect(() => {
    // Only navigate if conversationId CHANGED and is now truthy (fresh creation)
    if (conversationId && conversationId !== prevConversationIdRef.current && !urlConversationId) {
      navigate(`/chat/${conversationId}`, { replace: true });
    }
    prevConversationIdRef.current = conversationId;
  }, [conversationId, urlConversationId, navigate]);

  // Refresh conversations list if current conversation is missing (e.g. just created)
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      const exists = conversations.some(c => c.id === conversationId);
      if (!exists) {
        refreshConversations();
      }
    }
  }, [messages.length, conversationId, conversations, refreshConversations]);

  // Trigger delayed refresh to pick up SMART TITLE for new chats
  // Separated to avoid infinite loop (removes 'conversations' dependency)
  useEffect(() => {
    if (messages.length > 0 && messages.length <= 2 && conversationId) {
      const timer = setTimeout(() => {
        refreshConversations();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [messages.length, conversationId, refreshConversations]);

  const handleSendMessage = async (content: string, attachments?: import('../types').MessageAttachment[], enabledTools?: string[]) => {
    await sendMessage(content, attachments, enabledTools);
  };

  return (
    <MainLayout currentConversationId={conversationId || undefined}>
      <>
        {/* Rate Limit Modal */}
        <RateLimitModal
          isOpen={showRateLimitModal}
          resetTime={resetTime}
          onClose={() => setShowRateLimitModal(false)}
        />

        <div className="flex h-full">
          {/* Main chat area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Error banner - only show for non-rate-limit errors */}
            {error && !isRateLimited && (
              <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3">
                <p className="text-sm text-red-800 dark:text-red-400 text-center">
                  {error}
                </p>
              </div>
            )}


            <MessageList
              messages={messages}
              isLoading={isLoading}
              isStreaming={isStreaming}
              onQuickAction={(text) => handleSendMessage(`Help me with: ${text}`)}
              onSend={handleSendMessage}
              inputDisabled={isLoading || isRateLimited}
            />

            {/* Rate Limit Banner - shows persistently when rate limited */}
            {isRateLimited && (
              <RateLimitBanner
                resetTime={resetTime}
                onShowModal={() => setShowRateLimitModal(true)}
              />
            )}

            {/* ChatInput at bottom - only show when there are messages */}
            {messages.length > 0 && (
              <ChatInput
                onSend={handleSendMessage}
                disabled={isLoading || isRateLimited}
              />
            )}
          </div>
        </div>
      </>
    </MainLayout>
  );
};
