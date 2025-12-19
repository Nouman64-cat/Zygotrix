import React from 'react';

interface PageLoaderProps {
  message?: string;
}

/**
 * Premium full-screen centered loader with animated logo and pulsing effect
 */
export const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo container */}
        <div className="relative">
          {/* Outer pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 opacity-30 blur-xl animate-pulse" 
               style={{ transform: 'scale(1.5)' }} 
          />
          
          {/* Spinning gradient ring */}
          <div className="absolute inset-0 rounded-full animate-spin-slow"
               style={{ 
                 background: 'conic-gradient(from 0deg, transparent, #10b981, transparent)',
                 animationDuration: '3s'
               }} 
          />
          
          {/* Logo container */}
          <div className="relative w-24 h-24 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-2xl">
            <img 
              src="/zygotrix-ai.png" 
              alt="Zygotrix AI" 
              className="w-24 h-24 object-cover animate-pulse"
              style={{ animationDuration: '2s' }}
            />
          </div>
        </div>

        {/* Loading text with gradient */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-medium bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent animate-pulse">
            {message}
          </span>
          
          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '0.8s' }}
            />
            <div 
              className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
              style={{ animationDelay: '150ms', animationDuration: '0.8s' }}
            />
            <div 
              className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: '300ms', animationDuration: '0.8s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
