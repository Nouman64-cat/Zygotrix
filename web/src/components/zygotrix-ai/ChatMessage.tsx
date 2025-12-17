/**
 * Chat Message Component
 * ======================
 * Renders individual messages with support for markdown,
 * code highlighting, feedback, and regeneration.
 */

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "../../context/ThemeContext";
import type { Message, FeedbackType } from "../../services/zygotrixAI.api";
import {
  HiOutlineThumbUp,
  HiOutlineThumbDown,
  HiThumbUp,
  HiThumbDown,
  HiOutlineRefresh,
  HiOutlineClipboardCopy,
  HiOutlinePencil,
  HiCheck,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { LuBiohazard } from "react-icons/lu";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  onRegenerate?: () => void;
  onEdit?: (content: string) => void;
  onFeedback?: (type: FeedbackType, comment?: string) => void;
  showActions?: boolean;
}

export default function ChatMessage({
  message,
  isStreaming = false,
  streamingContent,
  onRegenerate,
  onEdit,
  onFeedback,
  showActions = true,
}: ChatMessageProps) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === "user";
  const content = isStreaming ? streamingContent || "" : message.content;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div
      className={`group flex gap-4 px-4 py-6 ${isUser
        ? "bg-transparent"
        : "bg-gray-50 dark:bg-gray-900/50"
        }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
            <LuBiohazard className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Role Label */}
        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          {isUser ? "You" : "Zigi"}
        </div>

        {/* Message Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={Math.min(10, editContent.split("\n").length + 1)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg"
              >
                Save & Submit
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  // In react-markdown v9+, inline is determined by checking if there's a language match
                  // Code blocks have language classes, inline code doesn't
                  if (match) {
                    return (
                      <div className="relative group/code">
                        <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigator.clipboard.writeText(codeString)}
                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                            title="Copy code"
                          >
                            <HiOutlineClipboardCopy className="w-4 h-4" />
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={(resolvedTheme === "dark" ? oneDark : oneLight) as { [key: string]: React.CSSProperties }}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg !mt-0"
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  return (
                    <code
                      className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {children}
                    </a>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        {children}
                      </table>
                    </div>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>

            {/* Streaming Cursor */}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-indigo-600 animate-pulse ml-0.5" />
            )}
          </div>
        )}

        {/* Version Navigation (for edited messages) */}
        {message.sibling_ids.length > 0 && !isEditing && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <span>
              {message.selected_sibling_index + 1} / {message.sibling_ids.length + 1}
            </span>
            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Actions */}
        {showActions && !isStreaming && !isEditing && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
              title="Copy message"
            >
              {copied ? (
                <HiCheck className="w-4 h-4 text-green-500" />
              ) : (
                <HiOutlineClipboardCopy className="w-4 h-4" />
              )}
            </button>

            {/* Edit (user messages only) */}
            {isUser && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                title="Edit message"
              >
                <HiOutlinePencil className="w-4 h-4" />
              </button>
            )}

            {/* Regenerate (assistant messages only) */}
            {!isUser && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                title="Regenerate response"
              >
                <HiOutlineRefresh className="w-4 h-4" />
              </button>
            )}

            {/* Feedback (assistant messages only) */}
            {!isUser && onFeedback && (
              <>
                <button
                  onClick={() => onFeedback("like")}
                  className={`p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg ${message.feedback?.type === "like"
                    ? "text-green-500"
                    : "text-gray-500 dark:text-gray-400"
                    }`}
                  title="Good response"
                >
                  {message.feedback?.type === "like" ? (
                    <HiThumbUp className="w-4 h-4" />
                  ) : (
                    <HiOutlineThumbUp className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onFeedback("dislike")}
                  className={`p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg ${message.feedback?.type === "dislike"
                    ? "text-red-500"
                    : "text-gray-500 dark:text-gray-400"
                    }`}
                  title="Bad response"
                >
                  {message.feedback?.type === "dislike" ? (
                    <HiThumbDown className="w-4 h-4" />
                  ) : (
                    <HiOutlineThumbDown className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Metadata */}
        {message.metadata && !isStreaming && (
          <div className="text-xs text-gray-400 mt-2">
            {message.metadata.total_tokens} tokens
            {message.metadata.model && ` • ${message.metadata.model.split("-").slice(-2).join("-")}`}
          </div>
        )}
      </div>
    </div>
  );
}

// Streaming Message Placeholder
export function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="group flex gap-4 px-4 py-6 bg-gray-50 dark:bg-gray-900/50">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
          <LuBiohazard className="w-4 h-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Zigi</div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          <span className="inline-block w-2 h-4 bg-indigo-600 animate-pulse ml-0.5" />
        </div>
      </div>
    </div>
  );
}

// Typing Indicator
export function TypingIndicator() {
  return (
    <div className="flex gap-4 px-4 py-6 bg-gray-50 dark:bg-gray-900/50">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
          <LuBiohazard className="w-4 h-4" />
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Zigi</div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
