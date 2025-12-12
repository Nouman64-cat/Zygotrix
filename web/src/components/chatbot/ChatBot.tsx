import React, { useState, useRef, useEffect } from 'react';
import { sendMessage, getLatestUsage, type ChatMessage, type UsageInfo } from '../../services/chatbotService';
import { getPageContext } from '../../utils/pageContext';
import { LuBiohazard } from "react-icons/lu";
import { MdInfoOutline } from "react-icons/md";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  userName: string;
  userId?: string;
}

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose, currentPath, userName, userId }) => {
  const botName = import.meta.env.VITE_ZYGOTRIX_BOT_NAME || 'Zigi';
  const pageContext = getPageContext(currentPath);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi ${userName}! I'm **${botName}**, your Zygotrix assistant! 🧬 I see you're on the **${pageContext.pageName}**. Ask me anything about this page, genetics, or how to get started!`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update usage after each message
  useEffect(() => {
    const latestUsage = getLatestUsage();
    if (latestUsage) {
      setUsage(latestUsage);
    }
  }, [messages]);

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

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Update usage info
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

  // Calculate usage percentage
  const usagePercentage = usage ? Math.round((usage.tokens_used / 25000) * 100) : 0;
  const usageColor = usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full sm:w-[400px] md:w-[450px] lg:w-[500px] h-full sm:h-[500px] md:h-[550px] lg:h-[600px] bg-white dark:bg-[#060914] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-gray-200 dark:border-gray-800 z-50 animate-slide-up">
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
        <div className="flex items-center gap-2">
          {/* Info Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer relative"
            title="Chat Info"
          >
            <MdInfoOutline className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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
              <p className="mt-1"><strong>Limit:</strong> 25,000 tokens per 5 hours. Resets automatically!</p>
              <p className="mt-1"><strong>Tip:</strong> Ask follow-up questions like "how?" or "why?" for more details!</p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Bar */}
      {usage && (
        <div className="bg-gray-50 dark:bg-[#0a0a0b] border-b border-gray-200 dark:border-gray-800 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Usage: {usage.tokens_used.toLocaleString()} / 25,000 tokens</span>
            <span>{usage.tokens_remaining.toLocaleString()} remaining</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${usageColor} transition-all duration-300`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50 dark:bg-[#101111]">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white dark:bg-[#060914] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-800'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-table:text-xs prose-th:bg-indigo-100 dark:prose-th:bg-indigo-900 prose-th:p-1 prose-td:p-1 prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-700 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              )}
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-indigo-100' : 'text-gray-400'
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
            placeholder={usage?.is_limited ? "Chat limit reached. Try again later..." : "Ask me anything..."}
            disabled={isLoading || usage?.is_limited}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gray-100 dark:bg-[#03050f] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-800 dark:text-gray-100 placeholder-gray-400 disabled:opacity-50 text-sm sm:text-base"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || usage?.is_limited}
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
