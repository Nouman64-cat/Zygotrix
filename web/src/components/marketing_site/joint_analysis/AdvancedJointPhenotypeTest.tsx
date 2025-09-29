import React, { useState, useEffect } from "react";
import {
  fetchTraits,
  simulateJointPhenotypes,
} from "../../../services/zygotrixApi";
import JointPhenotypeResults from "./JointPhenotypeResults";
import type { TraitInfo } from "../../../types/api";

interface AdvancedJointPhenotypeTestProps {
  className?: string;
}

const AdvancedJointPhenotypeTest: React.FC<AdvancedJointPhenotypeTestProps> = ({
  className = "",
}) => {
  const [traits, setTraits] = useState<TraitInfo[]>([]);
  const [traitsLoading, setTraitsLoading] = useState(true);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [parent1Genotypes, setParent1Genotypes] = useState<
    Record<string, string>
  >({});
  const [parent2Genotypes, setParent2Genotypes] = useState<
    Record<string, string>
  >({});
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load traits on component mount
  useEffect(() => {
    const loadTraits = async () => {
      try {
        const fetchedTraits = await fetchTraits();
        setTraits(fetchedTraits);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load traits");
      } finally {
        setTraitsLoading(false);
      }
    };

    loadTraits();
  }, []);

  // Generate possible genotypes for a trait
  const getGenotypeOptions = (alleles: string[]) => {
    const genotypes = [];
    for (let i = 0; i < alleles.length; i++) {
      for (let j = i; j < alleles.length; j++) {
        const genotype = alleles[i] + alleles[j];
        genotypes.push(genotype);
      }
    }
    return genotypes;
  };

  const handleTraitToggle = (traitKey: string) => {
    setSelectedTraits((prev) => {
      if (prev.includes(traitKey)) {
        // Remove trait
        const newSelected = prev.filter((k) => k !== traitKey);
        const newParent1 = { ...parent1Genotypes };
        const newParent2 = { ...parent2Genotypes };
        delete newParent1[traitKey];
        delete newParent2[traitKey];
        setParent1Genotypes(newParent1);
        setParent2Genotypes(newParent2);
        return newSelected;
      } else {
        // Add trait (max 5)
        if (prev.length >= 5) {
          setError("Maximum 5 traits allowed for joint analysis");
          return prev;
        }
        return [...prev, traitKey];
      }
    });
  };

  const handleParent1GenotypeChange = (traitKey: string, genotype: string) => {
    setParent1Genotypes((prev) => ({
      ...prev,
      [traitKey]: genotype,
    }));
  };

  const handleParent2GenotypeChange = (traitKey: string, genotype: string) => {
    setParent2Genotypes((prev) => ({
      ...prev,
      [traitKey]: genotype,
    }));
  };

  const canSimulate =
    selectedTraits.length >= 2 &&
    selectedTraits.every(
      (key) => parent1Genotypes[key] && parent2Genotypes[key]
    );

  const runSimulation = async () => {
    if (!canSimulate) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await simulateJointPhenotypes(
        parent1Genotypes,
        parent2Genotypes,
        selectedTraits,
        true // as percentages
      );

      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const runExampleTest = async () => {
    setSelectedTraits(["eye_color", "hair_texture"]);
    setParent1Genotypes({ eye_color: "Bb", hair_texture: "Cc" });
    setParent2Genotypes({ eye_color: "Bb", hair_texture: "Cc" });

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await simulateJointPhenotypes(
        { eye_color: "Bb", hair_texture: "Cc" },
        { eye_color: "Bb", hair_texture: "Cc" },
        ["eye_color", "hair_texture"],
        true
      );

      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (traitsLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading traits...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Custom Joint Phenotype Analysis
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Select 2-5 traits and configure parent genotypes for joint
                analysis
              </p>
            </div>
            <button
              onClick={runExampleTest}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs"
            >
              Load Example
            </button>
          </div>

          {/* Trait Selection */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Select Traits ({selectedTraits.length}/5)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {traits.slice(0, 10).map((trait) => (
                <label
                  key={trait.key}
                  className={`flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${
                    selectedTraits.includes(trait.key)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTraits.includes(trait.key)}
                    onChange={() => handleTraitToggle(trait.key)}
                    className="mr-2"
                  />
                  <div>
                    <div className="font-medium text-xs">{trait.name}</div>
                    <div className="text-xs text-gray-500">
                      Alleles: {trait.alleles.join(", ")}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Genotype Configuration */}
          {selectedTraits.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Configure Parent Genotypes
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Parent 1 */}
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2">
                    Female Parent
                  </h5>
                  <div className="space-y-2">
                    {selectedTraits.map((traitKey) => {
                      const trait = traits.find((t) => t.key === traitKey);
                      if (!trait) return null;

                      return (
                        <div key={traitKey}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {trait.name}
                          </label>
                          <select
                            value={parent1Genotypes[traitKey] || ""}
                            onChange={(e) =>
                              handleParent1GenotypeChange(
                                traitKey,
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                          >
                            <option value="">Select genotype</option>
                            {getGenotypeOptions(trait.alleles)
                              .filter((genotype) => {
                                const phenotype = trait.phenotype_map[genotype];
                                return phenotype && phenotype !== "Unknown";
                              })
                              .map((genotype) => {
                                const phenotype =
                                  trait.phenotype_map[genotype] || "Unknown";
                                return (
                                  <option key={genotype} value={genotype}>
                                    {genotype} → {phenotype}
                                  </option>
                                );
                              })}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Parent 2 */}
                <div>
                  <h5 className="text-sm font-medium text-blue-700 mb-2">
                    Male Parent
                  </h5>
                  <div className="space-y-2">
                    {selectedTraits.map((traitKey) => {
                      const trait = traits.find((t) => t.key === traitKey);
                      if (!trait) return null;

                      return (
                        <div key={traitKey}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {trait.name}
                          </label>
                          <select
                            value={parent2Genotypes[traitKey] || ""}
                            onChange={(e) =>
                              handleParent2GenotypeChange(
                                traitKey,
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                          >
                            <option value="">Select genotype</option>
                            {getGenotypeOptions(trait.alleles)
                              .filter((genotype) => {
                                const phenotype = trait.phenotype_map[genotype];
                                return phenotype && phenotype !== "Unknown";
                              })
                              .map((genotype) => {
                                const phenotype =
                                  trait.phenotype_map[genotype] || "Unknown";
                                return (
                                  <option key={genotype} value={genotype}>
                                    {genotype} → {phenotype}
                                  </option>
                                );
                              })}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Run Simulation Button */}
          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={runSimulation}
              disabled={!canSimulate || isLoading}
              className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                canSimulate && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading
                ? "Running Analysis..."
                : "Run Joint Phenotype Analysis"}
            </button>
            {!canSimulate && selectedTraits.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                Select at least 2 traits and configure all parent genotypes
              </p>
            )}
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <JointPhenotypeResults
        results={results || {}}
        isLoading={isLoading}
        asPercentages={true}
      />
    </div>
  );
};

export default AdvancedJointPhenotypeTest;
