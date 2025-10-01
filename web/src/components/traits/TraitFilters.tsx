import React from "react";
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

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
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
          placeholder="Search traits by name, gene, category, or tags..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Inheritance Pattern */}
        <div>
          <label
            htmlFor="inheritance-pattern"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Inheritance Pattern
          </label>
          <select
            id="inheritance-pattern"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
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

        {/* Verification Status */}
        <div>
          <label
            htmlFor="verification-status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Verification Status
          </label>
          <select
            id="verification-status"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
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

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category
          </label>
          <select
            id="category"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Visibility
          </label>
          <select
            id="visibility"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
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

        {/* Gene */}
        <div>
          <label
            htmlFor="gene"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Gene
          </label>
          <input
            id="gene"
            type="text"
            placeholder="Gene name..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={filters.gene || ""}
            onChange={(e) => handleFilterChange("gene", e.target.value)}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          type="text"
          placeholder="tag1, tag2, tag3..."
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={filters.tags?.join(", ") || ""}
          onChange={(e) => handleTagsChange(e.target.value)}
        />
      </div>

      {/* Clear Filters Button */}
      {(Object.values(filters).some((value) => value !== undefined) ||
        searchQuery) && (
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TraitFiltersComponent;
