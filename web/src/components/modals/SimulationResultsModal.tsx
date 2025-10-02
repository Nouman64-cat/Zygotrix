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
import GenotypicRatios from "../dashboard/GenotypicRatios";
import PhenotypicRatios from "../dashboard/PhenotypicRatios";
import { getAboGenotypeMap } from "../dashboard/helpers";
import HowTheseResultsButton from "./HowTheseResultsButton";
import PunnettSquareModal from "./PunnettSquareModal";
import { explainSimulationResults } from "../../services/gemini.api";

// Markdown components for styling
const markdownComponents = {
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-2 text-gray-700" {...props}>
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{ fontFamily: "Axiforma, sans-serif" }}
    >
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
              onClick={onAddToCanvas}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
            >
              <DocumentPlusIcon className="h-5 w-5" />
              <span>Add to Canvas</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 cursor-pointer hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
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
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 flex flex-col relative"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <span className="mr-2">🧬</span>
                        {trait?.name || traitKey}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm">
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
                              <div className="flex items-center space-x-2">
                                <GiFemale className="h-4 w-4 text-purple-600" />
                                <span className="text-gray-600">
                                  {parent1} →{" "}
                                  {trait?.phenotype_map[
                                    selectedTrait?.parent1Genotype || ""
                                  ] || "Unknown"}
                                </span>
                              </div>
                              <span className="text-gray-400 text-2xl">×</span>
                              <div className="flex items-center space-x-2">
                                <IoMale className="h-4 w-4 text-indigo-600" />
                                <span className="text-gray-600">
                                  {parent2} →{" "}
                                  {trait?.phenotype_map[
                                    selectedTrait?.parent2Genotype || ""
                                  ] || "Unknown"}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start flex-1">
                      <GenotypicRatios
                        genotypicRatios={result.genotypic_ratios}
                        traitKey={traitKey}
                      />
                      <PhenotypicRatios
                        phenotypicRatios={result.phenotypic_ratios}
                      />
                    </div>
                    <div className="flex justify-end items-center gap-3 mt-4">
                      <button
                        onClick={() =>
                          handleAskAI(traitKey, result, selectedTrait, trait)
                        }
                        disabled={loadingAi[traitKey]}
                        className="bg-white border border-blue-200 text-blue-700 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAi[traitKey] ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <span>Asking AI...</span>
                          </>
                        ) : (
                          <>
                            <HiSparkles className="h-4 w-4" />
                            <span>Ask AI</span>
                          </>
                        )}
                      </button>
                      <HowTheseResultsButton
                        onClick={() => setPunnettModalTraitKey(traitKey)}
                      />
                    </div>

                    {/* AI Explanation Display */}
                    {showAiExplanation[traitKey] && aiExplanation[traitKey] && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <HiSparkles className="h-5 w-5 text-blue-600" />
                            <h5 className="font-semibold text-gray-900">
                              AI Explanation
                            </h5>
                          </div>
                          <button
                            onClick={() => handleCloseAIExplanation(traitKey)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-sm leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {aiExplanation[traitKey]}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* AI Error Display */}
                    {showAiExplanation[traitKey] && aiError[traitKey] && (
                      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <h5 className="font-semibold text-red-900">
                              AI Error
                            </h5>
                          </div>
                          <button
                            onClick={() => handleCloseAIExplanation(traitKey)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-white rounded-full transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-red-700">
                          {aiError[traitKey]}
                        </p>
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
