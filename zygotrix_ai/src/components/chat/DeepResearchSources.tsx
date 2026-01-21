import React from "react";
import { FiExternalLink, FiFileText } from "react-icons/fi";
import type { ResearchSource } from "../../types/research.types";

interface DeepResearchSourcesProps {
  sources: ResearchSource[];
}

export const DeepResearchSources: React.FC<DeepResearchSourcesProps> = ({
  sources,
}) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
        Research Sources
      </h4>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent -mx-1 px-1">
        {sources.map((source, index) => {
          const score = source.rerank_score || source.relevance_score || 0;

          return (
            <div
              key={index}
              className="flex-shrink-0 w-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-shadow group cursor-default"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono">
                    {index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium">
                      Relevance
                    </span>
                    <div className="h-1 w-12 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(score * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-emerald-500 transition-colors"
                  >
                    <FiExternalLink size={12} />
                  </a>
                )}
              </div>

              <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1.5 leading-snug">
                {source.title}
              </h5>

              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                {source.content_preview || "No preview available"}
              </p>

              {(source.author || source.published_date) && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center gap-2 text-[10px] text-gray-400">
                  <FiFileText size={10} />
                  <span className="truncate">
                    {source.author || "Unknown Author"}
                    {source.published_date && ` • ${source.published_date}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
