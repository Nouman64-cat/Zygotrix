import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { MessageList, ChatInput, RateLimitIndicator, RateLimitModal, RateLimitBanner } from '../components/chat';
import { useChat } from '../hooks';
import { chatService } from '../services';
import type { LocalConversation } from '../types';

export const Chat: React.FC = () => {
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  
  const [conversationsList, setConversationsList] = useState<LocalConversation[]>([]);
  const [rateLimitRefresh, setRateLimitRefresh] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  
  // Rate limit state - can be set from API or from error messages
  const [isRateLimitedFromAPI, setIsRateLimitedFromAPI] = useState(false);
  const [resetTime, setResetTime] = useState<string | null>(null);

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
  const isRateLimitedFromError = error ? (
    error.includes('429') || 
    error.toLowerCase().includes('rate limit') ||
    error.toLowerCase().includes('too many requests') ||
    error.toLowerCase().includes('cooldown')
  ) : false;

  // Combined rate limit status (from API or from error)
  const isRateLimited = isRateLimitedFromAPI || isRateLimitedFromError;

  // Handle rate limit status change from RateLimitIndicator
  const handleRateLimitChange = useCallback((limited: boolean, apiResetTime: string | null) => {
    setIsRateLimitedFromAPI(limited);
    if (apiResetTime) {
      setResetTime(apiResetTime);
    }
    // Show modal automatically when first rate limited
    if (limited && !isRateLimitedFromAPI) {
      setShowRateLimitModal(true);
    }
  }, [isRateLimitedFromAPI]);

  // Parse rate limit error details (when error comes from API response)
  useEffect(() => {
    if (isRateLimitedFromError && error) {
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
  }, [error, isRateLimitedFromError]);

  // Load conversations list from API
  const loadConversations = useCallback(async () => {
    try {
      const response = await chatService.getConversations({ page_size: 50 });
      const localConversations: LocalConversation[] = response.conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: [],
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
      }));
      setConversationsList(localConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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

  // Refresh conversations list when a new message is sent
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      const exists = conversationsList.some(c => c.id === conversationId);
      if (!exists) {
        loadConversations();
      }
    }
  }, [messages.length, conversationId, conversationsList, loadConversations]);

  const handleNewConversation = () => {
    startNewConversation();
    navigate('/chat', { replace: true });
  };

  const handleSelectConversation = async (id: string) => {
    await loadConversation(id);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await chatService.deleteConversation(id);
      setConversationsList(prev => prev.filter(c => c.id !== id));
      if (conversationId === id) {
        startNewConversation();
        navigate('/chat', { replace: true });
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
    setTimeout(() => {
      setRateLimitRefresh(prev => prev + 1);
    }, 1000);
  };

  return (
    <MainLayout
      conversations={conversationsList}
      currentConversationId={conversationId || undefined}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onDeleteConversation={handleDeleteConversation}
    >
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

            {/* Horizontal Rate Limit Indicator - Mobile/Tablet only */}
            <div className="xl:hidden border-b border-gray-200 dark:border-gray-800 px-4 py-2 bg-gray-50 dark:bg-gray-900">
              <RateLimitIndicator 
                refreshTrigger={rateLimitRefresh} 
                onRateLimitChange={handleRateLimitChange}
              />
            </div>

            <MessageList messages={messages} isLoading={isLoading} isStreaming={isStreaming} />

            {/* Rate Limit Banner - shows persistently when rate limited */}
            {isRateLimited && (
              <RateLimitBanner
                resetTime={resetTime}
                onShowModal={() => setShowRateLimitModal(true)}
              />
            )}

            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading || isRateLimited}
            />
          </div>

          {/* Vertical Rate Limit Indicator - Right Side (desktop only) */}
          <div className="hidden xl:flex w-16 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <RateLimitIndicator 
              refreshTrigger={rateLimitRefresh} 
              vertical 
              onRateLimitChange={handleRateLimitChange}
            />
          </div>
        </div>
      </>
    </MainLayout>
  );
};
