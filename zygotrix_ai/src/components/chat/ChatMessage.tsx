import React from 'react';
import { FaUser } from 'react-icons/fa';
import { cn, formatMessageTime } from '../../utils';
import { useTypingEffect } from '../../hooks';
import { ThinkingLoader } from '../common/ThinkingLoader';
import type { Message } from '../../types';
import Logo from '../../../public/zygotrix-ai.png';

interface ChatMessageProps {
  message: Message;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Only enable typing effect for AI messages that are CURRENTLY streaming
  // Historical messages (isStreaming is false/undefined) show immediately
  const shouldAnimate = !isUser && !!message.isStreaming;
  
  const { displayedText, isTyping } = useTypingEffect(message.content || '', {
    enabled: shouldAnimate,
    charsPerTick: 4,      // Characters per tick
    intervalMs: 15,        // Milliseconds between ticks
  });

  // For user messages or non-streaming AI messages, show full content
  // For streaming AI messages, show the animated text
  const textToShow = shouldAnimate ? displayedText : message.content;

  // Show cursor only when actively typing on a streaming message
  const showCursor = shouldAnimate && isTyping;

  // Show loader only when streaming with no content yet
  const showLoader = shouldAnimate && !message.content;

  return (
    <div className={cn('flex gap-3 px-4 py-3 md:px-6', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex gap-3 max-w-[85%] md:max-w-2xl', isUser && 'flex-row-reverse')}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-600 text-white">
              <FaUser className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={Logo} alt="Zygotrix AI" className="w-10 h-10 object-cover rounded-full" />
            </div>
          )}
        </div>

        {/* Message Bubble */}
        <div className="min-w-0 space-y-1">
          {/* Name and Timestamp */}
          <div className={cn('flex items-center gap-2', isUser && 'justify-end')}>
            <span className={cn(
              'font-semibold text-sm',
              isUser ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'
            )}>
              {isUser ? 'You' : 'Zygotrix AI'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatMessageTime(message.timestamp)}
            </span>
          </div>

          {/* Content Bubble */}
          <div
            className={cn(
              'rounded-2xl px-4 py-3 shadow-sm min-h-[2.5rem] min-w-[3rem]',
              isUser
                ? 'bg-emerald-600 dark:bg-emerald-700 text-white rounded-tr-sm'
                : 'bg-gray-100 dark:bg-gray-800 rounded-tl-sm'
            )}
          >
            <div
              className={cn(
                'max-w-none whitespace-pre-wrap break-words',
                isUser
                  ? 'text-white'
                  : 'prose prose-sm dark:prose-invert text-gray-800 dark:text-gray-200'
              )}
            >
              {showLoader ? (
                <ThinkingLoader />
              ) : (
                <>
                  {textToShow}
                  {showCursor && (
                    <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-600 dark:bg-gray-300 animate-pulse" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ChatMessage = React.memo(
  ChatMessageComponent,
  (prevProps, nextProps) => {
    // Only re-render if content or streaming state changes
    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.isStreaming === nextProps.message.isStreaming
    );
  }
);
