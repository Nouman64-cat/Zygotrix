import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { MessageList, ChatInput, RateLimitModal, RateLimitBanner } from '../components/chat';
import { useChat } from '../hooks';
import { useConversations } from '../contexts';

export const Chat: React.FC = () => {
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [initialLoadDone, setInitialLoadDone] = useState(false);
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

  // Load conversation from URL on initial mount
  useEffect(() => {
    if (!initialLoadDone && urlConversationId) {
      loadConversation(urlConversationId);
      setInitialLoadDone(true);
    } else if (!initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [urlConversationId, loadConversation, initialLoadDone]);

  // Update URL when conversation changes
  useEffect(() => {
    if (conversationId && conversationId !== urlConversationId) {
      navigate(`/chat/${conversationId}`, { replace: true });
    } else if (!conversationId && urlConversationId) {
      navigate('/chat', { replace: true });
    }
  }, [conversationId, urlConversationId, navigate]);

  // Refresh conversations list when a new message is sent (if not already in list)
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      const exists = conversations.some(c => c.id === conversationId);
      if (!exists) {
        refreshConversations();
      }
    }
  }, [messages.length, conversationId, conversations, refreshConversations]);

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
