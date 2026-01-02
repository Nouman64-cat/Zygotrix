import React, { useState, useEffect } from 'react';

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
  'Reviewing context',
  'Generating insights',
  'Formulating answer',
  'Verifying data',
];


/**
 * Animated thinking/loading indicator - Gemini style
 * Shows: ✨ Status text ▼
 */
export const ThinkingLoader: React.FC<ThinkingLoaderProps> = ({
  className = '',
  status
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

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
      {/* Status text only */}
      <span className="text-base font-medium text-gray-800 dark:text-gray-200">
        {displayStatus}...
      </span>
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
