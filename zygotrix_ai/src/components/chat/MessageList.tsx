import React, { useMemo, useCallback, useState, useEffect } from 'react';
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
  enabledTools?: string[];
  onEnabledToolsChange?: (tools: string[]) => void;
}

// Quick action suggestions for genetics/genomics
const QUICK_ACTIONS = [
  { label: 'Analyze DNA' },
  { label: 'Run GWAS' },
  { label: 'Genetic crosses' },
  { label: 'Trait analysis' },
] as const;

// Get greeting based on time of day - memoized outside component
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Get motivational headline - stable based on date
const getHeadline = () => {
  const headlines = [
    "Let's explore genetics together",
    "Ready to discover genetic insights",
    "What would you like to analyze today?",
    "Your genomics assistant is ready",
  ];
  const today = new Date().toDateString();
  const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % headlines.length;
  return headlines[index];
};

// Render threshold - show all messages up to this count, then batch render
const INITIAL_RENDER_COUNT = 20;
const BATCH_SIZE = 10;

const MessageListComponent: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  isStreaming = false,
  onQuickAction,
  onSend,
  inputDisabled = false,
  enabledTools,
  onEnabledToolsChange,
}) => {
  const { scrollRef, scrollToBottom } = useAutoScroll<HTMLDivElement>([messages, isLoading], isStreaming);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Force scroll to bottom when the user sends a message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        scrollToBottom();
      }
    }
  }, [messages.length, scrollToBottom]);

  // Track how many messages to render (for long conversations)
  const [renderCount, setRenderCount] = useState(INITIAL_RENDER_COUNT);

  // Reset render count when messages change significantly (new conversation)
  useEffect(() => {
    if (messages.length <= INITIAL_RENDER_COUNT) {
      setRenderCount(messages.length);
    } else if (messages.length > renderCount) {
      // New messages added - render them immediately
      setRenderCount(messages.length);
    }
  }, [messages.length, renderCount]);

  // Progressively render older messages for long conversations
  useEffect(() => {
    if (renderCount < messages.length) {
      const timer = requestAnimationFrame(() => {
        setRenderCount(prev => Math.min(prev + BATCH_SIZE, messages.length));
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [renderCount, messages.length]);

  // Get first name from full name - memoized
  const firstName = useMemo(() =>
    user?.full_name?.split(' ')[0] || 'there',
    [user?.full_name]
  );

  // Memoize greeting and headline (stable per render)
  const greeting = useMemo(() => getGreeting(), []);
  const headline = useMemo(() => getHeadline(), []);

  // Memoize quick action handler
  const handleQuickAction = useCallback((label: string) => {
    onQuickAction?.(label);
  }, [onQuickAction]);

  // Memoize message items with turn detection
  const messageItems = useMemo(() => {
    // For very long conversations, only render the most recent messages first
    const startIndex = Math.max(0, messages.length - renderCount);
    const visibleMessages = messages.slice(startIndex);

    return visibleMessages.map((message, visibleIndex) => {
      const actualIndex = startIndex + visibleIndex;
      const prevMessage = actualIndex > 0 ? messages[actualIndex - 1] : null;
      const isNewTurn = prevMessage && prevMessage.role === 'assistant' && message.role === 'user';

      return {
        message,
        isNewTurn,
        key: message.id,
      };
    });
  }, [messages, renderCount]);

  // Show loading indicator for remaining messages
  const isLoadingOlderMessages = renderCount < messages.length;

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
              <span className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                {greeting}, {firstName}
              </span>
            </div>

            {/* Large headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 leading-tight">
              {headline}
            </h1>

            {/* Desktop only: Centered ChatInput */}
            {onSend && !isMobile && (
              <div className="mb-6">
                <ChatInput
                  onSend={onSend}
                  disabled={inputDisabled}
                  enabledTools={enabledTools}
                  onEnabledToolsChange={onEnabledToolsChange}
                />
              </div>
            )}

            {/* Quick action chips */}
            {onQuickAction && (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.label)}
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
              enabledTools={enabledTools}
              onEnabledToolsChange={onEnabledToolsChange}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-2 lg:px-4">
        {/* Show loading indicator for older messages */}
        {isLoadingOlderMessages && (
          <div className="flex justify-center py-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              Loading older messages...
            </div>
          </div>
        )}

        {/* Render memoized message items */}
        {messageItems.map(({ message, isNewTurn, key }) => (
          <div key={key}>
            {isNewTurn && (
              <div className="h-6 sm:h-10" />
            )}
            <ChatMessage message={message} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Memoize component with custom comparison for better performance
export const MessageList = React.memo(MessageListComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.inputDisabled === nextProps.inputDisabled &&
    prevProps.onQuickAction === nextProps.onQuickAction &&
    prevProps.onSend === nextProps.onSend &&
    prevProps.enabledTools === nextProps.enabledTools &&
    prevProps.onEnabledToolsChange === nextProps.onEnabledToolsChange
  );
});

