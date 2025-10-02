import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateTraitInformation } from "../../services/gemini.api";
import type { TraitInformation } from "../../services/gemini.api";
import type { TraitInfo } from "../../types/api";

interface TraitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trait: TraitInfo | null;
}

const TraitDetailModal: React.FC<TraitDetailModalProps> = ({
  isOpen,
  onClose,
  trait,
}) => {
  const [traitInfo, setTraitInfo] = useState<TraitInformation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && trait) {
      fetchTraitInformation();
    }
  }, [isOpen, trait]);

  const fetchTraitInformation = async () => {
    if (!trait) return;

    setLoading(true);
    setError(null);
    setTraitInfo(null);

    try {
      const gene = trait.gene_info?.genes?.[0] || trait.gene;
      const chromosome =
        trait.gene_info?.chromosomes?.[0] || trait.chromosome?.toString();

      const information = await generateTraitInformation(
        trait.name,
        gene,
        chromosome
      );

      setTraitInfo(information);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch trait information"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchTraitInformation();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <button
        className="fixed inset-0 bg-black/50 transition-opacity cursor-pointer"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl transform transition-all flex flex-col">
        <div className="p-6 border-b border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {trait?.name || "Trait Information"}
                </h3>
                <p className="text-sm text-gray-500">
                  {trait?.gene_info?.genes?.[0] || trait?.gene
                    ? `Gene: ${trait?.gene_info?.genes?.[0] || trait?.gene}`
                    : "Genetic Trait Details"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-gray-600">
                  Generating trait information...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 text-red-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Failed to Load Information
              </h4>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {traitInfo && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🧬</span>
                <h4 className="font-semibold text-gray-900">
                  Trait Information
                </h4>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {traitInfo.content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Information generated by AI • Always consult medical professionals
            for health-related decisions
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Markdown components for custom styling
const markdownComponents = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-lg font-semibold text-gray-900 mb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-base font-medium text-gray-800 mb-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-sm font-medium text-gray-800 mb-1" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-2 text-gray-700" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside mb-2 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside mb-2 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-gray-700" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-gray-900" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-gray-700" {...props}>
      {children}
    </em>
  ),
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono"
      {...props}
    >
      {children}
    </code>
  ),
};

export default TraitDetailModal;
