import React from 'react';

interface ThinkingLoaderProps {
  className?: string;
}

/**
 * Animated thinking/loading indicator with bouncing dots - Brand green theme
 */
export const ThinkingLoader: React.FC<ThinkingLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div 
        className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 animate-bounce"
        style={{ animationDelay: '0ms', animationDuration: '600ms' }}
      />
      <div 
        className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-bounce"
        style={{ animationDelay: '150ms', animationDuration: '600ms' }}
      />
      <div 
        className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 animate-bounce"
        style={{ animationDelay: '300ms', animationDuration: '600ms' }}
      />
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
