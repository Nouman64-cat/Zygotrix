import React, { useState } from 'react';
import DnaStrand from './DnaStrand';
import RnaStrand from './RnaStrand';

interface DnaRnaWidgetProps {
  dnaSequence?: string;
  mrnaSequence?: string;
  operation?: 'generate_dna' | 'transcribe_to_mrna' | 'both';
  metadata?: {
    length?: number;
    gc_content?: number;
    base_counts?: Record<string, number>;
  };
}

/**
 * DNA/RNA Widget Component
 * Displays DNA sequences and their mRNA transcriptions with interactive visualization
 */
const DnaRnaWidget: React.FC<DnaRnaWidgetProps> = ({
  dnaSequence = '',
  mrnaSequence = '',
  operation = 'both',
  metadata
}) => {
  const [activeTab, setActiveTab] = useState<'dna' | 'mrna'>(
    operation === 'transcribe_to_mrna' ? 'mrna' : 'dna'
  );

  const hasDna = dnaSequence && dnaSequence.length > 0;
  const hasMrna = mrnaSequence && mrnaSequence.length > 0;

  // Copy sequence to clipboard
  const copyToClipboard = (sequence: string, _type: string) => {
    navigator.clipboard.writeText(sequence);
    // Could add toast notification here
  };

  return (
    <div className="dna-rna-widget bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-3 sm:p-4 md:p-6 border border-blue-200 dark:border-gray-700 shadow-lg my-3 sm:my-4 max-w-full">
      {/* Header - Responsive */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <div className="text-lg sm:text-2xl">🧬</div>
        <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 dark:text-gray-100">
          <span className="hidden sm:inline">DNA/RNA Sequence Visualizer</span>
          <span className="sm:hidden">DNA/RNA Viewer</span>
        </h3>
      </div>

      {/* Tab navigation - Responsive */}
      {hasDna && hasMrna && (
        <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dna')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'dna'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
          >
            <span className="hidden sm:inline">DNA Sequence</span>
            <span className="sm:hidden">DNA</span>
          </button>
          <button
            onClick={() => setActiveTab('mrna')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'mrna'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
          >
            <span className="hidden sm:inline">mRNA Sequence</span>
            <span className="sm:hidden">mRNA</span>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="space-y-3 sm:space-y-4">
        {/* DNA Section */}
        {hasDna && (activeTab === 'dna' || !hasMrna) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                DNA Sequence
              </h4>
              <button
                onClick={() => copyToClipboard(dnaSequence, 'DNA')}
                className="px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="overflow-x-auto">
              <DnaStrand sequence={dnaSequence} />
            </div>

            {/* Metadata - Responsive grid */}
            {metadata && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                {metadata.length && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-1.5 sm:p-2 rounded">
                    <div className="text-gray-500 dark:text-gray-400">Length</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">
                      {metadata.length} bp
                    </div>
                  </div>
                )}
                {metadata.gc_content !== undefined && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-1.5 sm:p-2 rounded">
                    <div className="text-gray-500 dark:text-gray-400">GC Content</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">
                      {(metadata.gc_content * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
                {metadata.base_counts && (
                  <>
                    {Object.entries(metadata.base_counts).map(([base, count]) => (
                      <div key={base} className="bg-gray-50 dark:bg-gray-700/50 p-1.5 sm:p-2 rounded">
                        <div className="text-gray-500 dark:text-gray-400">{base}</div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">
                          {count}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* mRNA Section */}
        {hasMrna && (activeTab === 'mrna' || !hasDna) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                mRNA Sequence
              </h4>
              <button
                onClick={() => copyToClipboard(mrnaSequence, 'mRNA')}
                className="px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="overflow-x-auto">
              <RnaStrand sequence={mrnaSequence} showCodons={true} />
            </div>

            {/* Transcription rule */}
            {hasDna && (
              <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 p-1.5 sm:p-2 rounded">
                <span className="font-semibold">Transcription:</span> A→A, T→U, G→G, C→C
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer info - Responsive */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center">
        {operation === 'generate_dna' && 'Generated DNA sequence'}
        {operation === 'transcribe_to_mrna' && 'Transcribed DNA to mRNA'}
        {operation === 'both' && 'DNA sequence and mRNA transcription'}
      </div>
    </div>
  );
};

export default DnaRnaWidget;
