import React, { useState, useEffect, useCallback } from "react";
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

  // Fetch traits with filters
  const loadTraits = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedTraits = await fetchTraits(undefined, {
        ...filters,
        search: searchQuery,
        owned_only: true,
      });
      setTraits(fetchedTraits);
    } catch (error) {
      console.error("Failed to fetch traits:", error);
      alert("Failed to load traits");
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
      if (editMode === "create") {
        await createTrait(payload as TraitCreatePayload);
        alert("Trait created successfully");
      } else if (selectedTrait) {
        await updateTrait(selectedTrait.key, payload as TraitUpdatePayload);
        alert("Trait updated successfully");
      }

      setShowEditor(false);
      setSelectedTrait(null);
      await loadTraits(); // Refresh the list
    } catch (error) {
      console.error("Failed to save trait:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save trait";
      alert(errorMessage);
    }
  };

  // Handle deleting a trait
  const handleDeleteTrait = async (traitKey: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this trait? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteTrait(traitKey);
      alert("Trait deleted successfully");
      await loadTraits(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete trait:", error);
      alert("Failed to delete trait");
    }
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
          <div className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Trait Management
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Create, edit, and manage genetic traits for your simulations
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isDevelopment() && (
                    <button
                      onClick={handleCreateTraitWithDummyData}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
          <div className="bg-white border-b px-6 py-4">
            <TraitFiltersComponent
              filters={filters}
              searchQuery={searchQuery}
              onFiltersChange={handleFiltersChange}
              onSearchChange={handleSearchChange}
            />
          </div>

          {/* Trait List */}
          <div className="flex-1 overflow-hidden">
            <TraitListComponent
              traits={traits}
              loading={loading}
              onEditTrait={handleEditTrait}
              onDeleteTrait={handleDeleteTrait}
              onRefresh={loadTraits}
            />
          </div>
        </div>

        {/* Trait Editor Sidebar */}
        {showEditor && (
          <div className="w-1/2 border-l bg-white flex flex-col">
            <TraitEditor
              trait={selectedTrait}
              mode={editMode}
              onSave={handleSaveTrait}
              onCancel={handleCloseEditor}
              dummyData={dummyData}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TraitManagementPage;
