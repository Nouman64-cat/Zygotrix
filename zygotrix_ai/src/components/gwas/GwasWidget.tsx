import React, { useState } from 'react';
import { cn } from '../../utils';
import { ManhattanPlot } from './ManhattanPlot';
import { QQPlot } from './QQPlot';
import { AssociationTable } from './AssociationTable';
import type { MessageMetadata } from '../../types';

interface GwasWidgetProps {
  gwasData: NonNullable<MessageMetadata['gwas_data']>;
}

type TabType = 'manhattan' | 'qq' | 'associations';

export const GwasWidget: React.FC<GwasWidgetProps> = ({ gwasData }) => {
  const [activeTab, setActiveTab] = useState<TabType>('manhattan');

  const tabs: Array<{ id: TabType; label: string; shortLabel: string; count?: number }> = [
    { id: 'manhattan', label: 'Manhattan Plot', shortLabel: 'Manhattan' },
    { id: 'qq', label: 'Q-Q Plot', shortLabel: 'Q-Q' },
    {
      id: 'associations',
      label: 'Top Associations',
      shortLabel: 'Assoc.',
      count: gwasData.top_associations?.length || 0
    },
  ];

  return (
    <div className="my-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      {/* Header with Analysis Info - Responsive */}
      <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-300 dark:border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              GWAS Analysis Results
            </h3>
            {/* Mobile: Stack metadata vertically */}
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span>
                Phenotype: <span className="font-semibold">{gwasData.phenotype}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span>
                Analysis: <span className="font-semibold capitalize">{gwasData.analysis_type}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span>
                Status: <span className={cn(
                  "font-semibold",
                  gwasData.status === 'completed' ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
                )}>
                  {gwasData.status}
                </span>
              </span>
            </div>
          </div>
          {gwasData.summary && (
            <div className="text-left sm:text-right">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div>{gwasData.summary.total_snps.toLocaleString()} SNPs tested</div>
                <div className="text-xs mt-0.5">
                  λ<sub>GC</sub> = {gwasData.summary.genomic_inflation_lambda.toFixed(3)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation - Responsive */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 sm:flex-initial px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap',
              'hover:bg-gray-100 dark:hover:bg-gray-700/50',
              activeTab === tab.id
                ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-900'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {/* Show short label on mobile, full label on desktop */}
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content - Responsive padding */}
      <div className="p-2 sm:p-4 overflow-x-auto">
        {activeTab === 'manhattan' && gwasData.manhattan_data && (
          <ManhattanPlot data={gwasData.manhattan_data} />
        )}

        {activeTab === 'qq' && gwasData.qq_data && (
          <QQPlot data={gwasData.qq_data} />
        )}

        {activeTab === 'associations' && gwasData.top_associations && (
          <AssociationTable associations={gwasData.top_associations} />
        )}
      </div>

      {/* Footer with Execution Time */}
      {gwasData.summary?.execution_time_seconds && (
        <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          Analysis completed in {gwasData.summary.execution_time_seconds.toFixed(2)} seconds
        </div>
      )}
    </div>
  );
};
