import React, { useState, useCallback, useEffect } from "react";
import {
  XMarkIcon,
  BeakerIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import SelectedTraitHeader from "./SelectedTraitHeader";
import HeaderBar from "./HeaderBar";
import TraitSelector from "./TraitSelector";
import LabeledInput from "./LabeledInput";
import LabeledTextarea from "./LabeledTextarea";
import SimulationButton from "./SimulationButton";
import EmptyState from "./EmptyState";
import ParentGenotypeSelect from "./ParentGenotypeSelect";
import { useTraits } from "../../hooks/useTraits";
import { GiFemale } from "react-icons/gi";
import { IoMale } from "react-icons/io5";
import { getAboGenotypeMap } from "./helpers";

import SimulationResultsModal from "../modals/SimulationResultsModal";
import type {
  MendelianProject,
  MendelianStudyModalProps,
  SelectedTrait,
} from "./types";

const MendelianStudyModal: React.FC<MendelianStudyModalProps> = ({
  onClose,
  onAddToCanvas,
  initialData,
  isEditing = false,
}) => {
  const { traits } = useTraits();
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
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Filter traits based on search term
  const filteredTraits = traits.filter((trait) =>
    trait.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate possible genotype combinations for a trait
  const getGenotypeOptions = useCallback((alleles: string[]) => {
    if (!alleles || alleles.length === 0) return [];

    const options: string[] = [];
    // For multi-character alleles, generate all diploid combinations
    for (let i = 0; i < alleles.length; i++) {
      for (let j = i; j < alleles.length; j++) {
        if (i === j) {
          options.push(`${alleles[i]}${alleles[i]}`);
        } else {
          options.push(`${alleles[i]}${alleles[j]}`);
          options.push(`${alleles[j]}${alleles[i]}`);
        }
      }
    }
    // Remove duplicates and sort by string length then alphabetically
    return [...new Set(options)].sort(
      (a, b) => a.length - b.length || a.localeCompare(b)
    );
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
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-100 dark:border-slate-700">
          {/* Primary Header */}
          <HeaderBar
            title="Study Setup"
            subtitle="Configure your Mendelian genetics study"
            leftIcon={
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <BeakerIcon className="h-6 w-6 text-white" />
              </div>
            }
            rightActions={
              <>
                <SimulationButton
                  project={project}
                  setProject={setProject}
                  traits={traits}
                  setSimulationError={setSimulationError}
                  setShowResultsModal={setShowResultsModal}
                  disabled={
                    project.selectedTraits.length === 0 ||
                    project.selectedTraits.some(
                      (trait) =>
                        !trait.parent1Genotype || !trait.parent2Genotype
                    )
                  }
                />
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 dark:text-slate-400 cursor-pointer hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </>
            }
          />

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column - Study Details */}
            <div className="w-80 p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-900/50 border-r border-gray-200 dark:border-slate-700 overflow-y-auto">
              <LabeledInput
                label="Study Name"
                value={project.name}
                onChange={(e) =>
                  setProject((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter study name..."
                className="mb-6"
              />
              <LabeledTextarea
                label="Notes (Optional)"
                value={project.notes}
                onChange={(e) =>
                  setProject((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any notes about this study..."
                className="mb-4"
              />

              <div className="mb-6">
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border border-indigo-200/50 dark:border-indigo-700/50 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <SparklesIcon className="h-3 w-3 text-white" />
                    </div>
                    <div className="font-semibold text-sm text-gray-800 dark:text-slate-200">
                      Selected Traits
                    </div>
                    <div className="ml-auto bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded-full">
                      {project.selectedTraits.length}/5
                    </div>
                  </div>

                  {project.selectedTraits.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-gray-400 dark:text-slate-500 text-2xl mb-2">
                        🧬
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                        No traits selected yet
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        Add traits from the browser →
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {project.selectedTraits.map((trait, index) => {
                        const isAbo = trait.key === "abo_blood_group";
                        const genotypeMap = getAboGenotypeMap();
                        const parent1 =
                          isAbo && trait.parent1Genotype
                            ? genotypeMap[trait.parent1Genotype] ||
                              trait.parent1Genotype
                            : trait.parent1Genotype;
                        const parent2 =
                          isAbo && trait.parent2Genotype
                            ? genotypeMap[trait.parent2Genotype] ||
                              trait.parent2Genotype
                            : trait.parent2Genotype;

                        const isComplete = parent1 && parent2;

                        return (
                          <div
                            key={index}
                            className={`
                              bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-lg p-3 border transition-all duration-200
                              ${
                                isComplete
                                  ? "border-green-200 dark:border-green-700 bg-green-50/30 dark:bg-green-900/20"
                                  : "border-gray-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50"
                              }
                            `}
                          >
                            <div className="space-y-2">
                              {/* Header row with trait name and status */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div
                                    className={`
                                    w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                    ${
                                      isComplete
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-slate-300"
                                    }
                                  `}
                                  >
                                    {isComplete ? "✓" : index + 1}
                                  </div>
                                  <span
                                    className="font-semibold text-sm text-gray-800 dark:text-slate-200 truncate"
                                    title={trait.name}
                                  >
                                    {trait.name}
                                  </span>
                                </div>

                                {!isComplete && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full font-medium flex-shrink-0">
                                    Configure →
                                  </span>
                                )}
                              </div>

                              {/* Genetic cross display */}
                              {isComplete && (
                                <div className="flex items-center justify-center gap-2 pt-1">
                                  <div className="flex items-center gap-1 bg-purple-100/80 dark:bg-purple-900/50 px-2 py-1 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
                                    <GiFemale className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <span className="text-purple-800 dark:text-purple-300 font-bold text-xs whitespace-nowrap">
                                      {parent1}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-full border border-gray-200 dark:border-slate-600">
                                    <span className="text-gray-600 dark:text-slate-300 font-bold text-sm">
                                      ×
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-blue-100/80 dark:bg-blue-900/50 px-2 py-1 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                                    <IoMale className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <span className="text-blue-800 dark:text-blue-300 font-bold text-xs whitespace-nowrap">
                                      {parent2}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Selected Traits Configuration */}
            <div className="flex-1 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-900/50 border-r border-gray-200 dark:border-slate-700 p-5 overflow-y-auto">
              {project.selectedTraits.length === 0 ? (
                <EmptyState message="Start Your Genetic Study" />
              ) : (
                <div className="space-y-5">
                  {/* Trait summary section (top of each trait card) */}

                  {project.selectedTraits.map((selectedTrait) => (
                    <div
                      key={selectedTrait.key}
                      className="bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm border border-purple-200/60 dark:border-purple-700/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300/80 dark:hover:border-purple-600/80"
                    >
                      {/* Trait Header */}
                      <SelectedTraitHeader
                        selectedTrait={selectedTrait}
                        traits={traits}
                        onRemove={removeTrait}
                      />

                      {/* Parent Genotype Configuration */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2 lg:gap-4">
                          {/* Parent 1 */}
                          <div className="relative flex-1 min-w-[140px]">
                            <div className="absolute -top-2 left-3 bg-white dark:bg-slate-700 px-2 z-10">
                              <label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center space-x-1">
                                <span>Female Parent</span>
                                <GiFemale className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </label>
                            </div>
                            <ParentGenotypeSelect
                              label="Female Parent"
                              value={selectedTrait.parent1Genotype}
                              options={getGenotypeOptions(
                                selectedTrait.alleles
                              ).filter((genotype) => {
                                const traitInfo = traits.find(
                                  (t) => t.key === selectedTrait.key
                                );
                                const phenotype =
                                  traitInfo?.phenotype_map[genotype];
                                return phenotype && phenotype !== "Unknown";
                              })}
                              onChange={(e) =>
                                updateTraitGenotype(
                                  selectedTrait.key,
                                  "parent1",
                                  e.target.value
                                )
                              }
                              phenotypeMap={
                                traits.find((t) => t.key === selectedTrait.key)
                                  ?.phenotype_map || {}
                              }
                            />
                            {selectedTrait.parent1Genotype && (
                              <div className="absolute -bottom-1 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                ✓
                              </div>
                            )}
                          </div>

                          {/* Cross Symbol */}
                          <div className="flex justify-center items-center mx-2">
                            <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center border-2 border-purple-200 dark:border-purple-700 shadow-sm">
                              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                ×
                              </span>
                            </div>
                          </div>

                          {/* Parent 2 */}
                          <div className="relative flex-1 min-w-[140px]">
                            <div className="absolute -top-2 left-3 bg-white dark:bg-slate-700 px-2 z-10">
                              <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                                <span>Male Parent</span>
                                <IoMale className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              </label>
                            </div>
                            <ParentGenotypeSelect
                              label="Male Parent"
                              value={selectedTrait.parent2Genotype}
                              options={getGenotypeOptions(
                                selectedTrait.alleles
                              ).filter((genotype) => {
                                const traitInfo = traits.find(
                                  (t) => t.key === selectedTrait.key
                                );
                                const phenotype =
                                  traitInfo?.phenotype_map[genotype];
                                return phenotype && phenotype !== "Unknown";
                              })}
                              onChange={(e) =>
                                updateTraitGenotype(
                                  selectedTrait.key,
                                  "parent2",
                                  e.target.value
                                )
                              }
                              phenotypeMap={
                                traits.find((t) => t.key === selectedTrait.key)
                                  ?.phenotype_map || {}
                              }
                            />
                            {selectedTrait.parent2Genotype && (
                              <div className="absolute -bottom-1 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                ✓
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error display */}
              {simulationError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <p className="text-red-800 dark:text-red-300 text-sm">
                    {simulationError}
                  </p>
                </div>
              )}
              {/* SimulationButton moved to header */}
            </div>

            {/* Right Column - Trait Browser */}
            <div className="w-80 p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-slate-800/50 dark:to-slate-900/50 overflow-y-auto">
              <TraitSelector
                searchTerm={searchTerm}
                onSearch={(e) => setSearchTerm(e.target.value)}
                onAddTrait={addTrait}
                filteredTraits={filteredTraits}
                selectedTraits={project.selectedTraits}
              />

              {project.selectedTraits.length >= 5 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
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
                      <p className="text-yellow-800 dark:text-yellow-300 text-xs font-medium">
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

      <SimulationResultsModal
        open={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        simulationResults={project.simulationResults || {}}
        selectedTraits={project.selectedTraits}
        traits={traits}
        onAddToCanvas={handleAddToCanvas}
      />
    </>
  );
};

export default MendelianStudyModal;
