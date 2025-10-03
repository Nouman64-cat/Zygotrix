import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import type {
  TraitInfo,
  TraitFilters as ITraitFilters,
  TraitCreatePayload,
  TraitUpdatePayload,
} from "../types/api";
import {
  fetchTraits,
  createTrait,
  updateTrait,
  deleteTrait,
} from "../services/traits.api";
import TraitFiltersComponent from "../components/traits/TraitFilters";
import TraitListComponent from "../components/traits/TraitList";
import TraitEditor from "../components/traits/TraitEditor";
import { isDevelopment } from "../utils/env";
import { generateDummyTraitData } from "../utils/dummyTraitData";

const TraitManagementPage: React.FC = () => {
  const [traits, setTraits] = useState<TraitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrait, setSelectedTrait] = useState<TraitInfo | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [filters, setFilters] = useState<ITraitFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [dummyData, setDummyData] = useState<TraitCreatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch traits with filters
  const loadTraits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTraits = await fetchTraits(undefined, {
        ...filters,
        search: searchQuery,
        owned_only: true,
      });
      setTraits(fetchedTraits);
    } catch (error) {
      console.error("Failed to fetch traits:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load traits. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadTraits();
  }, [loadTraits]);

  // Handle creating a new trait
  const handleCreateTrait = () => {
    setSelectedTrait(null);
    setEditMode("create");
    setShowEditor(true);
  };

  // Handle editing an existing trait
  const handleEditTrait = (trait: TraitInfo) => {
    setSelectedTrait(trait);
    setEditMode("edit");
    setShowEditor(true);
  };

  // Handle creating a new trait with dummy data (development only)
  const handleCreateTraitWithDummyData = () => {
    if (isDevelopment()) {
      const dummyTraitData = generateDummyTraitData();
      setDummyData(dummyTraitData);
      setSelectedTrait(null);
      setEditMode("create");
      setShowEditor(true);
    }
  };

  // Handle saving a trait (create or update)
  const handleSaveTrait = async (
    payload: TraitCreatePayload | TraitUpdatePayload
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (editMode === "create") {
        await createTrait(payload as TraitCreatePayload);
        setSuccessMessage("Trait created successfully!");
      } else if (selectedTrait) {
        await updateTrait(selectedTrait.key, payload as TraitUpdatePayload);
        setSuccessMessage("Trait updated successfully!");
      }

      setShowEditor(false);
      setSelectedTrait(null);
      await loadTraits(); // Refresh the list
    } catch (error) {
      console.error("Failed to save trait:", error);
      setError(
        error instanceof Error
          ? `Failed to save trait: ${error.message}`
          : "Failed to save trait. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a trait
  const handleDeleteTrait = async (traitKey: string) => {
    const trait = traits.find((t) => t.key === traitKey);
    if (trait) {
      setDeleteConfirm({ id: traitKey, name: trait.name });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setLoading(true);
      setError(null);
      await deleteTrait(deleteConfirm.id);
      setSuccessMessage(`"${deleteConfirm.name}" has been deleted.`);
      setDeleteConfirm(null);
      await loadTraits(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete trait:", error);
      setError(
        error instanceof Error
          ? `Failed to delete trait: ${error.message}`
          : "Failed to delete trait. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Handle closing the editor
  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedTrait(null);
    setDummyData(null);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: ITraitFilters) => {
    setFilters(newFilters);
  };

  // Handle search query changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <DashboardLayout>
      <div className="flex h-full bg-gray-50">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
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
                      <h1 className="text-3xl font-bold text-gray-900">
                        Trait Management
                      </h1>
                    </div>
                    {loading && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span className="text-sm">Loading...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-sm text-gray-600">
                      Create, edit, and manage genetic traits for your
                      simulations
                    </p>
                    {traits.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {traits.length} trait{traits.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isDevelopment() && (
                    <button
                      onClick={handleCreateTraitWithDummyData}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
                      title="Create a new trait with pre-filled dummy data for development"
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Create Trait (Dev)
                    </button>
                  )}
                  <button
                    onClick={handleCreateTrait}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-lg gap-2 cursor-pointer"
                    disabled={loading}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Trait
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-700">
                Filter & Search
              </h2>
              <button
                onClick={loadTraits}
                disabled={loading}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Refresh traits"
              >
                <svg
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
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
                <span>Refresh</span>
              </button>
            </div>
            <TraitFiltersComponent
              filters={filters}
              searchQuery={searchQuery}
              onFiltersChange={handleFiltersChange}
              onSearchChange={handleSearchChange}
            />
          </div>

          {/* Trait List */}
          <div className="flex-1 overflow-hidden" ref={mainContentRef}>
            {/* View Mode Toggle */}
            <div className="bg-gray-50 px-6 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">View:</span>
                <div className="flex bg-white border border-gray-200 rounded-md">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1 text-sm font-medium rounded-l-md transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    aria-pressed={viewMode === "grid"}
                  >
                    <svg
                      className="w-4 h-4 inline mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-1 text-sm font-medium rounded-r-md transition-colors cursor-pointer ${
                      viewMode === "list"
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    aria-pressed={viewMode === "list"}
                  >
                    <svg
                      className="w-4 h-4 inline mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Table
                  </button>
                </div>
              </div>

              {traits.length === 0 && !loading && (
                <div className="text-sm text-gray-500">No traits found</div>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              <TraitListComponent
                traits={traits}
                loading={loading}
                onEditTrait={handleEditTrait}
                onDeleteTrait={handleDeleteTrait}
                onRefresh={loadTraits}
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>

        {/* Trait Editor Modal */}
        {showEditor && (
          <TraitEditor
            trait={selectedTrait}
            mode={editMode}
            onSave={handleSaveTrait}
            onCancel={handleCloseEditor}
            dummyData={dummyData}
            isLoading={loading}
          />
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-2 text-green-200 hover:text-white"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 max-w-md">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-200 hover:text-white flex-shrink-0 cursor-pointer"
            aria-label="Close error message"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Trait
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Are you sure you want to delete "{deleteConfirm.name}"?
                  </p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                This action cannot be undone. The trait will be permanently
                removed from your account.
              </p>

              <div className="flex space-x-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center space-x-2"
                >
                  {loading && (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  <span>Delete Trait</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TraitManagementPage;
