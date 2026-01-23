import React, { useState } from 'react';
import { MdRefresh } from 'react-icons/md';
import { FiSearch, FiBookOpen } from 'react-icons/fi';
import { Button } from '../common';
import { RateLimitIndicator } from '../chat';
import { useAuth } from '../../contexts';

// Monthly limits for PRO features
const DEEP_RESEARCH_MONTHLY_LIMIT = 200;
const SCHOLAR_MODE_MONTHLY_LIMIT = 50;

export const UsageSection: React.FC = () => {
    const [rateLimitRefresh, setRateLimitRefresh] = useState(0);
    const { user } = useAuth();
    const isPro = user?.subscription_status === 'pro';

    // Get current usage from user object
    const deepResearchUsed = user?.deep_research_usage?.count ?? 0;
    const scholarModeUsed = user?.scholar_mode_usage?.count ?? 0;

    // Calculate remaining
    const deepResearchRemaining = Math.max(0, DEEP_RESEARCH_MONTHLY_LIMIT - deepResearchUsed);
    const scholarModeRemaining = Math.max(0, SCHOLAR_MODE_MONTHLY_LIMIT - scholarModeUsed);

    // Calculate percentage for progress bars
    const deepResearchPercent = (deepResearchUsed / DEEP_RESEARCH_MONTHLY_LIMIT) * 100;
    const scholarModePercent = (scholarModeUsed / SCHOLAR_MODE_MONTHLY_LIMIT) * 100;

    return (
        <div className="space-y-8">
            {/* PRO Features Usage Section */}
            {isPro && (
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">PRO Features Usage</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Monthly usage of your PRO features. Resets on the 1st of each month.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Deep Research Usage */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <FiSearch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Deep Research</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered research from your knowledge base</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {deepResearchUsed} <span className="text-sm font-normal text-gray-500">/ {DEEP_RESEARCH_MONTHLY_LIMIT}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {deepResearchRemaining} remaining
                                    </p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${deepResearchPercent >= 90 ? 'bg-red-500' :
                                        deepResearchPercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${Math.min(100, deepResearchPercent)}%` }}
                                />
                            </div>
                        </div>

                        {/* Scholar Mode Usage */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <FiBookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Scholar Mode</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Comprehensive research with web search & synthesis</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {scholarModeUsed} <span className="text-sm font-normal text-gray-500">/ {SCHOLAR_MODE_MONTHLY_LIMIT}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {scholarModeRemaining} remaining
                                    </p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${scholarModePercent >= 90 ? 'bg-red-500' :
                                        scholarModePercent >= 70 ? 'bg-amber-500' : 'bg-purple-500'
                                        }`}
                                    style={{ width: `${Math.min(100, scholarModePercent)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Non-PRO message */}
            {!isPro && (
                <section>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                        <h2 className="text-base font-semibold text-amber-800 dark:text-amber-200 mb-2">
                            Upgrade to PRO
                        </h2>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            PRO users get access to Deep Research (200/month) and Scholar Mode (50/month) for comprehensive AI-powered research capabilities.
                        </p>
                    </div>
                </section>
            )}

            {/* Token Usage Stats Section */}
            <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Token Usage</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Track your AI chat token usage and limits
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
                        Usage limits help ensure fair access across all users. Your limits reset monthly on the 1st of each month.
                    </p>
                    {isPro && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3">
                            <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                                As a PRO user, you have access to:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-emerald-600 dark:text-emerald-400">
                                <li><strong>200</strong> Deep Research queries per month</li>
                                <li><strong>50</strong> Scholar Mode queries per month</li>
                            </ul>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
