import React from "react";
import type { TraitInfo } from "../../types/api";

interface TraitListProps {
  traits: TraitInfo[];
  loading: boolean;
  onSelectTrait: (trait: TraitInfo) => void;
  onEditTrait: (trait: TraitInfo) => void;
  onDeleteTrait: (traitKey: string) => void;
  onRefresh: () => void;
  viewMode?: "grid" | "list";
}

const TraitListComponent: React.FC<TraitListProps> = ({
  traits,
  loading,
  onSelectTrait,
  onEditTrait,
  onDeleteTrait,
  onRefresh,
  viewMode = "list",
}) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "deprecated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return (
          <svg
            className="h-4 w-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        );
      case "team":
        return (
          <svg
            className="h-4 w-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-4 w-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        );
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-400";
      case "draft":
        return "bg-yellow-400";
      case "deprecated":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (traits.length === 0) {
    return (
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
          Get started by creating your first genetic trait.
        </p>
        <div className="mt-6">
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 p-4">
      {traits.map((trait) => (
        <button
          key={trait.key}
          className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-left w-full"
          onClick={() => onSelectTrait(trait)}
          aria-label={`View trait ${trait.name}`}
        >
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {trait.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700">
                    {trait.name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <div className="w-4 h-4">
                  {getVisibilityIcon(trait.visibility)}
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${getStatusDotColor(
                    trait.status
                  )}`}
                  title={trait.status}
                />
              </div>
            </div>
          </div>

          {/* Compact Body */}
          <div className="p-3 space-y-2">
            {/* Key Info Row */}
            <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded truncate">
              {trait.key}
            </div>

            {/* Gene & Chromosome Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1 flex-1 min-w-0">
                <svg
                  className="w-3 h-3 text-green-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700 truncate">
                  {trait.gene_info?.genes?.[0] || "Unknown"}
                </span>
              </div>
              {trait.gene_info?.chromosomes?.[0] && (
                <span className="text-gray-500 bg-blue-100 px-1.5 py-0.5 rounded text-xs">
                  Chr{trait.gene_info.chromosomes[0]}
                </span>
              )}
            </div>

            {/* Category & Inheritance Row */}
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {
                  (trait.category?.replace(/_/g, " ") || "Unknown").split(
                    " "
                  )[0]
                }
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {
                  (
                    trait.inheritance_pattern?.replace(/_/g, " ") || "Unknown"
                  ).split(" ")[0]
                }
              </span>
            </div>

            {/* Phenotype Summary */}
            <div className="bg-gray-50 rounded p-2 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">
                  Phenotypes
                </span>
                <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                  {Object.keys(trait.phenotype_map).length}
                </span>
              </div>
              <div className="space-y-1">
                {Object.entries(trait.phenotype_map)
                  .slice(0, 1)
                  .map(([genotype, phenotype]) => (
                    <div key={genotype} className="flex items-center text-xs">
                      <span className="font-mono text-gray-600 bg-white px-1.5 py-0.5 rounded border mr-2">
                        {genotype}
                      </span>
                      <span className="text-gray-700 truncate flex-1">
                        {phenotype}
                      </span>
                    </div>
                  ))}
                {Object.keys(trait.phenotype_map).length > 1 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{Object.keys(trait.phenotype_map).length - 1} more
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Minimal Actions Footer */}
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-400">Click card to preview</span>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTrait(trait);
                }}
                className="cursor-pointer w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                title="Edit"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTrait(trait.key);
                }}
                className="cursor-pointer w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Delete"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-left">
                <div className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors group">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider group-hover:text-blue-600">
                    Trait Information
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                    />
                  </svg>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Genetics
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Classification
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status & Access
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Phenotype Data
                </span>
              </th>
              <th className="px-6 py-4 text-center">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {traits.map((trait, index) => (
              <tr
                key={trait.key}
                className={`hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                }`}
                onClick={() => onSelectTrait(trait)}
              >
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {trait.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {trait.name}
                      </div>
                      <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                        {trait.key}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">
                        {trait.gene_info?.genes?.[0] || "Unknown"}
                      </span>
                    </div>
                    {trait.gene_info?.chromosomes?.[0] && (
                      <div className="text-xs text-gray-600 bg-blue-100 px-2 py-0.5 rounded-full inline-block">
                        Chromosome {trait.gene_info.chromosomes[0]}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {trait.inheritance_pattern?.replace(/_/g, " ") ||
                        "Pattern unknown"}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="space-y-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                      {trait.category?.replace(/_/g, " ") || "Uncategorized"}
                    </span>
                    {trait.verification_status && (
                      <div className="text-xs text-gray-600">
                        <span className="inline-flex items-center">
                          <svg
                            className="w-3 h-3 text-green-500 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {trait.verification_status}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                          trait.status
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                        {trait.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {getVisibilityIcon(trait.visibility)}
                        <span className="text-xs text-gray-600 capitalize">
                          {trait.visibility}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-indigo-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">
                        {Object.keys(trait.phenotype_map).length} mappings
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-md p-2 border border-gray-200">
                      <div className="text-xs text-gray-600 space-y-1">
                        {Object.entries(trait.phenotype_map)
                          .slice(0, 2)
                          .map(([genotype, phenotype]) => (
                            <div
                              key={genotype}
                              className="flex items-center justify-between"
                            >
                              <span className="font-mono text-gray-800 bg-white px-1.5 py-0.5 rounded border">
                                {genotype}
                              </span>
                              <svg
                                className="w-3 h-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              <span className="text-gray-700 text-right flex-1 truncate ml-2">
                                {phenotype}
                              </span>
                            </div>
                          ))}
                        {Object.keys(trait.phenotype_map).length > 2 && (
                          <div className="text-center text-gray-400 text-xs pt-1 border-t border-gray-200">
                            +{Object.keys(trait.phenotype_map).length - 2} more
                            mappings
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTrait(trait);
                      }}
                      className="cursor-pointer inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-200 group"
                      title="Edit trait"
                    >
                      <svg
                        className="h-4 w-4 group-hover:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrait(trait.key);
                      }}
                      className="cursor-pointer inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-all duration-200 group"
                      title="Delete trait"
                    >
                      <svg
                        className="h-4 w-4 group-hover:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return viewMode === "grid" ? renderGridView() : renderTableView();
};

export default TraitListComponent;
