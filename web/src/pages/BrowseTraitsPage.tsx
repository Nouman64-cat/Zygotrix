import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import TraitsTable from "../components/traits/TraitsTable";
import TraitDetailModal from "../components/modals/TraitDetailModal";
import { fetchTraits } from "../services/traits.api";
import type { TraitInfo } from "../types/api";

const BrowseTraitsPage: React.FC = () => {
  const [traits, setTraits] = useState<TraitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrait, setSelectedTrait] = useState<TraitInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadTraits();
  }, []);

  const loadTraits = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch public traits (owned_only: false to get traits from traits_dataset.json)
      const publicTraits = await fetchTraits(undefined, { owned_only: false });

      // Filter to only show traits from the dataset (system-provided traits)
      const datasetTraits = publicTraits.filter(
        (trait: TraitInfo) =>
          trait.owner_id === "system" || trait.created_by === "system"
      );

      setTraits(datasetTraits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load traits");
    } finally {
      setLoading(false);
    }
  };

  const handleTraitClick = (trait: TraitInfo) => {
    setSelectedTrait(trait);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTrait(null);
  };

  const handleRetry = () => {
    loadTraits();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Browse Genetic Traits
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Explore our comprehensive database of genetic traits with
                    AI-powered insights
                  </p>
                </div>
              </div>

              {!loading && traits.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {traits.length.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Available Traits
                    </div>
                  </div>
                  <button
                    onClick={loadTraits}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    title="Refresh traits"
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {error ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-red-400 dark:text-red-500">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Failed to Load Traits
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
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
                      <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                        Comprehensive Database
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Verified genetic traits from scientific literature
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-200">
                        AI-Powered Insights
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Click any trait to get detailed AI analysis
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900 dark:text-purple-200">
                        Advanced Search
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Filter by gene, chromosome, inheritance pattern
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traits Table */}
              <TraitsTable
                traits={traits}
                loading={loading}
                onTraitClick={handleTraitClick}
                className="shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Trait Detail Modal */}
        <TraitDetailModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          trait={selectedTrait}
        />
      </div>
    </DashboardLayout>
  );
};

export default BrowseTraitsPage;
