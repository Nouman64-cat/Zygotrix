import React, { useState, useCallback } from "react";
import { useTraits } from "../hooks/useTraits";
import { simulateMendelianTrait } from "../services/zygotrixApi";

interface MendelianWorkspaceToolProps {
  onAddToCanvas: (item: any) => void;
}

interface MendelianProject {
  id: string;
  name: string;
  selectedTrait: string;
  parent1Genotype: string;
  parent2Genotype: string;
  simulationResults: Record<string, number> | null;
  asPercentages: boolean;
  notes: string;
}

const MendelianWorkspaceTool: React.FC<MendelianWorkspaceToolProps> = ({
  onAddToCanvas,
}) => {
  const { traits, loading, error } = useTraits();
  const [project, setProject] = useState<MendelianProject>({
    id: `mendelian-${Date.now()}`,
    name: "New Mendelian Study",
    selectedTrait: "",
    parent1Genotype: "",
    parent2Genotype: "",
    simulationResults: null,
    asPercentages: true,
    notes: "",
  });
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const selectedTraitInfo = traits.find(
    (trait) => trait.key === project.selectedTrait
  );

  const handleTraitChange = useCallback(
    (traitKey: string) => {
      const trait = traits.find((t) => t.key === traitKey);
      if (trait) {
        // Set default genotypes based on trait alleles
        const alleles = trait.alleles;
        setProject((prev) => ({
          ...prev,
          selectedTrait: traitKey,
          parent1Genotype:
            alleles.length >= 2 ? `${alleles[0]}${alleles[1]}` : "",
          parent2Genotype:
            alleles.length >= 2 ? `${alleles[0]}${alleles[1]}` : "",
          simulationResults: null,
        }));
      }
    },
    [traits]
  );

  const handleSimulation = useCallback(async () => {
    if (
      !project.selectedTrait ||
      !project.parent1Genotype ||
      !project.parent2Genotype
    ) {
      setSimulationError(
        "Please select a trait and enter genotypes for both parents"
      );
      return;
    }

    setSimulationLoading(true);
    setSimulationError(null);

    try {
      const response = await simulateMendelianTrait(
        project.selectedTrait,
        project.parent1Genotype,
        project.parent2Genotype,
        project.asPercentages
      );

      const results = response.results[project.selectedTrait];
      setProject((prev) => ({
        ...prev,
        simulationResults: results || null,
      }));
    } catch (err) {
      setSimulationError(
        err instanceof Error ? err.message : "Simulation failed"
      );
    } finally {
      setSimulationLoading(false);
    }
  }, [
    project.selectedTrait,
    project.parent1Genotype,
    project.parent2Genotype,
    project.asPercentages,
  ]);

  const handleAddToCanvas = useCallback(() => {
    const canvasItem = {
      type: "mendelian-study",
      data: { ...project },
      title: project.name,
      subtitle: selectedTraitInfo?.name || "Mendelian Inheritance Study",
    };
    onAddToCanvas(canvasItem);
  }, [project, selectedTraitInfo, onAddToCanvas]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-red-600 text-sm">
          Error loading traits: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Mendelian Genetics Study
          </h3>
          <p className="text-sm text-slate-600">
            Create and simulate single-gene inheritance patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            {traits.length} traits available
          </span>
        </div>
      </div>

      {/* Project Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Study Name
        </label>
        <input
          type="text"
          value={project.name}
          onChange={(e) =>
            setProject((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter study name..."
        />
      </div>

      {/* Trait Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Select Trait
        </label>
        <select
          value={project.selectedTrait}
          onChange={(e) => handleTraitChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a trait...</option>
          {traits.map((trait) => (
            <option key={trait.key} value={trait.key}>
              {trait.name} {trait.verification_status === "verified" ? "✓" : ""}
            </option>
          ))}
        </select>
        {selectedTraitInfo && (
          <div className="mt-2 p-3 bg-slate-50 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-slate-700">
                {selectedTraitInfo.name}
              </span>
              {selectedTraitInfo.verification_status && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    selectedTraitInfo.verification_status === "verified"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {selectedTraitInfo.verification_status}
                </span>
              )}
              {selectedTraitInfo.inheritance_pattern && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {selectedTraitInfo.inheritance_pattern.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {selectedTraitInfo.description}
            </p>
            <div className="mt-2 flex gap-2">
              <span className="text-xs text-slate-500">Alleles:</span>
              {selectedTraitInfo.alleles.map((allele) => (
                <span
                  key={allele}
                  className="text-xs bg-slate-200 px-2 py-1 rounded font-mono"
                >
                  {allele}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Parent Genotypes */}
      {selectedTraitInfo && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Parent A Genotype
            </label>
            <input
              type="text"
              value={project.parent1Genotype}
              onChange={(e) =>
                setProject((prev) => ({
                  ...prev,
                  parent1Genotype: e.target.value.slice(0, 2),
                }))
              }
              maxLength={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center"
              placeholder="e.g. Aa"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Parent B Genotype
            </label>
            <input
              type="text"
              value={project.parent2Genotype}
              onChange={(e) =>
                setProject((prev) => ({
                  ...prev,
                  parent2Genotype: e.target.value.slice(0, 2),
                }))
              }
              maxLength={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center"
              placeholder="e.g. aa"
            />
          </div>
        </div>
      )}

      {/* Output Format */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Output Format
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={project.asPercentages}
              onChange={() =>
                setProject((prev) => ({ ...prev, asPercentages: true }))
              }
              className="mr-2"
            />
            <span className="text-sm text-slate-600">Percentages</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={!project.asPercentages}
              onChange={() =>
                setProject((prev) => ({ ...prev, asPercentages: false }))
              }
              className="mr-2"
            />
            <span className="text-sm text-slate-600">Probabilities</span>
          </label>
        </div>
      </div>

      {/* Simulation Button */}
      <div className="space-y-4">
        <button
          onClick={handleSimulation}
          disabled={
            !selectedTraitInfo ||
            !project.parent1Genotype ||
            !project.parent2Genotype ||
            simulationLoading
          }
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {simulationLoading ? "Running Simulation..." : "Run Simulation"}
        </button>

        {simulationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{simulationError}</p>
          </div>
        )}

        {project.simulationResults && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">
              Simulation Results:
            </h4>
            <div className="space-y-1">
              {Object.entries(project.simulationResults)
                .sort(([, a], [, b]) => b - a)
                .map(([phenotype, probability]) => (
                  <div
                    key={phenotype}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm"
                  >
                    <span className="font-medium text-slate-700">
                      {phenotype}
                    </span>
                    <span className="text-slate-600 font-mono">
                      {project.asPercentages
                        ? `${probability.toFixed(1)}%`
                        : probability.toFixed(3)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Study Notes
        </label>
        <textarea
          value={project.notes}
          onChange={(e) =>
            setProject((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add notes about your study..."
        />
      </div>

      {/* Add to Canvas */}
      <button
        onClick={handleAddToCanvas}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
      >
        Add to Canvas
      </button>
    </div>
  );
};

export default MendelianWorkspaceTool;
