import React, { useState } from "react";
import { simulateMultipleMendelianTraits } from "../../services/mendelian.api";
// ...existing code...
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
        parent1Genotypes[trait.key] = trait.parent1Genotype;
        parent2Genotypes[trait.key] = trait.parent2Genotype;
        traitKeys.push(trait.key);
      });

      if (traitKeys.length === 0) {
        setSimulationError("Please select at least one trait to simulate.");
        setLoading(false);
        return;
      }

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
      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Running...</span>
        </>
      ) : (
        <span>Run Simulation</span>
      )}
    </button>
  );
};

export default SimulationButton;
