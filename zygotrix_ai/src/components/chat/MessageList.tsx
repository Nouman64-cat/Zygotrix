import React from 'react';
import { ChatMessage } from './ChatMessage';
import { PageLoader } from '../common/PageLoader';
import { useAutoScroll } from '../../hooks';
import { LOGO_URL } from '../../config';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
}

const MessageListComponent: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  isStreaming = false
}) => {
  const scrollRef = useAutoScroll<HTMLDivElement>([messages, isLoading], isStreaming);

  // Show premium centered loader when loading a conversation (no messages yet)
  if (messages.length === 0 && isLoading) {
    return <PageLoader message="Loading conversation..." />;
  }

  // Show welcome screen when no messages and not loading
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-4 rounded-2xl flex items-center justify-center">
            <img src={LOGO_URL} alt="Zygotrix AI" className="w-32 h-32 object-cover" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to Zygotrix AI
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Start a conversation by typing a message below. I'm here to help you with anything you need.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-2 lg:px-4">
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          // Add extra spacing when a user message follows an AI message (new conversation turn)
          const isNewTurn = prevMessage && prevMessage.role === 'assistant' && message.role === 'user';

          return (
            <div key={message.id}>
              {isNewTurn && (
                <div className="h-6 sm:h-10" />
              )}
              <ChatMessage message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const MessageList = React.memo(MessageListComponent);
