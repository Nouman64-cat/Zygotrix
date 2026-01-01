import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaUser, FaCopy, FaCheck } from 'react-icons/fa';
import { FiFile } from 'react-icons/fi';
import { cn, formatMessageTime } from '../../utils';
import { useTypingEffect } from '../../hooks';
import { ThinkingLoader } from '../common/ThinkingLoader';
import { BreedingLabWidget } from '../breeding';
import { DnaRnaWidget } from '../dna';
import { GwasWidget } from '../gwas';
import { LOGO_URL } from '../../config';
import type { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
}

// Sequence type labels and colors
const SEQUENCE_TYPES: Record<string, { label: string; color: string; bgColor: string }> = {
  dna: { label: 'DNA', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
  rna: { label: 'RNA', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
  protein: { label: 'Protein', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/30' },
  codons: { label: 'Codons', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30' },
  aminoacids: { label: 'Amino Acids', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-900/30' },
};

// Sequence code block component with copy functionality
const SequenceCodeBlock: React.FC<{
  code: string;
  language: string;
  children: React.ReactNode;
}> = ({ code, language, children }) => {
  const [copied, setCopied] = useState(false);

  const sequenceType = SEQUENCE_TYPES[language.toLowerCase()] || null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  // If it's a recognized sequence type, render with special styling
  if (sequenceType) {
    return (
      <div className={cn(
        'relative rounded-lg border my-2 overflow-hidden',
        'border-gray-200 dark:border-gray-700',
        sequenceType.bgColor
      )}>
        {/* Header with label and copy button */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          <span className={cn('text-xs font-semibold uppercase tracking-wide', sequenceType.color)}>
            {sequenceType.label}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
              'hover:bg-gray-200 dark:hover:bg-gray-700',
              copied ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
            )}
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <FaCheck className="w-3 h-3" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <FaCopy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        {/* Sequence content */}
        <pre className="p-3 overflow-x-auto">
          <code className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all whitespace-pre-wrap">
            {children}
          </code>
        </pre>
      </div>
    );
  }

  // Regular code block (not a sequence type)
  return (
    <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 my-2 overflow-hidden bg-gray-100 dark:bg-gray-800">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
          {language || 'Code'}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
            'hover:bg-gray-200 dark:hover:bg-gray-700',
            copied ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
          )}
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <FaCheck className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <FaCopy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="font-mono text-sm text-gray-800 dark:text-gray-200">
          {children}
        </code>
      </pre>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

  // Check if message has breeding widget data
  const hasBreedingWidget = message.metadata?.widget_type === 'breeding_lab' && message.metadata?.breeding_data;

  // Check if message has DNA/RNA widget data
  const hasDnaRnaWidget = message.metadata?.widget_type === 'dna_rna_visualizer' && message.metadata?.dna_rna_data;

  // Check if message has GWAS widget data
  const hasGwasWidget = message.metadata?.widget_type === 'gwas_results' && message.metadata?.gwas_data;

  // Render content - use markdown for AI messages, plain text for user
  const renderContent = () => {
    if (showLoader) {
      return <ThinkingLoader />;
    }

    if (isUser) {
      // User messages: plain text + attachments
      return (
        <>
          {textToShow}
          {showCursor && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-600 dark:bg-gray-300 animate-pulse" />
          )}
          {/* Display file attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-white/20 dark:bg-white/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-white/30 dark:border-white/20"
                >
                  <FiFile className="flex-shrink-0 text-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-xs sm:text-sm">{attachment.name}</p>
                    {attachment.size_bytes && (
                      <p className="text-[10px] sm:text-xs opacity-80">{formatFileSize(attachment.size_bytes)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }

    // AI messages: render markdown + optional breeding widget
    return (
      <>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Override default elements with custom styling
            p: ({ children }) => <p className="mb-2 last:mb-0 text-sm sm:text-base">{children}</p>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => <ul className="list-disc list-outside ml-4 sm:ml-5 mb-2 space-y-1 text-sm sm:text-base">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-outside ml-4 sm:ml-5 mb-2 space-y-1 text-sm sm:text-base">{children}</ol>,
            li: ({ children }) => <li className="pl-1">{children}</li>,
            h1: ({ children }) => <h1 className="text-base sm:text-lg font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-sm sm:text-base font-bold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xs sm:text-sm font-bold mb-1">{children}</h3>,
            // Enhanced code block with copy functionality
            code: ({ children, className }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const codeString = String(children).replace(/\n$/, '');

              // Check if it's a block code (has className) or inline
              const isBlock = !!className;

              if (isBlock) {
                return (
                  <SequenceCodeBlock code={codeString} language={language}>
                    {children}
                  </SequenceCodeBlock>
                );
              }

              // Inline code
              return (
                <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <>{children}</>,
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
        {/* Render breeding widget if present */}
        {hasBreedingWidget && message.metadata?.breeding_data && (
          <BreedingLabWidget
            initialParentA={message.metadata.breeding_data.parent1}
            initialParentB={message.metadata.breeding_data.parent2}
            traitIds={message.metadata.breeding_data.traits}
          />
        )}

        {/* Render DNA/RNA widget if present */}
        {hasDnaRnaWidget && message.metadata?.dna_rna_data && (
          <DnaRnaWidget
            dnaSequence={message.metadata.dna_rna_data.dna_sequence || ''}
            mrnaSequence={message.metadata.dna_rna_data.mrna_sequence || ''}
            operation={message.metadata.dna_rna_data.operation}
            metadata={message.metadata.dna_rna_data.metadata}
          />
        )}

        {/* Render GWAS widget if present */}
        {hasGwasWidget && message.metadata?.gwas_data && (
          <GwasWidget gwasData={message.metadata.gwas_data} />
        )}
      </>
    );
  };


  return (
    <div className={cn('flex gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 md:px-6', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex gap-2 sm:gap-3 max-w-full sm:max-w-[85%] md:max-w-3xl lg:max-w-4xl', isUser && 'flex-row-reverse')}>
        {/* Avatar - hidden on mobile */}
        <div className="hidden md:flex flex-shrink-0">
          {isUser ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-600 text-white">
              <FaUser className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={LOGO_URL} alt="Zygotrix AI" className="w-10 h-10 object-cover rounded-full" />
            </div>
          )}
        </div>

        {/* Message Bubble */}
        <div className="min-w-0 space-y-1">
          {/* Name and Timestamp */}
          <div className={cn('flex items-center gap-1.5 sm:gap-2', isUser && 'justify-end')}>
            <span className={cn(
              'font-semibold text-xs sm:text-sm',
              isUser ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'
            )}>
              {isUser ? 'You' : 'Zygotrix AI'}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              {formatMessageTime(message.timestamp)}
            </span>
          </div>

          {/* Content Bubble */}
          <div
            className={cn(
              'rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm min-h-[2rem] sm:min-h-[2.5rem] min-w-[3rem]',
              isUser
                ? 'bg-emerald-600 dark:bg-emerald-700 text-white rounded-tr-sm'
                : 'bg-gray-100 dark:bg-gray-800 rounded-tl-sm'
            )}
          >
            <div
              className={cn(
                'max-w-none break-words text-sm sm:text-base',
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
