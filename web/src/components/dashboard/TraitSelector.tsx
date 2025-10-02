import React from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
interface TraitSelectorProps {
  searchTerm: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  availableCount: number;
  onAddTrait: (traitKey: string) => void;
  filteredTraits: Array<{
    key: string;
    name: string;
    gene?: string;
    chromosome?: number;
    alleles: string[];
    inheritance_pattern?: string;
  }>;
  selectedTraits: Array<{ key: string }>;
  loading?: boolean;
  error?: string;
  project?: { selectedTraits: Array<{ key: string }> };
}

const TraitSelector: React.FC<TraitSelectorProps> = ({
  searchTerm,
  onSearch,
  availableCount,
  onAddTrait,
  filteredTraits,
  selectedTraits,
  loading = false,
  error = "",
  project = { selectedTraits: selectedTraits },
}) => (
  <>
    <div className="flex items-center justify-between space-x-2 mb-5">
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
          <MagnifyingGlassIcon className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Trait Browser</h3>
      </div>
      <div>
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
          {availableCount} available
        </span>
      </div>
    </div>

    {/* Search */}
    <div className="mb-4">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={onSearch}
          placeholder="Search traits..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 backdrop-blur-sm text-sm"
        />
      </div>
    </div>

    {/* Trait List */}
    <div className="space-y-3">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading traits...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-red-600">Error loading traits</p>
        </div>
      ) : (
        filteredTraits.map((trait) => (
          <button
            key={trait.key}
            onClick={() => onAddTrait(trait.key)}
            disabled={
              project.selectedTraits.length >= 5 ||
              selectedTraits.some((t) => t.key === trait.key)
            }
            className="w-full text-left p-4 bg-white/80 cursor-pointer backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-purple-300 hover:shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1 flex-wrap">
                  <h4
                    className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition-colors truncate"
                    style={{ maxWidth: "180px", display: "inline-block" }}
                    title={trait.name}
                  >
                    {trait.name}
                  </h4>
                  {trait.gene && trait.chromosome && (
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                        {trait.gene}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                        Chr&nbsp;{trait.chromosome}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Alleles:</span>{" "}
                  {trait.key === "abo_blood_group"
                    ? (() => {
                        // Map ABO alleles to I notation
                        const alleleMap: Record<string, string> = {
                          A: "Iᴬ",
                          B: "Iᴮ",
                          O: "i",
                        };
                        return trait.alleles
                          .map((a: string) => alleleMap[a] || a)
                          .join(", ");
                      })()
                    : trait.alleles.join(", ")}
                  {trait.inheritance_pattern && (
                    <span className="ml-2">
                      | <span className="font-medium">Inheritance:</span>{" "}
                      <span className="capitalize">
                        {trait.inheritance_pattern}
                      </span>
                    </span>
                  )}
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <PlusIcon className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  </>
);

export default TraitSelector;
