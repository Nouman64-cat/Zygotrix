import type { MendelianSimulationTraitResult } from "../../types/api";

export interface MendelianWorkspaceToolProps {
  onAddToCanvas: (item: any) => void;
}

export interface MendelianProject {
  id: string;
  name: string;
  selectedTrait: string;
  parent1Genotype: string;
  parent2Genotype: string;
  simulationResults: MendelianSimulationTraitResult | null;
  asPercentages: boolean;
  notes: string;
}
