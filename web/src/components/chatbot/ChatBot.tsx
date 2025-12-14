import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, getLatestUsage, resetSession, type ChatMessage, type UsageInfo, type ChatMessageAction } from '../../services/chatbotService';
import { getPageContext } from '../../utils/pageContext';
import { LuBiohazard } from "react-icons/lu";
import { MdInfoOutline } from "react-icons/md";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseSimulationCommands, executeSimulationCommands } from '../../services/simulationCommands';
import { InlineActions } from './InlineActions';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  userName: string;
  userId?: string;
  isEnabled?: boolean;
  variant?: 'floating' | 'sidebar';
  simulationToolContext?: any; // Optional simulation tool context for command execution
}

// Storage keys are now user-specific to prevent cross-user data leakage
const getChatMessagesKey = (userId?: string) => `zygotrix_chat_messages_${userId || 'anonymous'}`;
const getChatUsageKey = (userId?: string) => `zygotrix_chat_usage_${userId || 'anonymous'}`;

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose, currentPath, userName, userId, isEnabled = true, variant = 'floating', simulationToolContext }) => {
  const botName = import.meta.env.VITE_ZYGOTRIX_BOT_NAME || 'Zigi';
  const pageContext = getPageContext(currentPath);

  // User-specific storage keys
  const CHAT_MESSAGES_KEY = getChatMessagesKey(userId);
  const CHAT_USAGE_KEY = getChatUsageKey(userId);

  // Track if we've initialized from localStorage
  const isInitialized = useRef(false);

  // Default welcome message
  const getWelcomeMessage = useCallback((): ChatMessage => ({
    role: 'assistant',
    content: `Hi ${userName}! I'm **${botName}**, your Zygotrix assistant! 🧬 I see you're on the **${pageContext.pageName}**. Ask me anything about this page, genetics, or how to get started!`,
    timestamp: new Date(),
  }), [userName, botName, pageContext.pageName]);

  // Initialize messages from localStorage if available
  const getInitialMessages = (): ChatMessage[] => {
    try {
      const saved = localStorage.getItem(CHAT_MESSAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const loadedMessages = parsed.map((msg: ChatMessage & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        if (loadedMessages.length > 0) {
          return loadedMessages;
        }
      }
    } catch (e) {
      console.error('Error loading chat messages:', e);
    }
    return [getWelcomeMessage()];
  };

  // Initialize usage from localStorage if available
  const getInitialUsage = (): UsageInfo | null => {
    try {
      const savedUsage = localStorage.getItem(CHAT_USAGE_KEY);
      if (savedUsage) {
        return JSON.parse(savedUsage);
      }
    } catch (e) {
      console.error('Error loading chat usage:', e);
    }
    return null;
  };

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(getInitialUsage);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reload messages when userId changes (user switching)
  useEffect(() => {
    // Skip initial mount since we load in useState initializer
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    // Reload from localStorage when storage keys change (user switched)
    try {
      const saved = localStorage.getItem(CHAT_MESSAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const loadedMessages = parsed.map((msg: ChatMessage & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
        } else {
          setMessages([getWelcomeMessage()]);
        }
      } else {
        setMessages([getWelcomeMessage()]);
      }

      // Reload usage
      const savedUsage = localStorage.getItem(CHAT_USAGE_KEY);
      if (savedUsage) {
        setUsage(JSON.parse(savedUsage));
      } else {
        setUsage(null);
      }
    } catch (e) {
      console.error('Error reloading chat state:', e);
    }
  }, [CHAT_MESSAGES_KEY, CHAT_USAGE_KEY, getWelcomeMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when chatbot opens
  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  // Save messages to localStorage whenever they change (but only after initialization)
  useEffect(() => {
    if (!isInitialized.current) return;

    try {
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving chat messages:', e);
    }
  }, [messages, CHAT_MESSAGES_KEY]);

  // Save usage to localStorage whenever it changes (but only after initialization)
  useEffect(() => {
    if (!isInitialized.current) return;

    if (usage) {
      try {
        localStorage.setItem(CHAT_USAGE_KEY, JSON.stringify(usage));
      } catch (e) {
        console.error('Error saving chat usage:', e);
      }
    }
  }, [usage, CHAT_USAGE_KEY]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessage(inputValue, pageContext, userName, userId);

      // Parse and execute simulation commands if tool context is available
      if (simulationToolContext) {
        const { commands, summary } = parseSimulationCommands(response);

        if (commands.length > 0) {
          // Execute commands and get action results
          const { actions } = await executeSimulationCommands(commands, simulationToolContext);

          // Convert actions to ChatMessageAction format
          const messageActions: ChatMessageAction[] = actions.map(a => ({
            description: a.description,
            status: a.status
          }));

          // Show the summary (response without command blocks) with actions
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: summary || response,
            timestamp: new Date(),
            actions: messageActions,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          // No commands, show response as-is
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: summary || response,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else {
        // No tool context, show full response as-is
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      // Update usage info from the response
      const latestUsage = getLatestUsage();
      if (latestUsage) {
        setUsage(latestUsage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: `Hi ${userName}! I'm **${botName}**, your Zygotrix assistant! 🧬 Ask me anything about genetics or how to use Zygotrix!`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    localStorage.removeItem(CHAT_MESSAGES_KEY);
    localStorage.removeItem(CHAT_USAGE_KEY);

    // Reset backend session so conversation memory is cleared
    resetSession();
  };

  // Calculate usage percentage
  const usagePercentage = usage ? Math.round((usage.tokens_used / 25000) * 100) : 0;
  const usageColor = usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500';

  if (variant === 'floating' && !isOpen) return null;

  const containerClasses = variant === 'floating'
    ? "fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full sm:w-[400px] md:w-[450px] lg:w-[500px] h-full sm:h-[500px] md:h-[550px] lg:h-[600px] bg-white dark:bg-[#060914] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-gray-200 dark:border-gray-800 z-50 animate-slide-up"
    : "h-full flex flex-col bg-white dark:bg-[#060914] overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <LuBiohazard className="text-2xl text-indigo-600" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{botName}</h3>
            <p className="text-indigo-100 text-xs">Your AI genetics assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer"
            title="Clear Chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          {/* Info Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer relative"
            title="Chat Info"
          >
            <MdInfoOutline className="w-5 h-5" />
          </button>
          {/* Close/Collapse Button */}
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer"
            title={variant === 'sidebar' ? 'Collapse sidebar' : 'Close chat'}
          >
            {variant === 'sidebar' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-200 dark:border-indigo-800 p-3 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <MdInfoOutline className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="text-gray-700 dark:text-gray-300">
              <p><strong>Memory:</strong> I remember our entire conversation until your limit resets.</p>
              <p className="mt-1"><strong>Limit:</strong> Usage resets automatically every 5 hours.</p>
              <p className="mt-1"><strong>Tip:</strong> Ask follow-up questions like "how?" or "why?" for more details!</p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Bar */}
      {usage && (
        <div className="bg-gray-50 dark:bg-[#0a0a0b] border-b border-gray-200 dark:border-gray-800 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{usagePercentage}% used</span>
            <span>{100 - usagePercentage}% remaining</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${usageColor} transition-all duration-300`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          {/* Rate Limit Warning */}
          {usage.is_limited && usage.reset_time && (
            <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Limit reached!</strong> Resets at{' '}
                  {new Date(usage.reset_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' '}({new Date(usage.reset_time).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Maintenance Mode Banner */}
      {!isEnabled && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                AI Services Temporarily Unavailable
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Due to scheduled maintenance, the AI assistant is currently offline.
                Please check back later. We apologize for any inconvenience!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50 dark:bg-[#101111]">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${message.role === 'user'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'bg-white dark:bg-[#060914] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-800'
                }`}
            >
              {message.role === 'assistant' ? (
                <div>
                  <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-table:text-xs prose-th:bg-indigo-100 dark:prose-th:bg-indigo-900 prose-th:p-1 prose-td:p-1 prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-700 max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                  {message.actions && message.actions.length > 0 && (
                    <InlineActions actions={message.actions} />
                  )}
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              )}
              <p
                className={`text-xs mt-1 ${message.role === 'user' ? 'text-indigo-100' : 'text-gray-400'
                  }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#101111] border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 bg-white dark:bg-[#060914] border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={!isEnabled ? "AI services are currently unavailable..." : usage?.is_limited ? "Chat limit reached. Try again later..." : "Ask me anything..."}
            disabled={isLoading || usage?.is_limited || !isEnabled}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gray-100 dark:bg-[#03050f] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-800 dark:text-gray-100 placeholder-gray-400 disabled:opacity-50 text-sm sm:text-base"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || usage?.is_limited || !isEnabled}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full p-2.5 sm:p-3 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
