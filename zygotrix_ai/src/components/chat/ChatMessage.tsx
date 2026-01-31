import React, { useState, Suspense } from "react";

// Lazy load Pedigree Visualizer
const PedigreeWidget = React.lazy(() =>
  import("../pedigree/FamilyTreeVisualizer").then((module) => ({
    default: module.default,
  })),
);

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaCheck } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
import { FiFile } from "react-icons/fi";
import { cn } from "../../utils";
import { useTypingEffect } from "../../hooks";
import { ThinkingLoader } from "../common/ThinkingLoader";
import { LOGO_URL } from "../../config";
import type { Message } from "../../types";

// PERFORMANCE: Lazy load heavy widget components to reduce initial bundle size
// These components are only loaded when actually needed in a message
const BreedingLabWidget = React.lazy(() =>
  import("../breeding").then((module) => ({
    default: module.BreedingLabWidget,
  })),
);
const DnaRnaWidget = React.lazy(() =>
  import("../dna").then((module) => ({ default: module.DnaRnaWidget })),
);
const GwasWidget = React.lazy(() =>
  import("../gwas").then((module) => ({ default: module.GwasWidget })),
);
const DeepResearchClarification = React.lazy(() =>
  import("../widgets/DeepResearchClarification").then((module) => ({
    default: module.DeepResearchClarification,
  })),
);
// Lazy load sources carousel
const DeepResearchSources = React.lazy(() =>
  import("./DeepResearchSources").then((module) => ({
    default: module.DeepResearchSources,
  })),
);
// Lazy load web search sources
const WebSearchSources = React.lazy(() =>
  import("./WebSearchSources").then((module) => ({
    default: module.WebSearchSources,
  })),
);
// Lazy load PDF button to avoid loading heavy PDF library on initial load
const DeepResearchDownloadButton = React.lazy(
  () => import("./DeepResearchDownloadButton"),
);
// Lazy load Scholar Mode PDF button
const ScholarDownloadButton = React.lazy(
  () => import("./ScholarDownloadButton"),
);

// Widget loading fallback
const WidgetLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">Loading widget...</span>
    </div>
  </div>
);

interface ChatMessageProps {
  message: Message;
  onDeepResearchSubmit?: (
    sessionId: string,
    answers: Array<{ question_id: string; answer: string }>,
  ) => void;
}

