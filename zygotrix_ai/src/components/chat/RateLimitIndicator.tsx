import React, { useState, useEffect } from 'react';
import { FiZap, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { chatService } from '../../services';
import type { RateLimitStatus } from '../../types';

interface RateLimitIndicatorProps {
    className?: string;
    refreshTrigger?: number; // Increment to trigger refresh
}

export const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
    className = '',
    refreshTrigger = 0,
}) => {
    const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRateLimit = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const status = await chatService.getRateLimitStatus();
            setRateLimit(status);
        } catch (err) {
            setError('Failed to load rate limit');
            console.error('Failed to fetch rate limit:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRateLimit();
    }, [refreshTrigger]);

    // Refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchRateLimit, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading && !rateLimit) {
        return (
            <div className={`flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
                <FiZap className="animate-pulse" />
                <span>Loading...</span>
            </div>
        );
    }

    if (error || !rateLimit) {
        return null;
    }

    const percentUsed = (rateLimit.tokens_used / rateLimit.max_tokens) * 100;
    const percentRemaining = 100 - percentUsed;

    // Determine color based on usage
    let colorClass = 'text-emerald-600 dark:text-emerald-400';
    let bgColorClass = 'bg-emerald-500';
    if (percentUsed > 80) {
        colorClass = 'text-red-600 dark:text-red-400';
        bgColorClass = 'bg-red-500';
    } else if (percentUsed > 60) {
        colorClass = 'text-amber-600 dark:text-amber-400';
        bgColorClass = 'bg-amber-500';
    }

    // Format reset time if in cooldown
    const formatResetTime = (resetTime: string) => {
        const reset = new Date(resetTime);
        const now = new Date();
        const diffMs = reset.getTime() - now.getTime();
        const diffMins = Math.ceil(diffMs / 60000);

        if (diffMins < 60) {
            return `${diffMins}m`;
        }
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        return `${diffHours}h ${remainingMins}m`;
    };

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {/* Rate limit bar */}
            <div className="flex items-center gap-2">
                {rateLimit.cooldown_active ? (
                    <FiAlertTriangle className="text-red-500" />
                ) : (
                    <FiZap className={colorClass} />
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                            {rateLimit.cooldown_active ? 'Rate Limited' : 'Token Usage'}
                        </span>
                        <span className={`font-semibold ${colorClass}`}>
                            Used {percentUsed.toFixed(0)}% • {percentRemaining.toFixed(0)}% remaining
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${bgColorClass} transition-all duration-300 rounded-full`}
                            style={{ width: `${percentRemaining}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Cooldown message */}
            {rateLimit.cooldown_active && rateLimit.reset_time && (
                <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 pl-6">
                    <FiClock className="w-3 h-3" />
                    <span>Resets in {formatResetTime(rateLimit.reset_time)}</span>
                </div>
            )}
        </div>
    );
};

export default RateLimitIndicator;
