import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ScholarReport } from "./ScholarReport";
import { FiDownload } from "react-icons/fi";

// Scholar source interface (standalone to avoid type conflicts)
interface ScholarSource {
  title?: string;
  url?: string;
  content_preview?: string;
  source_type?: string;
  relevance_score?: number;
  rerank_score?: number;
  metadata?: Record<string, unknown>;
}

interface ScholarDownloadButtonProps {
  content: string;
  timestamp?: string;
  sources?: ScholarSource[];
  stats?: {
    deep_research_sources?: number;
    web_search_sources?: number;
    time_ms?: number;
  };
}

const ScholarDownloadButton: React.FC<ScholarDownloadButtonProps> = ({
  content,
  timestamp,
  sources,
  stats,
}) => {
  return (
    <PDFDownloadLink
      document={
        <ScholarReport
          content={content}
          sources={sources}
          timestamp={timestamp || new Date().toLocaleString()}
          stats={stats}
        />
      }
      fileName={`zygotrix-scholar-${new Date().toISOString().split("T")[0]}.pdf`}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200"
    >
      {({ loading }: { loading: boolean }) => (
        <>
          <FiDownload className="w-3 h-3" />
          <span>{loading ? "Preparing..." : "Download Report"}</span>
        </>
      )}
    </PDFDownloadLink>
  );
};

export default ScholarDownloadButton;
