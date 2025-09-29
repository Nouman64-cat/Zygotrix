import GenotypeStatus from "./GenotypeStatus";
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
    return [...new Set(options)].sort((a, b) => a.localeCompare(b));
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-100">
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
              <button
                onClick={onClose}
                className="p-2 text-gray-400 cursor-pointer hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            }
          />

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column - Study Details */}
            <div className="w-80 p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-r border-gray-200 overflow-y-auto">
              <LabeledInput
                label="📊 Study Name"
                value={project.name}
                onChange={(e) =>
                  setProject((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter study name..."
                className="mb-6"
              />
              <LabeledTextarea
                label="📝 Notes (Optional)"
                value={project.notes}
                onChange={(e) =>
                  setProject((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any notes about this study..."
                className="mb-4"
              />
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
                <EmptyState message="Start Your Genetic Study" />
              ) : (
                <div className="space-y-5">
                  {project.selectedTraits.map((selectedTrait) => (
                    <div
                      key={selectedTrait.key}
                      className="bg-white/90 backdrop-blur-sm border border-purple-200/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300/80"
                    >
                      {/* Trait Header */}
                      <SelectedTraitHeader
                        selectedTrait={selectedTrait}
                        traits={traits}
                        onRemove={removeTrait}
                      />

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
                            />
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
                            />
                            {selectedTrait.parent2Genotype && (
                              <div className="absolute -bottom-1 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                ✓
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Genotype Status */}
                        <GenotypeStatus
                          parent1Genotype={selectedTrait.parent1Genotype}
                          parent2Genotype={selectedTrait.parent2Genotype}
                        />
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
              <div className="mt-8 flex justify-end">
                <SimulationButton
                  project={project}
                  setProject={setProject}
                  traits={traits}
                  setSimulationError={setSimulationError}
                  setShowResultsModal={setShowResultsModal}
                  disabled={project.selectedTraits.length === 0}
                />
              </div>
            </div>

            {/* Right Column - Trait Browser */}
            <div className="w-80 p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/50 overflow-y-auto">
              <TraitSelector
                searchTerm={searchTerm}
                onSearch={(e) => setSearchTerm(e.target.value)}
                availableCount={availableCount}
                onAddTrait={addTrait}
                filteredTraits={filteredTraits}
                selectedTraits={project.selectedTraits}
              />

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
