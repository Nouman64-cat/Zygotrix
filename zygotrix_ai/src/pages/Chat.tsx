import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { MessageList, ChatInput, RateLimitIndicator } from '../components/chat';
import { useChat } from '../hooks';
import { chatService } from '../services';
import type { LocalConversation } from '../types';

export const Chat: React.FC = () => {
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  
  const [conversationsList, setConversationsList] = useState<LocalConversation[]>([]);
  const [rateLimitRefresh, setRateLimitRefresh] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

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

  // Load conversations list from API
  const loadConversations = useCallback(async () => {
    try {
      const response = await chatService.getConversations({ page_size: 50 });
      // Convert API conversations to LocalConversation format for sidebar
      const localConversations: LocalConversation[] = response.conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: [], // Messages loaded on demand
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

  // Refresh conversations list when a new message is sent (conversation might be new)
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      // Check if this conversation is in the list
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
    // Small delay to ensure backend has finished recording token usage
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
      <div className="flex flex-col h-full">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3">
            <p className="text-sm text-red-800 dark:text-red-400 text-center">
              {error}
            </p>
          </div>
        )}

        <MessageList messages={messages} isLoading={isLoading} isStreaming={isStreaming} />

        {/* Rate limit indicator */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 bg-gray-50 dark:bg-gray-900">
          <RateLimitIndicator refreshTrigger={rateLimitRefresh} />
        </div>

        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
        />
      </div>
    </MainLayout>
  );
};
