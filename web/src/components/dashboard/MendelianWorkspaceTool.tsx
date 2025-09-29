import React, { useState, useCallback } from "react";
import { useTraits } from "../../hooks/useTraits";
import { simulateMendelianTrait } from "../../services/mendelian.api";
import type { MendelianProject, MendelianWorkspaceToolProps } from "./types";
import { getDefaultGenotype } from "./helpers";
import LabeledInput from "./LabeledInput";
import LabeledTextarea from "./LabeledTextarea";
import LabeledSelect from "./LabeledSelect";
import RadioGroup from "./RadioGroup";
import TraitInfoCard from "./TraitInfoCard";
import SimulationResults from "./SimulationResults";
import LoadingSkeleton from "./LoadingSkeleton";
import ErrorAlert from "./ErrorAlert";

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
        const alleles = trait.alleles;
        setProject((prev) => ({
          ...prev,
          selectedTrait: traitKey,
          parent1Genotype: getDefaultGenotype(alleles),
          parent2Genotype: getDefaultGenotype(alleles),
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
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorAlert message={`Error loading traits: ${error}`} />;
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
      <LabeledInput
        label="Study Name"
        value={project.name}
        onChange={(e) =>
          setProject((prev) => ({ ...prev, name: e.target.value }))
        }
        placeholder="Enter study name..."
      />

      {/* Trait Selection */}
      <LabeledSelect
        label="Select Trait"
        value={project.selectedTrait}
        onChange={(e) => handleTraitChange(e.target.value)}
        options={traits.map((trait) => ({
          value: trait.key,
          label: `${trait.name} ${
            trait.verification_status === "verified" ? "✓" : ""
          }`.trim(),
        }))}
      />
      {selectedTraitInfo && <TraitInfoCard traitInfo={selectedTraitInfo} />}

      {/* Parent Genotypes */}
      {selectedTraitInfo && (
        <div className="grid grid-cols-2 gap-4">
          <LabeledInput
            label="Parent A Genotype"
            value={project.parent1Genotype}
            onChange={(e) =>
              setProject((prev) => ({
                ...prev,
                parent1Genotype: e.target.value.slice(0, 2),
              }))
            }
            maxLength={2}
            placeholder="e.g. Aa"
            className="font-mono text-center"
          />
          <LabeledInput
            label="Parent B Genotype"
            value={project.parent2Genotype}
            onChange={(e) =>
              setProject((prev) => ({
                ...prev,
                parent2Genotype: e.target.value.slice(0, 2),
              }))
            }
            maxLength={2}
            placeholder="e.g. aa"
            className="font-mono text-center"
          />
        </div>
      )}

      {/* Output Format */}
      <RadioGroup
        label="Output Format"
        options={[
          { value: true, label: "Percentages" },
          { value: false, label: "Probabilities" },
        ]}
        value={project.asPercentages}
        onChange={(val) =>
          setProject((prev) => ({ ...prev, asPercentages: val as boolean }))
        }
      />

      {/* Simulation Button & Results */}
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

        {simulationError && <ErrorAlert message={simulationError} />}

        {project.simulationResults && (
          <SimulationResults
            results={project.simulationResults}
            selectedTrait={project.selectedTrait}
            asPercentages={project.asPercentages}
          />
        )}
      </div>

      {/* Notes */}
      <LabeledTextarea
        label="Study Notes"
        value={project.notes}
        onChange={(e) =>
          setProject((prev) => ({ ...prev, notes: e.target.value }))
        }
        placeholder="Add notes about your study..."
      />

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
