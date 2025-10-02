import React from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";

// TraitCard component for individual trait display
const TraitCard: React.FC<{
  trait: any;
  onAddTrait: (traitKey: string) => void;
  isDisabled: boolean;
  formatABOAlleles: (alleles: string[]) => string;
  getGenesArray: (trait: any) => string[];
  getChromosomesArray: (trait: any) => string[];
  borderColor?: string;
}> = ({
  trait,
  onAddTrait,
  isDisabled,
  formatABOAlleles,
  getGenesArray,
  getChromosomesArray,
  borderColor = "border-gray-200",
}) => (
  <button
    onClick={() => onAddTrait(trait.key)}
    disabled={isDisabled}
    className={`w-full text-left p-4 bg-white/80 cursor-pointer backdrop-blur-sm border rounded-xl hover:bg-white hover:shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 group ${borderColor}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1 flex-wrap">
          <h4
            className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition-colors truncate"
            title={trait.name}
          >
            {trait.name}
          </h4>

          {/* Gene and chromosome info - handle both new array format and legacy single values */}
          {(() => {
            const genes = getGenesArray(trait);
            const chromosomes = getChromosomesArray(trait);

            if (genes.length > 0 && chromosomes.length > 0) {
              return (
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {genes.length === 1 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                      {genes[0]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                      {genes.length} genes
                    </span>
                  )}
                  {chromosomes.length === 1 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                      Chr&nbsp;{chromosomes[0]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                      {chromosomes.length} chromosomes
                    </span>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </div>
        <p className="text-xs text-gray-500">
          <span className="font-medium">Alleles:</span>{" "}
          {trait.key === "abo_blood_group"
            ? formatABOAlleles(trait.alleles)
            : trait.alleles.join(", ")}
          {trait.inheritance_pattern && (
            <span className="ml-2">
              | <span className="font-medium">Inheritance:</span>{" "}
              <span className="capitalize">{trait.inheritance_pattern}</span>
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
);

type TraitFilter = "all" | "monogenic" | "polygenic" | "other";

interface TraitSelectorProps {
  searchTerm: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddTrait: (traitKey: string) => void;
  filteredTraits: Array<{
    key: string;
    name: string;
    gene?: string;
    chromosome?: number;
    genes?: string[];
    chromosomes?: string[];
    trait_type?: string;
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
  onAddTrait,
  filteredTraits,
  selectedTraits,
  loading = false,
  error = "",
  project = { selectedTraits: selectedTraits },
}) => {
  const [activeFilter, setActiveFilter] = React.useState<TraitFilter>("all");

  // Get count of traits for each filter
  const getTraitCounts = () => {
    const all = filteredTraits.filter(
      (t) => !selectedTraits.some((s) => s.key === t.key)
    ).length;
    const monogenic = filteredTraits.filter(
      (t) =>
        t.trait_type === "monogenic" &&
        !selectedTraits.some((s) => s.key === t.key)
    ).length;
    const polygenic = filteredTraits.filter(
      (t) =>
        t.trait_type === "polygenic" &&
        !selectedTraits.some((s) => s.key === t.key)
    ).length;
    const other = filteredTraits.filter(
      (t) => !t.trait_type && !selectedTraits.some((s) => s.key === t.key)
    ).length;
    return { all, monogenic, polygenic, other };
  };

  const traitCounts = getTraitCounts();
  // Helper function to format ABO alleles
  const formatABOAlleles = (alleles: string[]): string => {
    const alleleMap: Record<string, string> = {
      A: "Iᴬ",
      B: "Iᴮ",
      O: "i",
    };
    return alleles.map((a: string) => alleleMap[a] || a).join(", ");
  };

  // Helper function to get genes array from trait
  const getGenesArray = (trait: any): string[] => {
    if (trait.genes && trait.genes.length > 0) {
      return trait.genes;
    } else if (trait.gene) {
      return [trait.gene];
    }
    return [];
  };

  // Helper function to get chromosomes array from trait
  const getChromosomesArray = (trait: any): string[] => {
    if (trait.chromosomes && trait.chromosomes.length > 0) {
      return trait.chromosomes;
    } else if (trait.chromosome) {
      return [trait.chromosome.toString()];
    }
    return [];
  };

  return (
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
            {traitCounts[activeFilter]} available
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

      {/* Filter Badges */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeFilter === "all"
                ? "bg-gray-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Traits ({traitCounts.all})
          </button>
          <button
            onClick={() => setActiveFilter("monogenic")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeFilter === "monogenic"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
            }`}
          >
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <span>Monogenic ({traitCounts.monogenic})</span>
          </button>
          <button
            onClick={() => setActiveFilter("polygenic")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeFilter === "polygenic"
                ? "bg-violet-500 text-white shadow-md"
                : "bg-violet-100 text-violet-600 hover:bg-violet-200"
            }`}
          >
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <span>Polygenic ({traitCounts.polygenic})</span>
          </button>
          <button
            onClick={() => setActiveFilter("other")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeFilter === "other"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-orange-100 text-orange-600 hover:bg-orange-200"
            }`}
          >
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <span>Other ({traitCounts.other})</span>
          </button>
        </div>
      </div>

      {/* Trait List */}
      <div className="space-y-4">
        {(() => {
          if (loading) {
            return (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading traits...</p>
              </div>
            );
          }

          if (error) {
            return (
              <div className="text-center py-8">
                <p className="text-sm text-red-600">Error loading traits</p>
              </div>
            );
          }

          // Apply active filter to traits
          const getFilteredTraits = () => {
            switch (activeFilter) {
              case "monogenic":
                return filteredTraits.filter(
                  (trait) => trait.trait_type === "monogenic"
                );
              case "polygenic":
                return filteredTraits.filter(
                  (trait) => trait.trait_type === "polygenic"
                );
              case "other":
                return filteredTraits.filter((trait) => !trait.trait_type);
              default:
                return filteredTraits;
            }
          };

          const filteredByType = getFilteredTraits();

          // Separate traits by type for display
          const monogenicTraits = filteredByType.filter(
            (trait) => trait.trait_type === "monogenic"
          );
          const polygenicTraits = filteredByType.filter(
            (trait) => trait.trait_type === "polygenic"
          );
          const unclassifiedTraits = filteredByType.filter(
            (trait) => !trait.trait_type
          );

          return (
            <div className="space-y-6">
              {/* Monogenic Traits Section */}
              {monogenicTraits.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-gray-700">
                      Monogenic Traits
                    </h4>
                    <span className="text-xs text-gray-500">
                      ({monogenicTraits.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {monogenicTraits.map((trait) => (
                      <TraitCard
                        key={trait.key}
                        trait={trait}
                        onAddTrait={onAddTrait}
                        isDisabled={
                          project.selectedTraits.length >= 5 ||
                          selectedTraits.some((t) => t.key === trait.key)
                        }
                        formatABOAlleles={formatABOAlleles}
                        getGenesArray={getGenesArray}
                        getChromosomesArray={getChromosomesArray}
                        borderColor="border-blue-200 hover:border-blue-300"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Polygenic Traits Section */}
              {polygenicTraits.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-gray-700">
                      Polygenic Traits
                    </h4>
                    <span className="text-xs text-gray-500">
                      ({polygenicTraits.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {polygenicTraits.map((trait) => (
                      <TraitCard
                        key={trait.key}
                        trait={trait}
                        onAddTrait={onAddTrait}
                        isDisabled={
                          project.selectedTraits.length >= 5 ||
                          selectedTraits.some((t) => t.key === trait.key)
                        }
                        formatABOAlleles={formatABOAlleles}
                        getGenesArray={getGenesArray}
                        getChromosomesArray={getChromosomesArray}
                        borderColor="border-violet-200 hover:border-violet-300"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Unclassified Traits Section */}
              {unclassifiedTraits.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-gray-700">
                      Other Traits
                    </h4>
                    <span className="text-xs text-gray-500">
                      ({unclassifiedTraits.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {unclassifiedTraits.map((trait) => (
                      <TraitCard
                        key={trait.key}
                        trait={trait}
                        onAddTrait={onAddTrait}
                        isDisabled={
                          project.selectedTraits.length >= 5 ||
                          selectedTraits.some((t) => t.key === trait.key)
                        }
                        formatABOAlleles={formatABOAlleles}
                        getGenesArray={getGenesArray}
                        getChromosomesArray={getChromosomesArray}
                        borderColor="border-orange-200 hover:border-orange-300"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </>
  );
};

export default TraitSelector;
