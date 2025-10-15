import API from "./api";

export type ChromosomeType = "autosomal" | "x" | "y";
export type DominancePattern = "complete" | "codominant" | "incomplete";
export type EpistasisRequirement = "present" | "homozygous" | "heterozygous" | "hemizygous";
export type EpistasisAction = "mask" | "modify";

export interface AlleleEffectPayload {
  trait_id: string;
  magnitude: number;
  description?: string;
  intermediate_descriptor?: string;
}

export interface AlleleDefinitionPayload {
  id: string;
  dominance_rank: number;
  effects: AlleleEffectPayload[];
}

export interface GeneDefinitionPayload {
  id: string;
  chromosome: ChromosomeType;
  dominance: DominancePattern;
  default_allele_id: string;
  alleles: AlleleDefinitionPayload[];
  linkage_group?: number;
  recombination_probability?: number;
  incomplete_blend_weight?: number;
}

export interface EpistasisRulePayload {
  regulator_gene: string;
  triggering_allele: string;
  requirement?: EpistasisRequirement;
  action?: EpistasisAction;
  target_trait: string;
  modifier?: number;
  override_description?: string;
  override_value?: number;
}

export interface GeneticCrossRequestPayload {
  genes: GeneDefinitionPayload[];
  epistasis?: EpistasisRulePayload[];
  mother: {
    sex?: "male" | "female";
    genotype: Record<string, string[]>;
  };
  father: {
    sex?: "male" | "female";
    genotype: Record<string, string[]>;
  };
  simulations?: number;
}

export interface TraitSummaryPayload {
  mean_quantitative: number;
  descriptor_counts: Record<string, number>;
}

export interface GeneticCrossResponsePayload {
  simulations: number;
  sex_counts: Record<string, number>;
  trait_summaries: Record<string, TraitSummaryPayload>;
}

export async function computeGeneticCross(
  payload: GeneticCrossRequestPayload
): Promise<GeneticCrossResponsePayload> {
  const response = await API.post<GeneticCrossResponsePayload>("/api/cpp/cross", payload);
  return response.data;
}
