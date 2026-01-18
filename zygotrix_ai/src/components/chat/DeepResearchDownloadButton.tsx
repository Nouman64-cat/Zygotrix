import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DeepResearchReport } from './DeepResearchReport';
import { FiDownload } from 'react-icons/fi';
import type { ResearchSource } from '../../types/research.types';

interface DeepResearchDownloadButtonProps {
    content: string;
    timestamp?: string;
    sources?: ResearchSource[];
}

const DeepResearchDownloadButton: React.FC<DeepResearchDownloadButtonProps> = ({
    content,
    timestamp,
    sources
}) => {
    return (
        <PDFDownloadLink
            document={
                <DeepResearchReport
                    content={content}
                    sources={sources}
                    timestamp={timestamp || new Date().toLocaleString()}
                />
            }
            fileName={`zygotrix-research-${new Date().toISOString().split('T')[0]}.pdf`}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200"
        >
            {({ loading }) => (
                <>
                    <FiDownload className="w-3 h-3" />
                    <span>{loading ? 'Preparing...' : 'Download Report'}</span>
                </>
            )}
        </PDFDownloadLink>
    );
};

export default DeepResearchDownloadButton;
