import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BeakerIcon,
  DocumentPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { GiFemale } from "react-icons/gi";
import { IoMale } from "react-icons/io5";
import { HiSparkles } from "react-icons/hi2";
import { MdHelpOutline } from "react-icons/md";
import GenotypicRatios from "../dashboard/GenotypicRatios";
import PhenotypicRatios from "../dashboard/PhenotypicRatios";
import { getAboGenotypeMap } from "../dashboard/helpers";
import HowTheseResultsButton from "./HowTheseResultsButton";
import PunnettSquareModal from "./PunnettSquareModal";
import { explainSimulationResults } from "../../services/gemini.api";

// Markdown components for styling
const markdownComponents = {
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-1 text-gray-700 text-xs leading-relaxed" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-gray-900" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-gray-700" {...props}>
      {children}
    </em>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside mb-1 space-y-0.5" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-xs text-gray-700" {...props}>
      {children}
    </li>
  ),
};

interface SimulationResultsModalProps {
  open: boolean;
  onClose: () => void;
  onAddToCanvas: () => void;
  simulationResults: Record<string, any>;
  traits: any[];
  selectedTraits: any[];
}

const SimulationResultsModal: React.FC<SimulationResultsModalProps> = ({
  open,
  onClose,
  onAddToCanvas,
  simulationResults,
  traits,
  selectedTraits,
}) => {
  const [punnettModalTraitKey, setPunnettModalTraitKey] = useState<
    string | null
  >(null);
  const [aiExplanation, setAiExplanation] = useState<Record<string, string>>(
    {}
  );
  const [aiExplanationCache, setAiExplanationCache] = useState<
    Record<string, string>
  >({});
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
  const [aiError, setAiError] = useState<Record<string, string>>({});
  const [showAiExplanation, setShowAiExplanation] = useState<
    Record<string, boolean>
  >({});

  // Create a unique cache key for memoization
  const createCacheKey = (
    traitKey: string,
    selectedTrait: any,
    result: any
  ) => {
    const parent1 = selectedTrait?.parent1Genotype || "";
    const parent2 = selectedTrait?.parent2Genotype || "";
    const genotypicRatios = JSON.stringify(result.genotypic_ratios);
    const phenotypicRatios = JSON.stringify(result.phenotypic_ratios);
    return `${traitKey}-${parent1}-${parent2}-${genotypicRatios}-${phenotypicRatios}`;
  };

  const handleAskAI = async (
    traitKey: string,
    result: any,
    selectedTrait: any,
    trait: any
  ) => {
    const cacheKey = createCacheKey(traitKey, selectedTrait, result);

    // Check if we already have this explanation cached
    if (aiExplanationCache[cacheKey]) {
      setAiExplanation((prev) => ({
        ...prev,
        [traitKey]: aiExplanationCache[cacheKey],
      }));
      setShowAiExplanation((prev) => ({ ...prev, [traitKey]: true }));
      return;
    }

    setLoadingAi((prev) => ({ ...prev, [traitKey]: true }));
    setAiError((prev) => ({ ...prev, [traitKey]: "" }));

    try {
      const explanation = await explainSimulationResults(
        trait?.name || traitKey,
        selectedTrait?.parent1Genotype || "",
        selectedTrait?.parent2Genotype || "",
        result.genotypic_ratios,
        result.phenotypic_ratios
      );

      // Cache the explanation and show it
      setAiExplanationCache((prev) => ({ ...prev, [cacheKey]: explanation }));
      setAiExplanation((prev) => ({ ...prev, [traitKey]: explanation }));
      setShowAiExplanation((prev) => ({ ...prev, [traitKey]: true }));
    } catch (error) {
      setAiError((prev) => ({
        ...prev,
        [traitKey]:
          error instanceof Error
            ? error.message
            : "Failed to get AI explanation",
      }));
      setShowAiExplanation((prev) => ({ ...prev, [traitKey]: true }));
    } finally {
      setLoadingAi((prev) => ({ ...prev, [traitKey]: false }));
    }
  };

  const handleCloseAIExplanation = (traitKey: string) => {
    setShowAiExplanation((prev) => ({ ...prev, [traitKey]: false }));
    setAiError((prev) => {
      const newState = { ...prev };
      delete newState[traitKey];
      return newState;
    });
  };

  if (!open || !simulationResults) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ fontFamily: "Axiforma, sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in duration-300">
        {/* Compact Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <BeakerIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 id="modal-title" className="text-lg font-bold">
                  Simulation Results
                </h2>
                <p className="text-sm text-white/80">
                  Genetic cross predictions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onAddToCanvas}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 border border-white/20 cursor-pointer"
                aria-label="Add results to canvas"
              >
                <DocumentPlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Canvas</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 cursor-pointer"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {Object.entries(simulationResults).map(
              ([traitKey, result]: [string, any]) => {
                const trait = traits.find((t) => t.key === traitKey);
                const selectedTrait = selectedTraits.find(
                  (t: any) => t.key === traitKey
                );

                if (
                  !result ||
                  typeof result !== "object" ||
                  !result.genotypic_ratios ||
                  !result.phenotypic_ratios
                ) {
                  return (
                    <div
                      key={traitKey}
                      className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-200/50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">⚠️</span>
                        <h4 className="text-base font-semibold text-gray-900">
                          {trait?.name || traitKey}
                        </h4>
                      </div>
                      <p className="text-sm text-red-600">
                        No simulation data available for this trait.
                      </p>
                    </div>
                  );
                }
                return (
                  <div
                    key={traitKey}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Trait Header - Title | Genetic Cross | Action Buttons */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-t-xl border-b border-gray-200/50">
                      <div className="flex items-center justify-between">
                        {/* Title Section */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {trait?.name?.charAt(0)?.toUpperCase() || "T"}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-gray-900">
                            {trait?.name || traitKey}
                          </h4>
                        </div>

                        {/* Genetic Cross Section */}
                        <div className="flex items-center gap-2 text-xs">
                          {(() => {
                            const isAbo = traitKey === "abo_blood_group";
                            const genotypeMap = getAboGenotypeMap();
                            const parent1 =
                              isAbo && selectedTrait?.parent1Genotype
                                ? genotypeMap[selectedTrait.parent1Genotype] ||
                                  selectedTrait.parent1Genotype
                                : selectedTrait?.parent1Genotype;
                            const parent2 =
                              isAbo && selectedTrait?.parent2Genotype
                                ? genotypeMap[selectedTrait.parent2Genotype] ||
                                  selectedTrait.parent2Genotype
                                : selectedTrait?.parent2Genotype;
                            return (
                              <>
                                <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-md">
                                  <GiFemale className="h-3 w-3 text-purple-600" />
                                  <span className="text-purple-700 font-medium">
                                    {parent1}
                                  </span>
                                </div>
                                <span className="text-gray-400">×</span>
                                <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-md">
                                  <IoMale className="h-3 w-3 text-blue-600" />
                                  <span className="text-blue-700 font-medium">
                                    {parent2}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        {/* Action Buttons Section */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleAskAI(
                                traitKey,
                                result,
                                selectedTrait,
                                trait
                              )
                            }
                            disabled={loadingAi[traitKey]}
                            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white py-1.5 px-2 rounded-sm transition-all duration-200 flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs"
                            aria-label={`Ask AI about ${
                              trait?.name || traitKey
                            } results`}
                          >
                            {loadingAi[traitKey] ? (
                              <>
                                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                                <span>AI...</span>
                              </>
                            ) : (
                              <>
                                <HiSparkles className="h-3 w-3" />
                                <span>Ask AI</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setPunnettModalTraitKey(traitKey)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-1.5 px-2 rounded-sm transition-all duration-200 flex items-center justify-center gap-1 shadow-sm cursor-pointer text-xs"
                            aria-label={`View Punnett square for ${
                              trait?.name || traitKey
                            }`}
                          >
                            <MdHelpOutline className="h-3 w-3" />
                            <span>How?</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Results Grid */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <GenotypicRatios
                          genotypicRatios={result.genotypic_ratios}
                          traitKey={traitKey}
                        />
                        <PhenotypicRatios
                          phenotypicRatios={result.phenotypic_ratios}
                        />
                      </div>
                    </div>

                    {/* AI Explanation Display - Integrated */}
                    {showAiExplanation[traitKey] && aiExplanation[traitKey] && (
                      <div className="mx-4 mb-4 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 rounded-xl border border-violet-200/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white">
                            <HiSparkles className="h-4 w-4" />
                            <h5 className="font-medium text-sm">AI Insights</h5>
                          </div>
                          <button
                            onClick={() => handleCloseAIExplanation(traitKey)}
                            className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                            aria-label="Close AI explanation"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="p-3 text-xs leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {aiExplanation[traitKey]}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* AI Error Display - Integrated */}
                    {showAiExplanation[traitKey] && aiError[traitKey] && (
                      <div className="mx-4 mb-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-orange-600 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white">
                            <span className="text-sm">⚠️</span>
                            <h5 className="font-medium text-sm">Error</h5>
                          </div>
                          <button
                            onClick={() => handleCloseAIExplanation(traitKey)}
                            className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                            aria-label="Close AI error"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-red-700">
                            {aiError[traitKey]}
                          </p>
                        </div>
                      </div>
                    )}
                    {punnettModalTraitKey === traitKey &&
                      selectedTrait &&
                      trait && (
                        <PunnettSquareModal
                          open={true}
                          onClose={() => setPunnettModalTraitKey(null)}
                          parent1Genotype={selectedTrait.parent1Genotype}
                          parent2Genotype={selectedTrait.parent2Genotype}
                          alleles={selectedTrait.alleles}
                          traitName={trait.name}
                        />
                      )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationResultsModal;
