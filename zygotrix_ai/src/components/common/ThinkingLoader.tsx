import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface ThinkingLoaderProps {
  className?: string;
  status?: string;
}

// Rotating status messages when no specific status is provided
const DEFAULT_STATUSES = [
  'Thinking',
  'Analyzing',
  'Processing',
  'Crafting response',
];

/**
 * Sparkle icon component with animation - like Gemini's star
 */
const SparkleIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={`w-5 h-5 ${className}`}
    style={style}
  >
    {/* Main 4-point star */}
    <path
      d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
      fill="currentColor"
      className="animate-pulse"
    />
    {/* Small sparkle top-right */}
    <path
      d="M19 3L19.5 5L21.5 5.5L19.5 6L19 8L18.5 6L16.5 5.5L18.5 5L19 3Z"
      fill="currentColor"
      className="animate-ping"
      style={{ animationDuration: '1.5s' }}
    />
  </svg>
);

/**
 * Animated thinking/loading indicator - Gemini style
 * Shows: ✨ Status text ▼
 */
export const ThinkingLoader: React.FC<ThinkingLoaderProps> = ({
  className = '',
  status
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Rotate through default statuses if no specific status provided
  useEffect(() => {
    if (status) return; // Don't rotate if specific status is provided

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % DEFAULT_STATUSES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [status]);

  const displayStatus = status || DEFAULT_STATUSES[currentIndex];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Animated sparkle icon */}
      <SparkleIcon className="text-emerald-500 dark:text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />

      {/* Status text */}
      <span className="text-base font-medium text-gray-800 dark:text-gray-200">
        {displayStatus}
      </span>

      {/* Dropdown chevron (clickable for future expansion) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        {isExpanded ? (
          <FiChevronUp className="w-4 h-4" />
        ) : (
          <FiChevronDown className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

/**
 * Alternative pulsing loader with a more subtle effect
 */
export const PulseLoader: React.FC<ThinkingLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span
        className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500 animate-pulse"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500 animate-pulse"
        style={{ animationDelay: '200ms' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500 animate-pulse"
        style={{ animationDelay: '400ms' }}
      />
    </div>
  );
};

/**
 * Typing indicator with animated bars (like iMessage) - Brand green theme
 */
export const TypingIndicator: React.FC<ThinkingLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-end gap-0.5 h-5 ${className}`}>
      <div
        className="w-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full animate-typing-bar"
        style={{ animationDelay: '0ms' }}
      />
      <div
        className="w-1 bg-gradient-to-t from-teal-600 to-teal-400 rounded-full animate-typing-bar"
        style={{ animationDelay: '150ms' }}
      />
      <div
        className="w-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full animate-typing-bar"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
};

export default ThinkingLoader;
