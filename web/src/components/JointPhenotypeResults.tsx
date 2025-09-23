import React from "react";

interface JointPhenotypeResultsProps {
  results: Record<string, number>;
  isLoading?: boolean;
  asPercentages?: boolean;
  className?: string;
}

const JointPhenotypeResults: React.FC<JointPhenotypeResultsProps> = ({
  results,
  isLoading = false,
  asPercentages = true,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
      >
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              Joint Phenotype Analysis
            </h3>
            <p className="text-sm text-slate-600">
              Calculating combined trait probabilities...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!results || Object.keys(results).length === 0) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Joint Phenotype Analysis
          </h3>
          <p className="text-sm text-slate-600 mt-2">
            No results available. Please select traits and parent genotypes to
            see joint phenotype probabilities.
          </p>
        </div>
      </div>
    );
  }

  // Sort results by probability (highest first)
  const sortedResults = Object.entries(results).sort(([, a], [, b]) => b - a);
  const maxProbability = Math.max(...Object.values(results));

  const getPhenotypeBadgeColor = (phenotype: string) => {
    const normalized = phenotype.toLowerCase();

    // Check for combinations
    if (normalized.includes("brown") && normalized.includes("curly"))
      return "bg-amber-100 text-amber-800 border-amber-200";
    if (normalized.includes("brown") && normalized.includes("straight"))
      return "bg-orange-100 text-orange-800 border-orange-200";
    if (normalized.includes("blue") && normalized.includes("curly"))
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    if (normalized.includes("blue") && normalized.includes("straight"))
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (normalized.includes("green") && normalized.includes("curly"))
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (normalized.includes("green") && normalized.includes("straight"))
      return "bg-green-100 text-green-800 border-green-200";

    // Fallback for single traits or other combinations
    if (normalized.includes("brown"))
      return "bg-amber-100 text-amber-800 border-amber-200";
    if (normalized.includes("blue"))
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (normalized.includes("green"))
      return "bg-green-100 text-green-800 border-green-200";
    if (normalized.includes("red"))
      return "bg-red-100 text-red-800 border-red-200";
    if (normalized.includes("curly"))
      return "bg-purple-100 text-purple-800 border-purple-200";
    if (normalized.includes("straight"))
      return "bg-gray-100 text-gray-800 border-gray-200";

    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Joint Phenotype Analysis
          </h3>
          <p className="text-sm text-slate-600">
            Combined trait probabilities using independent assortment
          </p>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">
            Expected Offspring Distribution:
          </h4>
          <div className="space-y-3">
            {sortedResults.map(([phenotype, probability]) => {
              const percentage = asPercentages
                ? probability
                : probability * 100;
              const barWidth =
                (percentage /
                  (asPercentages ? maxProbability : maxProbability * 100)) *
                100;

              return (
                <div
                  key={phenotype}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getPhenotypeBadgeColor(
                        phenotype
                      )}`}
                    >
                      {phenotype}
                    </span>
                    <div className="flex-1 bg-white rounded-full h-3 overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-medium text-slate-800">
                      {percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-800">
            Most Likely Combination: {sortedResults[0]?.[0] || "N/A"}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Based on {Object.keys(results).length} possible phenotype
            combinations
          </p>
        </div>

        {/* Legend */}
        <div className="text-xs text-slate-500 text-center border-t border-slate-100 pt-4">
          <p>
            <strong>Joint Phenotype Analysis:</strong> Shows combined trait
            probabilities assuming independent assortment (Mendel's Second Law)
          </p>
        </div>
      </div>
    </div>
  );
};

export default JointPhenotypeResults;
