import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { MessageList, ChatInput } from '../components/chat';
import { useChat, useLocalStorage } from '../hooks';
import { generateConversationId, generateConversationTitle } from '../utils';
import type { Conversation } from '../types';

export const Chat: React.FC = () => {
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('conversations', []);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();

  const { messages, isLoading, error, sendMessage, setMessages } = useChat(currentConversationId);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  useEffect(() => {
    if (currentConversation) {
      setMessages(currentConversation.messages);
    }
  }, [currentConversationId, currentConversation, setMessages]);

  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === currentConversationId);
        const updatedConversation: Conversation = {
          id: currentConversationId,
          title: currentConversation?.title || generateConversationTitle(messages[0].content),
          messages,
          createdAt: currentConversation?.createdAt || Date.now(),
          updatedAt: Date.now(),
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = updatedConversation;
          return updated;
        }

        return [updatedConversation, ...prev];
      });
    }
  }, [messages, currentConversationId, currentConversation, setConversations]);

  const handleNewConversation = () => {
    const newId = generateConversationId();
    setCurrentConversationId(newId);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(undefined);
      setMessages([]);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) {
      const newId = generateConversationId();
      setCurrentConversationId(newId);
    }
    await sendMessage(content);
  };

  return (
    <MainLayout
      conversations={conversations}
      currentConversationId={currentConversationId}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onDeleteConversation={handleDeleteConversation}
    >
      <div className="flex flex-col h-full">
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3">
            <p className="text-sm text-red-800 text-center">
              {error}
            </p>
          </div>
        )}

        <MessageList messages={messages} isLoading={isLoading} />

        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
        />
      </div>
    </MainLayout>
  );
};
