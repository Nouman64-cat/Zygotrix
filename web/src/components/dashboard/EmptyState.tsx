import React from "react";

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="relative mb-6">
      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
        {/* SparklesIcon is expected to be globally available or imported where this is used */}
        <svg
          className="h-12 w-12 text-purple-500 dark:text-purple-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.343 17.657l-1.414 1.414M17.657 17.657l-1.414-1.414M6.343 6.343L4.929 4.929"
          />
        </svg>
      </div>
      {/* Floating DNA icons */}
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center animate-bounce">
        <span className="text-lg">🧬</span>
      </div>
      <div
        className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center animate-bounce"
        style={{ animationDelay: "0.2s" }}
      >
        <span className="text-sm">⚗️</span>
      </div>
    </div>
    <div className="text-lg font-semibold text-gray-500 dark:text-slate-400 mb-2">
      {message}
    </div>
    <p className="text-sm text-gray-500 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
      Select traits from the browser on the right to begin configuring your
      Mendelian inheritance study
    </p>
    <div className="mt-6 inline-flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-4 py-2 rounded-full">
      <span>👉</span>
      <span className="font-medium">Browse traits to get started</span>
    </div>
  </div>
);

export default EmptyState;
