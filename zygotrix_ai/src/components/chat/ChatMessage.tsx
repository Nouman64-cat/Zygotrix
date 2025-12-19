import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  // Render content - use markdown for AI messages, plain text for user
  const renderContent = () => {
    if (showLoader) {
      return <ThinkingLoader />;
    }

    if (isUser) {
      // User messages: plain text
      return (
        <>
          {textToShow}
          {showCursor && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-600 dark:bg-gray-300 animate-pulse" />
          )}
        </>
      );
    }

    // AI messages: render markdown
    return (
      <>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Override default elements with custom styling
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li>{children}</li>,
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
            code: ({ children, className }) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <code className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-sm font-mono overflow-x-auto">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <pre className="mb-2">{children}</pre>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-emerald-500 pl-3 italic my-2">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 underline hover:no-underline">
                {children}
              </a>
            ),
            // Table components
            table: ({ children }) => (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-200 dark:bg-gray-700">
                {children}
              </thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => (
              <tr className="border-b border-gray-300 dark:border-gray-600">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="px-3 py-2 text-left font-semibold border border-gray-300 dark:border-gray-600">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3 py-2 border border-gray-300 dark:border-gray-600">
                {children}
              </td>
            ),
          }}
        >
          {textToShow || ''}
        </ReactMarkdown>
        {showCursor && (
          <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-600 dark:bg-gray-300 animate-pulse" />
        )}
      </>
    );
  };

  return (
    <div className={cn('flex gap-3 px-4 py-3 md:px-6', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex gap-3 max-w-[85%] md:max-w-2xl', isUser && 'flex-row-reverse')}>
        {/* Avatar - hidden on mobile */}
        <div className="hidden md:flex flex-shrink-0">
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
                'max-w-none break-words',
                isUser
                  ? 'text-white'
                  : 'text-gray-800 dark:text-gray-200'
              )}
            >
              {renderContent()}
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
