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
import type { WorkspaceItem } from "../workspace/types";

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

export interface MendelianStudyModalProps {
  onClose: () => void;
  onAddToCanvas: (item: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

export interface SelectedTraitHeaderProps {
  selectedTrait: {
    key: string;
    name: string;
    alleles: string[];
  };
  traits: TraitInfo[];
  onRemove: (traitKey: string) => void;
}

export interface MendelianStudyComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  editingItemNameId: string | null;
  editingItemName: string;
  setEditingItemName: (name: string) => void;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
  onNameClick: (e: React.MouseEvent, item: WorkspaceItem) => void;
  onNameSave: (itemId: string, name: string) => void;
  onNameCancel: () => void;
  onEditItem: (e: React.MouseEvent, item: WorkspaceItem) => void;
  onDeleteItem: (e: React.MouseEvent, itemId: string) => void;
}
