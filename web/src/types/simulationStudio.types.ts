import type {
  AlleleDefinitionPayload,
  AlleleEffectPayload,
  ChromosomeType,
  DominancePattern,
} from "../services/cppEngine.api";

export type NumericField = number | "";

export type ParentGenotypeState = Record<string, string[]>;

export interface AlleleEffectForm extends AlleleEffectPayload {
  id: string;
  intermediate_descriptor?: string;
}

export interface AlleleForm extends Omit<AlleleDefinitionPayload, "effects"> {
  id: string;
  dominance_rank: number;
  effects: AlleleEffectForm[];
}

export interface GeneForm {
  uid: string;
  id: string;
  displayName: string;
  traitKey?: string;
  chromosome: ChromosomeType;
  dominance: DominancePattern;
  defaultAlleleId: string;
  alleles: AlleleForm[];
  linkageGroup: NumericField;
  recombinationProbability: NumericField;
  incompleteBlendWeight: NumericField;
}
