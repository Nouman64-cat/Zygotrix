import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiClock, FiX } from 'react-icons/fi';

interface RateLimitModalProps {
  isOpen: boolean;
  resetTime: string | null;
  onClose: () => void;
}

/**
 * Compact modal that appears when rate limit is reached
 */
export const RateLimitModal: React.FC<RateLimitModalProps> = ({
  isOpen,
  resetTime,
  onClose,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!resetTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const reset = new Date(resetTime);
      const diffMs = reset.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Ready!');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [resetTime]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <FiAlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Rate Limit Reached
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You've used your daily token limit. The limit will reset automatically.
          </p>

          {/* Countdown */}
          {resetTime && (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <FiClock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Resets in</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {timeRemaining || 'Calculating...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Persistent banner shown above the input when rate limited
 */
interface RateLimitBannerProps {
  resetTime: string | null;
  onShowModal: () => void;
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({
  resetTime,
  onShowModal,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!resetTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const reset = new Date(resetTime);
      const diffMs = reset.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Ready!');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [resetTime]);

  return (
    <div 
      className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-700 px-4 py-2 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
      onClick={onShowModal}
    >
      <div className="flex items-center justify-center gap-3">
        <FiAlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-amber-800 dark:text-amber-200 font-medium">
            Rate limit reached
          </span>
          <span className="text-amber-600 dark:text-amber-400">•</span>
          <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <FiClock className="w-3.5 h-3.5" />
            Resets in <span className="font-semibold">{timeRemaining || '...'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
