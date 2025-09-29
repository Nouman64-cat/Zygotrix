import React from "react";
import { getAboGenotypeMap, getAboGenotypeOrder } from "./helpers";

interface SimulationResultsProps {
  results: any;
  selectedTrait: string;
  asPercentages: boolean;
}

const SimulationResults: React.FC<SimulationResultsProps> = ({
  results,
  selectedTrait,
  asPercentages,
}) => {
  if (!results) return null;
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-slate-700">
        Simulation Results:
      </h4>
      <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 space-y-2">
        <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          Genotypic Ratios
        </h5>
        {selectedTrait === "abo_blood_group" ? (
          <div className="grid grid-cols-3 gap-2 bg-blue-50/30 rounded-lg p-3 border border-blue-100 mb-4">
            {getAboGenotypeOrder().map((backendGenotype) => {
              const genotypeMap = getAboGenotypeMap();
              return (
                <div
                  key={backendGenotype}
                  className="flex flex-col items-center justify-center p-2"
                >
                  <span
                    style={{
                      fontSize: "1.25em",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    {genotypeMap[backendGenotype]}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 mt-1">
                    {results?.genotypic_ratios?.[backendGenotype]?.toFixed(1) ||
                      "0.0"}
                    %
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          Object.entries(results.genotypic_ratios || {}).map(
            ([genotype, percentage]: [string, any]) => {
              if (typeof percentage !== "number" || Number.isNaN(percentage)) {
                return null;
              }
              return (
                <div
                  key={genotype}
                  className="flex items-center justify-between text-xs text-blue-800"
                >
                  <span className="font-medium">{genotype}</span>
                  <span className="font-mono">
                    {asPercentages
                      ? `${percentage.toFixed(1)}%`
                      : percentage.toFixed(3)}
                  </span>
                </div>
              );
            }
          )
        )}
      </div>
      <div className="rounded-lg border border-green-100 bg-green-50/40 p-3 space-y-2">
        <h5 className="text-xs font-semibold text-green-700 uppercase tracking-wide">
          Phenotypic Ratios
        </h5>
        {Object.entries(results.phenotypic_ratios || {}).map(
          ([phenotype, percentage]: [string, any]) => {
            if (typeof percentage !== "number" || Number.isNaN(percentage)) {
              return null;
            }
            return (
              <div
                key={phenotype}
                className="flex items-center justify-between text-xs text-green-800"
              >
                <span className="font-medium">{phenotype}</span>
                <span className="font-mono">
                  {asPercentages
                    ? `${percentage.toFixed(1)}%`
                    : percentage.toFixed(3)}
                </span>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export default SimulationResults;
