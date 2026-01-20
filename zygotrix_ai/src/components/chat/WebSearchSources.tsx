import React from 'react';
import { FiExternalLink, FiGlobe } from 'react-icons/fi';

interface WebSearchSource {
    title: string;
    url: string;
    snippet?: string;
}

interface WebSearchSourcesProps {
    sources: WebSearchSource[];
}

export const WebSearchSources: React.FC<WebSearchSourcesProps> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    // Get domain from URL
    const getDomain = (url: string) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <FiGlobe size={12} />
                Web Sources
            </h4>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent -mx-1 px-1">
                {sources.map((source, index) => (
                    <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold font-mono">
                                    {index + 1}
                                </span>
                                <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                                    {getDomain(source.url)}
                                </span>
                            </div>
                            <FiExternalLink
                                size={12}
                                className="text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0"
                            />
                        </div>

                        <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1.5 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {source.title || 'Untitled'}
                        </h5>

                        {source.snippet && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                {source.snippet}
                            </p>
                        )}
                    </a>
                ))}
            </div>
        </div>
    );
};
