import React, { useState } from "react";
import { simulateMultipleMendelianTraits } from "../../services/mendelian.api";
import { sanitizeDiploidGenotype } from "../../utils/genetics";
import type { SimulationButtonProps } from "./types";

const SimulationButton: React.FC<SimulationButtonProps> = ({
  project,
  setProject,
  // traits,
  setSimulationError,
  setShowResultsModal,
  disabled,
}) => {
  const [loading, setLoading] = useState(false);

  const handleSimulation = async () => {
    setSimulationError(null);
    setLoading(true);
    try {
      // Prepare genotype maps
      const parent1Genotypes: Record<string, string> = {};
      const parent2Genotypes: Record<string, string> = {};
      const traitKeys: string[] = [];
      project.selectedTraits.forEach((trait) => {
        // Sanitize using allele list for multi-character alleles
        parent1Genotypes[trait.key] = sanitizeDiploidGenotype(
          trait.parent1Genotype,
          trait.alleles
        );
        parent2Genotypes[trait.key] = sanitizeDiploidGenotype(
          trait.parent2Genotype,
          trait.alleles
        );
        traitKeys.push(trait.key);
      });

      if (traitKeys.length === 0) {
        setSimulationError("Please select at least one trait to simulate.");
        setLoading(false);
        return;
      }

      // Debug: Log outgoing genotypes
      console.log("Simulate: parent1Genotypes", parent1Genotypes);
      console.log("Simulate: parent2Genotypes", parent2Genotypes);

      const response = await simulateMultipleMendelianTraits(
        parent1Genotypes,
        parent2Genotypes,
        traitKeys,
        project.asPercentages
      );

      setProject((prev) => ({
        ...prev,
        simulationResults: response.results,
      }));
      setShowResultsModal(true);
    } catch (err: any) {
      setSimulationError(
        err?.response?.data?.message || err?.message || "Simulation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSimulation}
      disabled={disabled || loading}
      className="bg-gradient-to-r from-green-500 cursor-pointer to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Running...</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v18l15-9-15-9z"
            />
          </svg>
          <span>Run Simulation</span>
        </>
      )}
    </button>
  );
};

export default SimulationButton;