// Sequence type labels and colors
const SEQUENCE_TYPES: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  dna: {
    label: "DNA",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
  },
  rna: {
    label: "RNA",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/30",
  },
  protein: {
    label: "Protein",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/30",
  },
  codons: {
    label: "Codons",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/30",
  },
  aminoacids: {
    label: "Amino Acids",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-900/30",
  },
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
      console.error("Failed to copy");
    }
  };

  // If it's a recognized sequence type, render with special styling
  if (sequenceType) {
    return (
      <div
        className={cn(
          "relative rounded-lg border my-2 overflow-hidden",
          "border-gray-200 dark:border-gray-700",
          sequenceType.bgColor,
        )}
      >
        {/* Header with label and copy button */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              sequenceType.color,
            )}
          >
            {sequenceType.label}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
              "hover:bg-gray-200 dark:hover:bg-gray-700",
              copied
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400",
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
                <MdContentCopy className="w-3 h-3" />
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
          {language || "Code"}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
            "hover:bg-gray-200 dark:hover:bg-gray-700",
            copied
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400",
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
              <MdContentCopy className="w-3 h-3" />
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

// Citation Badge Component
// Citation Badge Component
const CitationBadge: React.FC<{ index: number; source?: any }> = ({
  index,
  source,
}) => {
  return (
    <span
      className="relative inline-flex group/citation align-baseline mx-0.5"
      style={{ verticalAlign: "super" }}
    >
      <span
        className="
          inline-flex items-center justify-center 
          w-4 h-4 rounded-full 
          bg-emerald-100 dark:bg-emerald-900/40 
          text-[9px] font-bold text-emerald-700 dark:text-emerald-400
          border border-emerald-200 dark:border-emerald-800
          cursor-help select-none transition-transform hover:scale-110
       "
      >
        {index}
      </span>

      {/* Tooltip */}
      {source && (
        <span
          className="
             absolute bottom-full left-1/2 -translate-x-1/2 mb-2
             w-72 p-3 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded-xl shadow-xl shadow-black/20
             opacity-0 group-hover/citation:opacity-100 transition-opacity duration-200 pointer-events-none 
             z-[100] text-left border border-gray-700 whitespace-normal hidden sm:block
          "
        >
          <span className="font-semibold block mb-1.5 text-emerald-400 line-clamp-2">
            {source.title}
          </span>
          <span className="block opacity-90 line-clamp-4 text-[10px] leading-relaxed text-gray-300 font-normal">
            {source.content_preview}
          </span>

          {/* Simple arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></span>
        </span>
      )}
    </span>
  );
};

// Helper: Parse text to find [Source X] or [X, Y] and swap with CitationBadge in React nodes
const renderWithCitations = (children: React.ReactNode, sources?: any[]) => {
  if (typeof children !== "string") return children;

  // Match various citation formats:
  // [Source 1], [Sources 1, 2], [1, 2], [Source 1, Source 5]
  // This regex captures bracket contents with Source/Sources keywords and/or numbers
  const parts = children.split(/(\[[^\]]*(?:Source|Sources|\d)[^\]]*\])/gi);

  if (parts.length === 1) return children;

  return parts.map((part, i) => {
    // Check if this part looks like a citation block
    // Should contain at least one number and possibly Source/Sources keywords
    if (/^\[.*\d.*\]$/.test(part) && /source|\d/i.test(part)) {
      const numbers = part.match(/\d+/g);

      if (numbers) {
        return (
          <span key={i} className="whitespace-nowrap">
            {numbers.map((numStr, idx) => {
              const index = parseInt(numStr, 10);
              const source = sources ? sources[index - 1] : undefined;
              return <CitationBadge key={idx} index={index} source={source} />;
            })}
          </span>
        );
      }
    }
    return part;
  });
};

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  // Only enable typing effect for AI messages that are CURRENTLY streaming
  // Historical messages (isStreaming is false/undefined) show immediately
  const shouldAnimate = !isUser && !!message.isStreaming;

  const { displayedText, isTyping } = useTypingEffect(message.content || "", {
    enabled: shouldAnimate,
    charsPerTick: 4, // Characters per tick
    intervalMs: 15, // Milliseconds between ticks
  });

  // For user messages or non-streaming AI messages, show full content
  // For streaming AI messages, show the animated text
  const textToShow = shouldAnimate ? displayedText : message.content;

  // Show cursor only when actively typing on a streaming message
  const showCursor = shouldAnimate && isTyping;

  // Show loader only when streaming with no content yet
  const showLoader = shouldAnimate && !message.content;

  // Check if message has breeding widget data
  const hasBreedingWidget =
    message.metadata?.widget_type === "breeding_lab" &&
    message.metadata?.breeding_data;

  // Check if message has DNA/RNA widget data
  const hasDnaRnaWidget =
    message.metadata?.widget_type === "dna_rna_visualizer" &&
    message.metadata?.dna_rna_data;

  // Check if message has GWAS widget data
  const hasGwasWidget =
    message.metadata?.widget_type === "gwas_results" &&
    message.metadata?.gwas_data;

  // Check if message has deep research clarification widget
  const hasDeepResearchWidget =
    message.metadata?.widget_type === "deep_research_clarification" &&
    message.metadata?.deep_research_data;

  // Check if message has pedigree widget data
  const hasPedigreeWidget =
    message.metadata?.widget_type === "pedigree_analysis" &&
    message.metadata?.pedigree_data?.structured_data;

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
                    <p className="truncate font-medium text-xs sm:text-sm">
                      {attachment.name}
                    </p>
                    {attachment.size_bytes && (
                      <p className="text-[10px] sm:text-xs opacity-80">
                        {formatFileSize(attachment.size_bytes)}
                      </p>
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
            // Override default elements with custom styling - generous spacing for readability
            p: ({ children }) => (
              <p className="mb-6 last:mb-0 text-sm leading-relaxed">
                {renderWithCitations(
                  children,
                  message.metadata?.deep_research_data?.sources,
                )}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => (
              <ul className="list-disc list-outside ml-4 sm:ml-5 mb-6 space-y-3 text-sm">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-outside ml-4 sm:ml-5 mb-6 space-y-3 text-sm">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="pl-1 leading-relaxed">
                {renderWithCitations(
                  children,
                  message.metadata?.deep_research_data?.sources,
                )}
              </li>
            ),
            h1: ({ children }) => (
              <h1 className="text-4xl font-semibold mb-4 mt-6 first:mt-0 text-gray-700 dark:text-gray-300">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mb-3 mt-5 first:mt-0 text-gray-700 dark:text-gray-300">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-gray-700 dark:text-gray-300">
                {children}
              </h3>
            ),
            // Enhanced code block with copy functionality
            code: ({ children, className }) => {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";
              const codeString = String(children).replace(/\n$/, "");

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
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 underline hover:no-underline"
              >
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
              <thead className="bg-gray-200 dark:bg-gray-700">{children}</thead>
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
          {textToShow || ""}
        </ReactMarkdown>
        {showCursor && (
          <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-600 dark:bg-gray-300 animate-pulse" />
        )}
        {/* Render breeding widget if present - lazy loaded */}
        {hasBreedingWidget && message.metadata?.breeding_data && (
          <Suspense fallback={<WidgetLoadingFallback />}>
            <BreedingLabWidget
              initialParentA={message.metadata.breeding_data.parent1}
              initialParentB={message.metadata.breeding_data.parent2}
              traitIds={message.metadata.breeding_data.traits}
            />
          </Suspense>
        )}

        {/* Render DNA/RNA widget if present - lazy loaded */}
        {hasDnaRnaWidget && message.metadata?.dna_rna_data && (
          <Suspense fallback={<WidgetLoadingFallback />}>
            <DnaRnaWidget
              dnaSequence={message.metadata.dna_rna_data.dna_sequence || ""}
              mrnaSequence={message.metadata.dna_rna_data.mrna_sequence || ""}
              operation={message.metadata.dna_rna_data.operation}
              metadata={message.metadata.dna_rna_data.metadata}
            />
          </Suspense>
        )}

        {/* Render GWAS widget if present - lazy loaded */}
        {hasGwasWidget && message.metadata?.gwas_data && (
          <Suspense fallback={<WidgetLoadingFallback />}>
            <GwasWidget gwasData={message.metadata.gwas_data} />
          </Suspense>
        )}

        {/* Render Deep Research clarification widget if present - lazy loaded */}
        {hasDeepResearchWidget && message.metadata?.deep_research_data && (
          <Suspense fallback={<WidgetLoadingFallback />}>
            <DeepResearchClarification
              sessionId={message.metadata.deep_research_data.session_id || ""}
              questions={message.metadata.deep_research_data.questions || []}
              onSubmit={(answers) => {
                // Dispatch a custom event that the chat context can listen to
                const event = new CustomEvent("deepResearchSubmit", {
                  detail: {
                    sessionId: message.metadata?.deep_research_data?.session_id,
                    originalQuery:
                      message.metadata?.deep_research_data?.original_query,
                    answers,
                  },
                });
                window.dispatchEvent(event);
              }}
            />
          </Suspense>
        )}

        {/* Render Pedigree Visualizer if present */}
        {hasPedigreeWidget && message.metadata?.pedigree_data?.structured_data && (
          <div className="mt-6 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden h-[500px] bg-white dark:bg-black relative shadow-lg dark:shadow-2xl">
            <div className="absolute top-0 right-0 z-20 text-[10px] bg-gray-100/80 dark:bg-zinc-900/80 px-2 py-1 text-gray-500 dark:text-zinc-400 font-mono pointer-events-none backdrop-blur border-l border-b border-gray-200 dark:border-zinc-800 rounded-bl-lg">
              PEDIGREE LAB
            </div>
            <Suspense fallback={<WidgetLoadingFallback />}>
              <PedigreeWidget
                data={message.metadata.pedigree_data.structured_data}
                analysisResult={message.metadata.pedigree_data.analysis_result}
                isLoading={false}
              />
            </Suspense>
          </div>
        )}
      </>
    );
  };

  // State for copying message content
  const [messageCopied, setMessageCopied] = useState(false);

  // Copy message content to clipboard
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2000);
    } catch {
      console.error("Failed to copy message");
    }
  };

  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-3 px-2 sm:px-4 py-4 sm:py-5 md:px-6",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "group flex items-start gap-2 sm:gap-3",
          // User messages have max-width, AI responses use full width
          isUser
            ? "max-w-full sm:max-w-[85%] md:max-w-3xl lg:max-w-4xl flex-row-reverse"
            : "max-w-full",
        )}
      >
        {/* Avatar - only show for AI, hidden on mobile */}
        {/* Avatar - only show for AI, hidden on mobile */}
        {!isUser && (
          <div className="hidden md:flex flex-shrink-0 relative">
            {/* Circular Loader Ring around Avatar when thinking/streaming */}
            {shouldAnimate && (
              <div className="absolute -inset-1 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            )}
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src={LOGO_URL}
                alt="Zygotrix AI"
                className="w-8 h-8 object-cover rounded-full"
              />
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className="min-w-0 flex-1">
          {/* User messages have gray bubble like Gemini, AI messages are clean text */}
          {isUser ? (
            <div className="relative rounded-3xl px-4 py-2.5 sm:px-5 sm:py-3 bg-gray-100 dark:bg-gray-700 rounded-tr-lg shadow-sm min-w-[3rem]">
              <div className="max-w-none break-words text-sm text-gray-800 dark:text-gray-200">
                {renderContent()}
              </div>
              {/* Copy button - show on hover for user messages */}
              <button
                onClick={handleCopyMessage}
                className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                title="Copy message"
              >
                {messageCopied ? (
                  <FaCheck className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <MdContentCopy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed pt-1.5">
              {renderContent()}
              {/* Copy button - always visible for AI responses */}
              {!showLoader && message.content && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                    title="Copy response"
                  >
                    {messageCopied ? (
                      <>
                        <FaCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <MdContentCopy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* Deep Research Download Button - Only show for completed research, not clarification */}
                  {message.metadata?.model === "deep_research" &&
                    message.metadata?.widget_type !==
                    "deep_research_clarification" && (
                      <Suspense
                        fallback={
                          <div className="h-6 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        }
                      >
                        <DeepResearchDownloadButton
                          content={message.content}
                          timestamp={message.created_at}
                          sources={
                            message.metadata?.deep_research_data?.sources
                          }
                        />
                      </Suspense>
                    )}

                  {/* Scholar Mode Download Button - Uses Scholar-specific PDF component */}
                  {message.metadata?.model === "scholar_mode" && (
                    <Suspense
                      fallback={
                        <div className="h-6 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      }
                    >
                      <ScholarDownloadButton
                        content={message.content}
                        timestamp={message.created_at}
                        sources={message.metadata?.deep_research_data?.sources}
                        stats={message.metadata?.deep_research_data?.stats}
                      />
                    </Suspense>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Deep Research Sources Carousel - Render below the message bubble for AI */}
          {!isUser &&
            message.metadata?.model === "deep_research" &&
            message.metadata?.deep_research_data?.sources && (
              <Suspense
                fallback={
                  <div className="h-24 w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse mt-4" />
                }
              >
                <DeepResearchSources
                  sources={message.metadata.deep_research_data.sources}
                />
              </Suspense>
            )}

          {/* Scholar Mode Sources Carousel - Uses DeepResearchSources since same format */}
          {!isUser &&
            message.metadata?.model === "scholar_mode" &&
            message.metadata?.deep_research_data?.sources && (
              <Suspense
                fallback={
                  <div className="h-24 w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse mt-4" />
                }
              >
                <DeepResearchSources
                  sources={message.metadata.deep_research_data.sources}
                />
              </Suspense>
            )}

          {/* Web Search Sources Carousel - Render below the message bubble for AI */}
          {!isUser &&
            message.metadata?.model === "web_search" &&
            message.metadata?.web_search_data?.sources && (
              <Suspense
                fallback={
                  <div className="h-24 w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse mt-4" />
                }
              >
                <WebSearchSources
                  sources={message.metadata.web_search_data.sources}
                />
              </Suspense>
            )}
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
  },
);
