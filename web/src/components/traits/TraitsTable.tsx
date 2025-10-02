import React, { useState, useMemo } from "react";
import type { TraitInfo } from "../../types/api";
import { SparklesIcon } from "@heroicons/react/24/outline";

// Helper functions to extract genes and chromosomes from traits
const getGenesArray = (trait: TraitInfo): string[] => {
  // Check new array format first
  if (trait.genes && Array.isArray(trait.genes) && trait.genes.length > 0) {
    return trait.genes;
  }

  // Fall back to gene_info array format
  if (
    trait.gene_info?.genes &&
    Array.isArray(trait.gene_info.genes) &&
    trait.gene_info.genes.length > 0
  ) {
    return trait.gene_info.genes;
  }

  // Fall back to legacy single gene field
  if (trait.gene) {
    return [trait.gene];
  }

  return [];
};

const getChromosomesArray = (trait: TraitInfo): string[] => {
  // Check new array format first
  if (
    trait.chromosomes &&
    Array.isArray(trait.chromosomes) &&
    trait.chromosomes.length > 0
  ) {
    return trait.chromosomes.map(String);
  }

  // Fall back to gene_info array format
  if (
    trait.gene_info?.chromosomes &&
    Array.isArray(trait.gene_info.chromosomes) &&
    trait.gene_info.chromosomes.length > 0
  ) {
    return trait.gene_info.chromosomes.map(String);
  }

  // Fall back to legacy single chromosome field
  if (trait.chromosome !== undefined && trait.chromosome !== null) {
    return [String(trait.chromosome)];
  }

  return [];
};

// Helper function to get trait type styling
const getTraitTypeStyle = (traitType: string | undefined) => {
  if (!traitType) return null;

  const styles = {
    monogenic: {
      indicator: "bg-blue-500",
      badge: "bg-blue-100 text-blue-800",
      label: "Monogenic",
    },
    polygenic: {
      indicator: "bg-violet-500",
      badge: "bg-violet-100 text-violet-800",
      label: "Polygenic",
    },
    other: {
      indicator: "bg-orange-500",
      badge: "bg-orange-100 text-orange-800",
      label: "Other",
    },
  };

  return styles[traitType as keyof typeof styles] || styles.other;
};

interface TraitsTableProps {
  traits: TraitInfo[];
  loading?: boolean;
  onTraitClick: (trait: TraitInfo) => void;
  className?: string;
}

interface SortConfig {
  key: keyof TraitInfo;
  direction: "asc" | "desc";
}

const TraitsTable: React.FC<TraitsTableProps> = ({
  traits,
  loading = false,
  onTraitClick,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter and sort traits
  const filteredAndSortedTraits = useMemo(() => {
    let filtered = traits.filter((trait) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        trait.name.toLowerCase().includes(searchLower) ||
        trait.key.toLowerCase().includes(searchLower) ||
        trait.category?.toLowerCase().includes(searchLower) ||
        getGenesArray(trait).some((gene) =>
          gene.toLowerCase().includes(searchLower)
        ) ||
        trait.gene?.toLowerCase().includes(searchLower) ||
        trait.inheritance_pattern?.toLowerCase().includes(searchLower)
      );
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [traits, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTraits.length / itemsPerPage);
  const paginatedTraits = filteredAndSortedTraits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: keyof TraitInfo) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: keyof TraitInfo) => {
    if (sortConfig.key !== key) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortConfig.direction === "asc" ? (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-blue-600"
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
    );
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-600 font-medium">Loading traits...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Search and Stats Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
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
              placeholder="Search traits by name, gene, category..."
              className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredAndSortedTraits.length} of {traits.length} traits
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700 cursor-pointer"
                >
                  Trait Name
                  {getSortIcon("name")}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("trait_type")}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700 cursor-pointer"
                >
                  Type
                  {getSortIcon("trait_type")}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Genes
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Chromosomes
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("inheritance_pattern")}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700 cursor-pointer"
                >
                  Inheritance
                  {getSortIcon("inheritance_pattern")}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("category")}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700 cursor-pointer"
                >
                  Category
                  {getSortIcon("category")}
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedTraits.map((trait) => (
              <tr
                key={trait.key}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {trait.name}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const typeStyle = getTraitTypeStyle(trait.trait_type);
                    if (!typeStyle)
                      return <span className="text-gray-400">—</span>;

                    return (
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${typeStyle.indicator}`}
                        ></div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle.badge}`}
                        >
                          {typeStyle.label}
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {(() => {
                    const genes = getGenesArray(trait);
                    if (genes.length === 0) return "—";
                    if (genes.length === 1) return genes[0];
                    return (
                      <div className="flex flex-wrap gap-1">
                        {genes.slice(0, 2).map((gene) => (
                          <span
                            key={gene}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {gene}
                          </span>
                        ))}
                        {genes.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            +{genes.length - 2} more
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {(() => {
                    const chromosomes = getChromosomesArray(trait);
                    if (chromosomes.length === 0) return "—";
                    if (chromosomes.length === 1)
                      return `Chr ${chromosomes[0]}`;
                    return (
                      <div className="flex flex-wrap gap-1">
                        {chromosomes.slice(0, 3).map((chr) => (
                          <span
                            key={chr}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                          >
                            Chr {chr}
                          </span>
                        ))}
                        {chromosomes.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            +{chromosomes.length - 3} more
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {trait.inheritance_pattern || "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {trait.category || "General"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onTraitClick(trait)}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <p className="font-medium">Ask AI</p>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(
              currentPage * itemsPerPage,
              filteredAndSortedTraits.length
            )}{" "}
            of {filteredAndSortedTraits.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-md cursor-pointer ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedTraits.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No traits found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Try adjusting your search terms"
              : "No traits available to display"}
          </p>
        </div>
      )}
    </div>
  );
};

export default TraitsTable;
