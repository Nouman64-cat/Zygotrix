import React, { useState } from 'react';
import { HiChevronDown, HiCheck, HiX } from 'react-icons/hi';
import type { ChatMessageAction } from '../../services/chatbotService';

interface InlineActionsProps {
    actions: ChatMessageAction[];
}

export const InlineActions: React.FC<InlineActionsProps> = ({ actions }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!actions || actions.length === 0) {
        return null;
    }

    const completedCount = actions.filter(a => a.status === 'completed').length;
    const failedCount = actions.filter(a => a.status === 'failed').length;
    const totalCount = actions.length;

    return (
        <div className="mt-2">
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
                <HiChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
                <span className="font-medium">{totalCount} Action{totalCount !== 1 ? 's' : ''}</span>

                {/* Status Indicators */}
                <span className="flex items-center gap-1.5 ml-1">
                    {completedCount > 0 && (
                        <span className="flex items-center gap-0.5 text-emerald-500">
                            <HiCheck className="w-3.5 h-3.5" />
                            <span>{completedCount}</span>
                        </span>
                    )}
                    {failedCount > 0 && (
                        <span className="flex items-center gap-0.5 text-red-500">
                            <HiX className="w-3.5 h-3.5" />
                            <span>{failedCount}</span>
                        </span>
                    )}
                </span>
            </button>

            {/* Expanded Actions List */}
            {isExpanded && (
                <div className="mt-2 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-3 ml-1">
                    {actions.map((action, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 text-xs py-1"
                        >
                            {/* Step Number */}
                            <span className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                                {index + 1}
                            </span>

                            {/* Description */}
                            <span className="flex-1 text-gray-600 dark:text-gray-300 truncate">
                                {action.description}
                            </span>

                            {/* Status Icon */}
                            {action.status === 'completed' ? (
                                <HiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                                <HiX className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
