import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '../components/layout';
import { MessageList, ChatInput } from '../components/chat';
import { useChat, useLocalStorage } from '../hooks';
import { generateConversationId, generateConversationTitle } from '../utils';
import type { Conversation } from '../types';

export const Chat: React.FC = () => {
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('conversations', []);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const prevConversationIdRef = useRef<string | undefined>();
  const lastSavedMessagesRef = useRef<Message[]>([]);

  const sessionId = currentConversationId || 'default-session';
  const { messages, isLoading, error, sendMessage, setMessages } = useChat(sessionId);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  useEffect(() => {
    if (currentConversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = currentConversationId;
      const conversation = conversations.find((c) => c.id === currentConversationId);
      if (conversation) {
        setMessages(conversation.messages);
        lastSavedMessagesRef.current = conversation.messages;
      }
    }
  }, [currentConversationId]);

  useEffect(() => {
    if (currentConversationId && messages.length > 0 && messages.length !== lastSavedMessagesRef.current.length) {
      lastSavedMessagesRef.current = messages;

      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === currentConversationId);
        const existing = prev[existingIndex];

        const updatedConversation: Conversation = {
          id: currentConversationId,
          title: existing?.title || generateConversationTitle(messages[0].content),
          messages,
          createdAt: existing?.createdAt || Date.now(),
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
  }, [messages, currentConversationId, setConversations]);

  const handleNewConversation = () => {
    setMessages([]);
    const newId = generateConversationId();
    setCurrentConversationId(newId);
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
    let conversationId = currentConversationId;

    if (!conversationId) {
      conversationId = generateConversationId();
      setCurrentConversationId(conversationId);
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
