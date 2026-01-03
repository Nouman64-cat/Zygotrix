import React, { useState } from 'react';
import { MdRefresh } from 'react-icons/md';
import { Button } from '../common';
import { RateLimitIndicator } from '../chat';

export const UsageSection: React.FC = () => {
    const [rateLimitRefresh, setRateLimitRefresh] = useState(0);

    return (
        <div className="space-y-8">
            {/* Usage Stats Section */}
            <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Token Usage</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Track your AI usage and remaining tokens
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<MdRefresh className="w-4 h-4" />}
                        onClick={() => setRateLimitRefresh(prev => prev + 1)}
                        className="cursor-pointer w-full sm:w-auto"
                    >
                        Refresh
                    </Button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <RateLimitIndicator
                        refreshTrigger={rateLimitRefresh}
                        onRateLimitChange={() => { }}
                    />
                </div>
            </section>

            {/* Usage Info */}
            <section>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">About Usage Limits</h2>

                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        Token limits help ensure fair usage across all users. Each message you send and receive consumes tokens.
                    </p>
                    <p>
                        Your token allocation resets periodically. When you reach the limit, you'll need to wait for the cooldown period to end before continuing.
                    </p>
                    <p>
                        Tips to optimize token usage:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Be concise in your prompts</li>
                        <li>Request "brief" answers for simple questions</li>
                        <li>Avoid repetitive follow-up messages</li>
                    </ul>
                </div>
            </section>
        </div>
    );
};
