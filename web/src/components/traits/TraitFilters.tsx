import React, { useState } from "react";
import type {
  TraitFilters,
  TraitStatus,
  TraitVisibility,
} from "../../types/api";

interface TraitFiltersProps {
  filters: TraitFilters;
  searchQuery: string;
  onFiltersChange: (filters: TraitFilters) => void;
  onSearchChange: (query: string) => void;
}

const TraitFiltersComponent: React.FC<TraitFiltersProps> = ({
  filters,
  searchQuery,
  onFiltersChange,
  onSearchChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleFilterChange = (
    key: keyof TraitFilters,
    value: string | string[] | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value === "" ? undefined : value,
    });
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    handleFilterChange("tags", tags.length > 0 ? tags : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({});
    onSearchChange("");
  };

  const hasActiveFilters =
    Object.values(filters).some((value) => value !== undefined) || searchQuery;
  const activeFilterCount =
    Object.values(filters).filter((value) => value !== undefined).length +
    (searchQuery ? 1 : 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Compact Header with Search and Filter Toggle */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
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
            <input
              type="text"
              placeholder="Search traits by name, key, gene, or tags..."
              className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors cursor-pointer ${
                isExpanded
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Filter Controls */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Inheritance Pattern */}
            <div>
              <label
                htmlFor="inheritance-pattern"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Inheritance Pattern
              </label>
              <select
                id="inheritance-pattern"
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                value={filters.inheritance_pattern || ""}
                onChange={(e) =>
                  handleFilterChange("inheritance_pattern", e.target.value)
                }
              >
                <option value="">All patterns</option>
                <option value="autosomal_dominant">Autosomal Dominant</option>
                <option value="autosomal_recessive">Autosomal Recessive</option>
                <option value="x_linked">X-Linked</option>
                <option value="y_linked">Y-Linked</option>
                <option value="mitochondrial">Mitochondrial</option>
                <option value="polygenic">Polygenic</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                value={filters.category || ""}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">All categories</option>
                <option value="physical_traits">Physical Traits</option>
                <option value="sensory_traits">Sensory Traits</option>
                <option value="behavioral_traits">Behavioral Traits</option>
                <option value="disease_traits">Disease Traits</option>
                <option value="metabolic_traits">Metabolic Traits</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                value={filters.status || ""}
                onChange={(e) =>
                  handleFilterChange("status", e.target.value as TraitStatus)
                }
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label
                htmlFor="visibility"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Visibility
              </label>
              <select
                id="visibility"
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                value={filters.visibility || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "visibility",
                    e.target.value as TraitVisibility
                  )
                }
              >
                <option value="">All visibility</option>
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="public">Public</option>
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label
                htmlFor="verification-status"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Verification
              </label>
              <select
                id="verification-status"
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                value={filters.verification_status || ""}
                onChange={(e) =>
                  handleFilterChange("verification_status", e.target.value)
                }
              >
                <option value="">All statuses</option>
                <option value="verified">Verified</option>
                <option value="simplified">Simplified</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>

            {/* Gene */}
            <div>
              <label
                htmlFor="gene"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Gene
              </label>
              <input
                id="gene"
                type="text"
                placeholder="Gene name..."
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={filters.gene || ""}
                onChange={(e) => handleFilterChange("gene", e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <label
                htmlFor="tags"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                placeholder="tag1, tag2, tag3..."
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={filters.tags?.join(", ") || ""}
                onChange={(e) => handleTagsChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraitFiltersComponent;
