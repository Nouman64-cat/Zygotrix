import React, { useState } from "react";
import { simulateJointPhenotypes } from "../../../services/zygotrixApi";
import JointPhenotypeResults from "./JointPhenotypeResults";

interface JointPhenotypeTestProps {
  className?: string;
}

const JointPhenotypeTest: React.FC<JointPhenotypeTestProps> = ({
  className = "",
}) => {
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runExampleTest = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Example: Eye color (Bb × Bb) and Hair texture (Cc × Cc)
      const response = await simulateJointPhenotypes(
        { eye_color: "Bb", hair_texture: "Cc" },
        { eye_color: "Bb", hair_texture: "Cc" },
        undefined, // include all traits
        true // as percentages
      );

      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Joint Phenotype Simulation Test
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Test the joint phenotype calculation with example traits
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Example Cross:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">
                  <strong>Female Parent:</strong> Eye color (Bb), Hair texture
                  (Cc)
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  <strong>Male Parent:</strong> Eye color (Bb), Hair texture
                  (Cc)
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              <p>
                Expected results: Brown+Curly (56.25%), Brown+Straight (18.75%),
                Blue+Curly (18.75%), Blue+Straight (6.25%)
              </p>
            </div>
          </div>

          <button
            onClick={runExampleTest}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Running Test..." : "Run Joint Phenotype Test"}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
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

export default JointPhenotypeTest;
