import React from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { PageLoader } from '../common/PageLoader';
import { useAutoScroll, useIsMobile } from '../../hooks';
import { useAuth } from '../../contexts';
import type { Message, MessageAttachment } from '../../types';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  onQuickAction?: (text: string) => void;
  onSend?: (message: string, attachments?: MessageAttachment[], enabledTools?: string[]) => void;
  inputDisabled?: boolean;
}

// Quick action suggestions for genetics/genomics
// Quick action suggestions for genetics/genomics
const QUICK_ACTIONS = [
  { label: 'Analyze DNA' },
  { label: 'Run GWAS' },
  { label: 'Genetic crosses' },
  { label: 'Trait analysis' },
];

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Get motivational headline
const getHeadline = () => {
  const headlines = [
    "Let's explore genetics together",
    "Ready to discover genetic insights",
    "What would you like to analyze today?",
    "Your genomics assistant is ready",
  ];
  // Use a stable headline based on date (changes daily, not on every render)
  const today = new Date().toDateString();
  const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % headlines.length;
  return headlines[index];
};

const MessageListComponent: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  isStreaming = false,
  onQuickAction,
  onSend,
  inputDisabled = false
}) => {
  const scrollRef = useAutoScroll<HTMLDivElement>([messages, isLoading], isStreaming);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Get first name from full name
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  // Show premium centered loader when loading a conversation (no messages yet)
  if (messages.length === 0 && isLoading) {
    return <PageLoader message="Loading conversation..." />;
  }

  // Show Gemini-style welcome screen when no messages and not loading
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Welcome content - centered vertically on desktop, top-aligned on mobile to leave room for bottom input */}
        <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 pt-8 sm:pt-0">
          <div className="text-center max-w-4xl w-full">
            {/* Personalized greeting */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xl sm:text-2xl">✨</span>
              <span className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                {getGreeting()}, {firstName}
              </span>
            </div>

            {/* Large headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 leading-tight">
              {getHeadline()}
            </h1>

            {/* Desktop only: Centered ChatInput */}
            {onSend && !isMobile && (
              <div className="mb-6">
                <ChatInput
                  onSend={onSend}
                  disabled={inputDisabled}
                />
              </div>
            )}

            {/* Quick action chips */}
            {onQuickAction && (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => onQuickAction(action.label)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-sm hover:shadow cursor-pointer"
                  >
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile only: Fixed bottom ChatInput */}
        {onSend && isMobile && (
          <div>
            <ChatInput
              onSend={onSend}
              disabled={inputDisabled}
            />
          </div>
        )}
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
