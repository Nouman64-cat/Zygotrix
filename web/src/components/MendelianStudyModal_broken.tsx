import React, { useState, useCallback, useEffect } from "react";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BeakerIcon,
  SparklesIcon,
  TrashIcon,
  PlayIcon,
  DocumentPlusIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useTraits } from "../hooks/useTraits";
import { simulateMultipleMendelianTraits } from "../services/zygotrixApi";

interface MendelianStudyModalProps {
  onClose: () => void;
  onAddToCanvas: (item: any) => void;
}

interface SelectedTrait {
  key: string;
  name: string;
  parent1Genotype: string;
  parent2Genotype: string;
  alleles: string[];
}

interface MendelianProject {
  id: string;
  name: string;
  selectedTraits: SelectedTrait[];
  simulationResults: Record<string, Record<string, number>> | null;
  asPercentages: boolean;
  notes: string;
}

const MendelianStudyModal: React.FC<MendelianStudyModalProps> = ({
  onClose,
  onAddToCanvas,
}) => {
  const { traits, loading, error } = useTraits();
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [project, setProject] = useState<MendelianProject>({
    id: `mendelian-${Date.now()}`,
    name: "New Mendelian Study",
    selectedTraits: [],
    simulationResults: null,
    asPercentages: true,
    notes: "",
  });
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter available traits (not already selected and search term)
  const availableTraits = traits.filter(
    (trait) =>
      !project.selectedTraits.some((selected) => selected.key === trait.key) &&
      trait.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate possible genotype combinations for a trait
  const getGenotypeOptions = useCallback((alleles: string[]) => {
    if (!alleles || alleles.length === 0) return [];

    const options = [];

    // Generate all possible combinations
    for (let i = 0; i < alleles.length; i++) {
      for (let j = i; j < alleles.length; j++) {
        if (i === j) {
          // Homozygous
          options.push(alleles[i] + alleles[i]);
        } else {
          // Heterozygous - add both orders
          options.push(alleles[i] + alleles[j]);
          options.push(alleles[j] + alleles[i]);
        }
      }
    }

    // Remove duplicates and sort
    return [...new Set(options)].sort();
  }, []);

  // Add a trait to selection
  const addTrait = (traitKey: string) => {
    if (project.selectedTraits.length >= 5) {
      setSimulationError("Maximum 5 traits allowed");
      return;
    }

    const trait = traits.find((t) => t.key === traitKey);
    console.log("Adding trait:", traitKey, "Found trait:", trait);
    if (!trait) return;

    const newTrait: SelectedTrait = {
      key: trait.key,
      name: trait.name,
      parent1Genotype: "",
      parent2Genotype: "",
      alleles: trait.alleles,
    };

    console.log("New trait object:", newTrait);
    setProject((prev) => ({
      ...prev,
      selectedTraits: [...prev.selectedTraits, newTrait],
    }));
    setSearchTerm("");
  };

  // Remove a trait from selection
  const removeTrait = (traitKey: string) => {
    setProject((prev) => ({
      ...prev,
      selectedTraits: prev.selectedTraits.filter((t) => t.key !== traitKey),
    }));
  };

  // Update genotype for a specific trait
  const updateGenotype = (
    traitKey: string,
    parent: "parent1" | "parent2",
    genotype: string
  ) => {
    setProject((prev) => ({
      ...prev,
      selectedTraits: prev.selectedTraits.map((trait) =>
        trait.key === traitKey
          ? { ...trait, [`${parent}Genotype`]: genotype }
          : trait
      ),
    }));
  };

  // Check if simulation can be run
  const canSimulate =
    project.selectedTraits.length > 0 &&
    project.selectedTraits.every(
      (trait) => trait.parent1Genotype && trait.parent2Genotype
    );

  // Run simulation for multiple traits
  const handleSimulation = async () => {
    if (!canSimulate) return;

    setSimulationLoading(true);
    setSimulationError(null);

    try {
      // Prepare data for API call
      const parent1Genotypes = project.selectedTraits.reduce((acc, trait) => {
        acc[trait.key] = trait.parent1Genotype;
        return acc;
      }, {} as Record<string, string>);

      const parent2Genotypes = project.selectedTraits.reduce((acc, trait) => {
        acc[trait.key] = trait.parent2Genotype;
        return acc;
      }, {} as Record<string, string>);

      const response = await simulateMultipleMendelianTraits(
        parent1Genotypes,
        parent2Genotypes,
        project.selectedTraits.map((t) => t.key),
        project.asPercentages
      );

      setProject((prev) => ({ ...prev, simulationResults: response.results }));
      setShowResultsModal(true);
    } catch (error) {
      console.error("Simulation failed:", error);
      setSimulationError("Simulation failed. Please try again.");
    } finally {
      setSimulationLoading(false);
    }
  };

  // Handle adding to canvas
  const handleAddToCanvas = useCallback(() => {
    const itemData = {
      id: project.id,
      type: "mendelian-study",
      title: project.name,
      subtitle: `${project.selectedTraits.length} trait${
        project.selectedTraits.length !== 1 ? "s" : ""
      } selected`,
      content: project,
      simulationResults: project.simulationResults,
    };

    onAddToCanvas(itemData);
    onClose();
  }, [project, onAddToCanvas, onClose]);

  // Reset form when modal mounts
  useEffect(() => {
    setProject({
      id: `mendelian-${Date.now()}`,
      name: "New Mendelian Study",
      selectedTraits: [],
      simulationResults: null,
      asPercentages: true,
      notes: "",
    });
    setSimulationError(null);
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-100">
          {/* Primary Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <BeakerIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Study Setup</h2>
                <p className="text-sm text-gray-600">Configure your Mendelian genetics study</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSimulation}
                disabled={
                  simulationLoading ||
                  !project.selectedTraits.every(
                    (trait) => trait.parent1Genotype && trait.parent2Genotype
                  )
                }
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                {simulationLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5" />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Study Details */}
        <div className="w-80 p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-r border-gray-200 overflow-y-auto">
          {/* Study Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Study Name
            </label>
            <input
              type="text"
              value={project.name}
              onChange={(e) =>
                setProject((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter study name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm text-sm"
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              📝 Notes (Optional)
            </label>
            <textarea
              value={project.notes}
              onChange={(e) =>
                setProject((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all duration-200 bg-white/80 backdrop-blur-sm text-sm"
              placeholder="Add any notes about this study..."
            />
          </div>
        </div>

        {/* Middle Column - Selected Traits Configuration */}
        <div className="flex-1 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-r border-gray-200 p-5 overflow-y-auto">
          <div className="flex items-center space-x-2 mb-5">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Selected Traits</h3>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
              {project.selectedTraits.length}/5
            </span>
          </div>

          {/* Selected Traits List */}
          {project.selectedTraits.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
              <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No traits selected yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Add traits using the right sidebar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.selectedTraits.map((trait, index) => (
                <div
                  key={trait.key}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {trait.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => removeTrait(trait.key)}
                      className="group p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Remove trait"
                    >
                      <TrashIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>

                  {/* Parent Genotypes - Side by Side Layout */}
                  <div className="space-y-4">
                    <div className="text-xs font-medium text-gray-700 mb-3 flex items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                        <span>Parent Genotype Selection</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Parent A Genotype - Left Side */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-blue-600 mb-2 flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            A
                          </div>
                          <span>Parent A</span>
                        </label>
                        <select
                          value={trait.parent1Genotype}
                          onChange={(e) =>
                            updateGenotype(trait.key, "parent1", e.target.value)
                          }
                          className="w-full px-3 py-2.5 text-sm border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <option value="" disabled className="text-gray-400">
                            Choose Parent A genotype...
                          </option>
                          {(() => {
                            const options = getGenotypeOptions(trait.alleles);
                            console.log(
                              `Trait ${trait.name} alleles:`,
                              trait.alleles,
                              "Generated options:",
                              options
                            );
                            return options.map((genotype) => (
                              <option key={genotype} value={genotype}>
                                {genotype}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>

                      {/* Parent B Genotype - Right Side */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-pink-600 mb-2 flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            B
                          </div>
                          <span>Parent B</span>
                        </label>
                        <select
                          value={trait.parent2Genotype}
                          onChange={(e) =>
                            updateGenotype(trait.key, "parent2", e.target.value)
                          }
                          className="w-full px-3 py-2.5 text-sm border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-pink-50/50 hover:bg-pink-50 hover:border-pink-300"
                        >
                          <option value="" disabled className="text-gray-400">
                            Choose Parent B genotype...
                          </option>
                          {(() => {
                            const options = getGenotypeOptions(trait.alleles);
                            return options.map((genotype) => (
                              <option key={genotype} value={genotype}>
                                {genotype}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>

                    {/* Visual Cross Indicator */}
                    {trait.parent1Genotype && trait.parent2Genotype && (
                      <div className="flex items-center justify-center py-2">
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-mono">
                            {trait.parent1Genotype}
                          </span>
                          <div className="text-gray-400 font-bold text-lg">
                            ×
                          </div>
                          <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-md font-mono">
                            {trait.parent2Genotype}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simulation Results */}
          {project.simulationResults && (
            <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg mr-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Simulation Results
                  </h3>
                  <p className="text-sm text-gray-600">
                    Predicted offspring probabilities
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(project.simulationResults).map(
                  ([traitKey, results]) => {
                    const traitInfo = project.selectedTraits.find(
                      (t) => t.key === traitKey
                    );

                    // Sort results by probability for better display
                    const sortedResults = results
                      ? Object.entries(results).sort(([, a], [, b]) => b - a)
                      : [];
                    const totalProbability = sortedResults.reduce(
                      (sum, [, prob]) => sum + prob,
                      0
                    );

                    return (
                      <div
                        key={traitKey}
                        className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mr-3"></div>
                          <h4 className="text-lg font-semibold text-gray-800">
                            {traitInfo?.name || traitKey}
                          </h4>
                        </div>

                        <div className="space-y-3">
                          {sortedResults.map(
                            ([phenotype, probability], index) => {
                              const percentage =
                                totalProbability > 0
                                  ? (probability / totalProbability) * 100
                                  : 0;
                              const isHighest = index === 0;

                              return (
                                <div key={phenotype} className="relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <div
                                        className={`w-4 h-4 rounded-full mr-3 ${
                                          isHighest
                                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                            : "bg-gradient-to-r from-blue-400 to-indigo-500"
                                        }`}
                                      ></div>
                                      <span className="text-sm font-medium text-gray-700">
                                        {phenotype}
                                      </span>
                                      {isHighest && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                          Most Likely
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">
                                      {percentage.toFixed(1)}%
                                    </span>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                        isHighest
                                          ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                          : "bg-gradient-to-r from-blue-400 to-indigo-500"
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>

                        {/* Summary */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Total Offspring Analyzed</span>
                            <span className="font-medium">
                              {sortedResults.length} phenotype
                              {sortedResults.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Overall Summary */}
              <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Analysis Complete</span>
                  </div>
                  <span className="text-indigo-600 font-medium">
                    {Object.keys(project.simulationResults).length} trait
                    {Object.keys(project.simulationResults).length !== 1
                      ? "s"
                      : ""}{" "}
                    analyzed
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {simulationError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg border-l-4 border-l-red-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 text-sm font-medium">
                    {simulationError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trait Selection Sidebar */}
        <div className="w-80 bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 p-5 overflow-y-auto">
          <div className="flex items-center space-x-2 mb-5">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <PlusIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Add Traits</h3>
          </div>

          {/* Search Input */}
          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search traits..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
            />
          </div>

          {/* Available Traits List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">Loading traits...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="p-3 bg-red-100 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">
                    Error loading traits
                  </p>
                </div>
              </div>
            ) : availableTraits.length === 0 ? (
              <div className="text-center py-8">
                <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">
                  {searchTerm
                    ? "No traits match your search"
                    : "All available traits selected"}
                </p>
              </div>
            ) : (
              availableTraits.map((trait) => (
                <button
                  key={trait.key}
                  onClick={() => addTrait(trait.key)}
                  disabled={project.selectedTraits.length >= 5}
                  className="w-full text-left p-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-purple-300 hover:shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-purple-700 transition-colors">
                        {trait.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Alleles:</span>{" "}
                        {trait.alleles.join(", ")}
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

          ))
            )}
          </div>

          {project.selectedTraits.length >= 5 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-yellow-800 text-xs font-medium">
                    Maximum of 5 traits reached. Remove a trait to add more.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Results Modal */}
      {showResultsModal && project.simulationResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <BeakerIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Simulation Results</h2>
                  <p className="text-sm text-gray-600">Offspring trait predictions</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAddToCanvas}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <DocumentPlusIcon className="h-5 w-5" />
                  <span>Add to Canvas</span>
                </button>
                
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {project.simulationResults && Object.entries(project.simulationResults).map(([traitKey, result]) => {
                  const trait = traits.find(t => t.key === traitKey);
                  return (
                    <div key={traitKey} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">🧬</span>
                        {trait?.name || traitKey}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(result.offspring_distribution).map(([genotype, percentage]) => (
                          <div key={genotype} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-700">{genotype}</span>
                              <span className="text-sm font-semibold text-indigo-600">
                                {(percentage * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MendelianStudyModal;
        </div>
      </div>
      
      {/* Results Modal */}
      {showResultsModal && project.simulationResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <BeakerIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Simulation Results</h2>
                  <p className="text-sm text-gray-600">Offspring trait predictions</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAddToCanvas}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <DocumentPlusIcon className="h-5 w-5" />
                  <span>Add to Canvas</span>
                </button>
                
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {project.simulationResults && Object.entries(project.simulationResults).map(([traitKey, result]) => {
                  const trait = traits.find(t => t.key === traitKey);
                  return (
                    <div key={traitKey} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">🧬</span>
                        {trait?.name || traitKey}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(result.offspring_distribution).map(([genotype, percentage]) => (
                          <div key={genotype} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-700">{genotype}</span>
                              <span className="text-sm font-semibold text-indigo-600">
                                {(percentage * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
        
      {/* Close Main Content Area */}
      </div>
      
      {/* Close Modal Container */}
      </div>
      
      {/* Close Backdrop */}
      </div>
      
      {/* Results Modal */}
      {showResultsModal && project.simulationResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <BeakerIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Simulation Results</h2>
                  <p className="text-sm text-gray-600">Offspring trait predictions</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAddToCanvas}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <DocumentPlusIcon className="h-5 w-5" />
                  <span>Add to Canvas</span>
                </button>
                
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
                        <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {project.simulationResults && Object.entries(project.simulationResults).map(([traitKey, result]) => {
                  const trait = traits.find(t => t.key === traitKey);
                  return (
                    <div key={traitKey} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">🧬</span>
                        {trait?.name || traitKey}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(result.offspring_distribution).map(([genotype, percentage]) => (
                          <div key={genotype} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-700">{genotype}</span>
                              <span className="text-sm font-semibold text-indigo-600">
                                {(percentage * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MendelianStudyModal;
