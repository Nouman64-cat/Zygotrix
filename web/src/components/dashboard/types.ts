// For single-trait Mendelian workspace tool
export interface SingleTraitMendelianProject {
  id: string;
  name: string;
  selectedTrait: string;
  parent1Genotype: string;
  parent2Genotype: string;
  simulationResults: MendelianSimulationTraitResult | null;
  asPercentages: boolean;
  notes: string;
}
import type {
  MendelianSimulationTraitResult,
  TraitInfo,
} from "../../types/api";

export interface MendelianWorkspaceToolProps {
  onAddToCanvas: (item: any) => void;
}

export interface SelectedTrait {
  key: string;
  name: string;
  parent1Genotype: string;
  parent2Genotype: string;
  alleles: string[];
}

export interface MendelianProject {
  id: string;
  name: string;
  selectedTraits: SelectedTrait[];
  simulationResults: Record<string, MendelianSimulationTraitResult> | null;
  asPercentages: boolean;
  notes: string;
}

export interface SimulationButtonProps {
  project: MendelianProject;
  setProject: React.Dispatch<React.SetStateAction<MendelianProject>>;
  traits: TraitInfo[];
  setSimulationError: React.Dispatch<React.SetStateAction<string | null>>;
  setShowResultsModal: React.Dispatch<React.SetStateAction<boolean>>;
  disabled: boolean;
}
