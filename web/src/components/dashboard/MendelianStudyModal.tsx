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
} from "@heroicons/react/24/outline";
import { IoMale } from "react-icons/io5";
import { GiFemale } from "react-icons/gi";
import { useTraits } from "../../hooks/useTraits";
import { simulateMultipleMendelianTraits } from "../../services/zygotrixApi";
import type { MendelianSimulationTraitResult } from "../../types/api";

interface MendelianStudyModalProps {
  onClose: () => void;
  onAddToCanvas: (item: any) => void;
  initialData?: any;
  isEditing?: boolean;
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
  simulationResults: Record<string, MendelianSimulationTraitResult> | null;
  asPercentages: boolean;
  notes: string;
}

const MendelianStudyModal: React.FC<MendelianStudyModalProps> = ({
  onClose,
  onAddToCanvas,
  initialData,
  isEditing = false,
}) => {
  const { traits, loading, error } = useTraits();
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [project, setProject] = useState<MendelianProject>(() => {
    if (initialData && isEditing) {
      return {
        id: initialData.id || `mendelian-${Date.now()}`,
        name: initialData.name || "Mendelian Study",
        selectedTraits: initialData.selectedTraits || [],
        simulationResults: initialData.simulationResults || null,
        asPercentages:
          initialData.asPercentages !== undefined
            ? initialData.asPercentages
            : true,
        notes: initialData.notes || "",
      };
    }
    return {
      id: `mendelian-${Date.now()}`,
      name: "New Mendelian Study",
      selectedTraits: [],
      simulationResults: null,
      asPercentages: true,
      notes: "",
    };
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Filter traits based on search term
  const filteredTraits = traits.filter((trait) =>
    trait.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Number of traits available to add (filtered minus already selected)
  const availableCount = filteredTraits.filter(
    (t) => !project.selectedTraits.some((s) => s.key === t.key)
  ).length;

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
      return;
    }

    const trait = traits.find((t) => t.key === traitKey);
    if (!trait) return;

    const newTrait: SelectedTrait = {
      key: trait.key,
      name: trait.name,
      parent1Genotype: "",
      parent2Genotype: "",
      alleles: trait.alleles,
    };

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

  // Update trait genotype
  const updateTraitGenotype = (
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

  // Handle simulation
  const handleSimulation = async () => {
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

  // Initialize or reset form when modal mounts or when editing props change
  useEffect(() => {
    if (initialData && isEditing) {
      setProject((prev) => ({
        id: initialData.id || prev.id,
        name: initialData.name || prev.name,
        selectedTraits: initialData.selectedTraits || [],
        simulationResults: initialData.simulationResults || null,
        asPercentages: true, // Always force to true
        notes: initialData.notes || "",
      }));
    } else {
      setProject({
        id: `mendelian-${Date.now()}`,
        name: "New Mendelian Study",
        selectedTraits: [],
        simulationResults: null,
        asPercentages: true,
        notes: "",
      });
    }

    setSimulationError(null);
  }, [initialData, isEditing]);

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
                <p className="text-sm text-gray-600">
                  Configure your Mendelian genetics study
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSimulation}
                disabled={
                  simulationLoading ||
                  project.selectedTraits.length === 0 ||
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
                  <div className="cursor-pointer flex items-center justify-center space-x-2">
                    <PlayIcon className="h-5 w-5" />
                    <span>Run Simulation</span>
                  </div>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 cursor-pointer hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Selected Traits
                    </h3>
                    <p className="text-sm text-gray-500">
                      Configure genetic crosses for each trait
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 text-sm font-bold px-3 py-1.5 rounded-full border border-purple-200">
                    {project.selectedTraits.length}/5
                  </span>
                </div>
              </div>

              {project.selectedTraits.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <SparklesIcon className="h-12 w-12 text-purple-500" />
                    </div>
                    {/* Floating DNA icons */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-lg">🧬</span>
                    </div>
                    <div
                      className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-full flex items-center justify-center animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <span className="text-sm">⚗️</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Start Your Genetic Study
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Select traits from the browser on the right to begin
                    configuring your Mendelian inheritance study
                  </p>
                  <div className="mt-6 inline-flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 px-4 py-2 rounded-full">
                    <span>👉</span>
                    <span className="font-medium">
                      Browse traits to get started
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {project.selectedTraits.map((selectedTrait) => (
                    <div
                      key={selectedTrait.key}
                      className="bg-white/90 backdrop-blur-sm border border-purple-200/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300/80"
                    >
                      {/* Trait Header */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <SparklesIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-bold text-gray-900 text-base">
                                {selectedTrait.name}
                              </h4>
                              {(() => {
                                const traitInfo = traits.find(
                                  (t) => t.key === selectedTrait.key
                                );
                                return traitInfo?.gene &&
                                  traitInfo?.chromosome ? (
                                  <div className="flex items-center space-x-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      {traitInfo.gene}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Chr {traitInfo.chromosome}
                                    </span>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Alleles:</span>{" "}
                              {selectedTrait.alleles.join(", ")}
                              {(() => {
                                const traitInfo = traits.find(
                                  (t) => t.key === selectedTrait.key
                                );
                                return traitInfo?.inheritance_pattern ? (
                                  <span className="ml-2">
                                    |{" "}
                                    <span className="font-medium">
                                      Inheritance:
                                    </span>{" "}
                                    <span className="capitalize">
                                      {traitInfo.inheritance_pattern}
                                    </span>
                                  </span>
                                ) : null;
                              })()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeTrait(selectedTrait.key)}
                          className="p-2.5 text-red-400 cursor-pointer hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Parent Genotype Configuration */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2 rounded-full">
                            <span className="text-sm font-semibold text-gray-700">
                              Genetic Cross
                            </span>
                            <span className="text-lg">🧬</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 items-center">
                          {/* Parent 1 */}
                          <div className="relative">
                            <div className="absolute -top-2 left-3 bg-white px-2 z-10">
                              <label className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center space-x-1">
                                <span>Female Parent</span>
                                <GiFemale className="h-4 w-4 text-purple-600" />
                              </label>
                            </div>
                            <select
                              value={selectedTrait.parent1Genotype}
                              onChange={(e) =>
                                updateTraitGenotype(
                                  selectedTrait.key,
                                  "parent1",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 cursor-pointer py-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gradient-to-r from-purple-50/50 to-white text-sm font-semibold shadow-sm transition-all duration-200 hover:border-purple-300 appearance-none min-w-0"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: "right 0.75rem center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "1.5em 1.5em",
                                paddingRight: "3rem",
                              }}
                            >
                              <option value="" className="text-gray-500">
                                Select genotype
                              </option>
                              {getGenotypeOptions(selectedTrait.alleles)
                                .filter((genotype) => {
                                  const traitInfo = traits.find(
                                    (t) => t.key === selectedTrait.key
                                  );
                                  const phenotype =
                                    traitInfo?.phenotype_map[genotype];
                                  return phenotype && phenotype !== "Unknown";
                                })
                                .map((genotype) => {
                                  const traitInfo = traits.find(
                                    (t) => t.key === selectedTrait.key
                                  );
                                  const phenotype =
                                    traitInfo?.phenotype_map[genotype] ||
                                    "Unknown";
                                  return (
                                    <option
                                      key={genotype}
                                      value={genotype}
                                      className="font-semibold"
                                    >
                                      {genotype} → {phenotype}
                                    </option>
                                  );
                                })}
                            </select>
                            {selectedTrait.parent1Genotype && (
                              <div className="absolute -bottom-1 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                ✓
                              </div>
                            )}
                          </div>

                          {/* Cross Symbol */}
                          <div className="flex justify-center">
                            <div className="w-14 h-14 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center border-2 border-purple-200 shadow-sm">
                              <span className="text-2xl font-bold text-purple-600">
                                ×
                              </span>
                            </div>
                          </div>

                          {/* Parent 2 */}
                          <div className="relative">
                            <div className="absolute -top-2 left-3 bg-white px-2 z-10">
                              <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-1">
                                <span>Male Parent</span>
                                <IoMale className="h-4 w-4 text-indigo-600" />
                              </label>
                            </div>
                            <select
                              value={selectedTrait.parent2Genotype}
                              onChange={(e) =>
                                updateTraitGenotype(
                                  selectedTrait.key,
                                  "parent2",
                                  e.target.value
                                )
                              }
                              className="w-full cursor-pointer px-2 py-4 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-white text-sm font-semibold shadow-sm transition-all duration-200 hover:border-indigo-300 appearance-none min-w-0"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: "right 0.75rem center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "1.5em 1.5em",
                                paddingRight: "3rem",
                              }}
                            >
                              <option value="" className="text-gray-500">
                                Select genotype
                              </option>
                              {getGenotypeOptions(selectedTrait.alleles)
                                .filter((genotype) => {
                                  const traitInfo = traits.find(
                                    (t) => t.key === selectedTrait.key
                                  );
                                  const phenotype =
                                    traitInfo?.phenotype_map[genotype];
                                  return phenotype && phenotype !== "Unknown";
                                })
                                .map((genotype) => {
                                  const traitInfo = traits.find(
                                    (t) => t.key === selectedTrait.key
                                  );
                                  const phenotype =
                                    traitInfo?.phenotype_map[genotype] ||
                                    "Unknown";
                                  return (
                                    <option
                                      key={genotype}
                                      value={genotype}
                                      className="font-semibold"
                                    >
                                      {genotype} → {phenotype}
                                    </option>
                                  );
                                })}
                            </select>
                            {selectedTrait.parent2Genotype && (
                              <div className="absolute -bottom-1 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                ✓
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Genotype Status */}
                        {selectedTrait.parent1Genotype &&
                        selectedTrait.parent2Genotype ? (
                          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  ✓
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-green-800">
                                Ready for simulation:{" "}
                                {selectedTrait.parent1Genotype} ×{" "}
                                {selectedTrait.parent2Genotype}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  !
                                </span>
                              </div>
                              <span className="text-sm font-medium text-amber-800">
                                Please select both parent genotypes to continue
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error display */}
              {simulationError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{simulationError}</p>
                </div>
              )}
            </div>

            {/* Right Column - Trait Browser */}
            <div className="w-80 p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/50 overflow-y-auto">
              <div className="flex items-center justify-between space-x-2 mb-5">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                    <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Trait Browser
                  </h3>
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
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                    <p className="text-sm text-gray-500 mt-2">
                      Loading traits...
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-600">Error loading traits</p>
                  </div>
                ) : (
                  filteredTraits.map((trait) => (
                    <button
                      key={trait.key}
                      onClick={() => addTrait(trait.key)}
                      disabled={project.selectedTraits.length >= 5}
                      className="w-full text-left p-4 bg-white/80 cursor-pointer backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-purple-300 hover:shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition-colors flex-shrink-0">
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
                            {trait.alleles.join(", ")}
                            {trait.inheritance_pattern && (
                              <span className="ml-2">
                                |{" "}
                                <span className="font-medium">
                                  Inheritance:
                                </span>{" "}
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
                  <h2 className="text-xl font-bold text-gray-900">
                    Simulation Results
                  </h2>
                  <p className="text-sm text-gray-600">
                    Offspring trait predictions
                  </p>
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
              <div className="space-y-4">
                {Object.entries(project.simulationResults).map(
                  ([traitKey, result]) => {
                    const trait = traits.find((t) => t.key === traitKey);
                    const selectedTrait = project.selectedTraits.find(
                      (t) => t.key === traitKey
                    );

                    // The result now contains both genotypic_ratios and phenotypic_ratios
                    if (
                      !result ||
                      typeof result !== "object" ||
                      !result.genotypic_ratios ||
                      !result.phenotypic_ratios
                    ) {
                      return (
                        <div
                          key={traitKey}
                          className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200"
                        >
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="mr-2">⚠️</span>
                            {trait?.name || traitKey}
                          </h4>
                          <p className="text-red-600">
                            No simulation data available for this trait.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={traitKey}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            <span className="mr-2">🧬</span>
                            {trait?.name || traitKey}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <GiFemale className="h-4 w-4 text-purple-600" />
                              <span className="text-gray-600">
                                {selectedTrait?.parent1Genotype} →{" "}
                                {trait?.phenotype_map[
                                  selectedTrait?.parent1Genotype || ""
                                ] || "Unknown"}
                              </span>
                            </div>
                            <span className="text-gray-400 text-2xl">×</span>
                            <div className="flex items-center space-x-2">
                              <IoMale className="h-4 w-4 text-indigo-600" />
                              <span className="text-gray-600">
                                {selectedTrait?.parent2Genotype} →{" "}
                                {trait?.phenotype_map[
                                  selectedTrait?.parent2Genotype || ""
                                ] || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Display both genotypic and phenotypic ratios (horizontal bars) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                          {/* Genotypic Ratios Section */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              Genotypic Ratios
                            </h5>
                            <div className="space-y-2 bg-blue-50/30 rounded-lg p-3 border border-blue-100">
                              {Object.entries(result.genotypic_ratios).map(
                                ([genotype, percentage]) => (
                                  <div
                                    key={genotype}
                                    className="flex items-center gap-3"
                                  >
                                    <div className="w-24 text-xs">
                                      <div className="font-medium text-gray-800">
                                        {genotype}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {trait?.phenotype_map?.[genotype] ||
                                          "Unknown"}
                                      </div>
                                    </div>

                                    <div className="flex-1 h-3 bg-white rounded-full overflow-hidden border border-blue-100">
                                      <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                                        style={{
                                          width: `${Math.max(percentage, 2)}%`,
                                        }}
                                      />
                                    </div>

                                    <div className="w-12 text-right text-xs font-semibold text-blue-600">
                                      {`${percentage.toFixed(1)}%`}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Phenotypic Ratios Section */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              Phenotypic Ratios
                            </h5>
                            <div className="space-y-2 bg-green-50/30 rounded-lg p-3 border border-green-100">
                              {Object.entries(result.phenotypic_ratios).map(
                                ([phenotype, percentage]) => (
                                  <div
                                    key={phenotype}
                                    className="flex items-center gap-3"
                                  >
                                    <div className="w-28 text-xs">
                                      <div className="font-semibold text-gray-800">
                                        {phenotype}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Phenotype
                                      </div>
                                    </div>

                                    <div className="flex-1 h-3 bg-white rounded-full overflow-hidden border border-green-100">
                                      <div
                                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                                        style={{
                                          width: `${Math.max(percentage, 2)}%`,
                                        }}
                                      />
                                    </div>

                                    <div className="w-12 text-right text-xs font-semibold text-green-600">
                                      {`${percentage.toFixed(1)}%`}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MendelianStudyModal;
