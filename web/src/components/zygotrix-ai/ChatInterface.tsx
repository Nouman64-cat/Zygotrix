/**
 * Chat Interface Component
 * ========================
 * Main chat area with message list, input, and controls.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useZygotrixAI } from "../../context/ZygotrixAIContext";
import ChatMessage, { StreamingMessage, TypingIndicator } from "./ChatMessage";
import {
  HiPaperAirplane,
  HiStop,
  HiCog,
  HiShare,
  HiDownload,
  HiDotsVertical,
  HiOutlineLightningBolt,
  HiOutlineSparkles,
} from "react-icons/hi";
import { LuBiohazard } from "react-icons/lu";

interface ChatInterfaceProps {
  onOpenSettings?: () => void;
  onShare?: () => void;
  onExport?: () => void;
}

export default function ChatInterface({
  onOpenSettings,
  onShare,
  onExport,
}: ChatInterfaceProps) {
  const {
    state,
    sendMessage,
    regenerateMessage,
    editMessage,
    addFeedback,
    stopStreaming,
  } = useZygotrixAI();

  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || state.isStreaming) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  }, [input, state.isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Welcome screen suggestions
  const suggestions = [
    { icon: "🧬", text: "Explain Mendelian inheritance" },
    { icon: "🔬", text: "What is a Punnett square?" },
    { icon: "🧪", text: "Cross Aa x Aa genotypes" },
    { icon: "📊", text: "How many traits are in the database?" },
  ];

  // Empty state - no conversation selected
  if (!state.currentConversation && state.messages.length === 0 && !state.isStreaming) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0a0a0b]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <LuBiohazard className="w-6 h-6 text-indigo-600" />
            <span className="font-semibold text-gray-900 dark:text-white">New Chat</span>
          </div>
        </div>

        {/* Welcome Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-2xl w-full text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6">
              <LuBiohazard className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Zygotrix AI
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your intelligent genetics assistant. Ask me about traits, inheritance patterns, or run genetic crosses.
            </p>

            {/* Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(suggestion.text);
                    textareaRef.current?.focus();
                  }}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 text-left transition-colors"
                >
                  <span className="text-2xl">{suggestion.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {suggestion.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about genetics..."
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <HiPaperAirplane className="w-5 h-5 rotate-90" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#0a0a0b]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 min-w-0">
          <LuBiohazard className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {state.currentConversation?.title || "New Chat"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {state.currentConversation && (
            <>
              <button
                onClick={onShare}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400"
                title="Share"
              >
                <HiShare className="w-5 h-5" />
              </button>
              <button
                onClick={onExport}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400"
                title="Export"
              >
                <HiDownload className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Settings Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400"
            >
              <HiDotsVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <button
                  onClick={() => {
                    onOpenSettings?.();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <HiCog className="w-4 h-4" />
                  Conversation Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {state.messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onRegenerate={
              message.role === "assistant"
                ? () => regenerateMessage(message.id)
                : undefined
            }
            onEdit={
              message.role === "user"
                ? (content) => editMessage(message.id, content)
                : undefined
            }
            onFeedback={
              message.role === "assistant"
                ? (type, comment) => addFeedback(message.id, type, comment)
                : undefined
            }
          />
        ))}

        {/* Streaming Content */}
        {state.isStreaming && state.streamingContent && (
          <StreamingMessage content={state.streamingContent} />
        )}

        {/* Loading indicator when streaming starts but no content yet */}
        {state.isStreaming && !state.streamingContent && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {state.error}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={state.isStreaming}
            className="w-full px-4 py-3 pr-24 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
            rows={1}
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {state.isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                title="Stop generating"
              >
                <HiStop className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <HiPaperAirplane className="w-5 h-5 rotate-90" />
              </button>
            )}
          </div>
        </form>

        {/* Model Info */}
        <div className="max-w-3xl mx-auto mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
          <HiOutlineSparkles className="w-3 h-3" />
          <span>
            {state.currentConversation?.settings?.model?.split("-").slice(-2).join(" ") || "Claude 3 Haiku"}
          </span>
        </div>
      </div>
    </div>
  );
}
