export type TraitInfo = {
  key: string;
  name: string;
  description?: string;
  alleles: string[];
  phenotype_map: Record<string, string>;
  metadata?: Record<string, string>;
};

export type TraitListResponse = {
  traits: TraitInfo[];
};

export type TraitMutationPayload = {
  key: string;
  name: string;
  alleles: string[];
  phenotype_map: Record<string, string>;
  description?: string;
  metadata?: Record<string, string>;
};

export type TraitMutationResponse = {
  trait: TraitInfo;
};

export type MendelianSimulationResponse = {
  results: Record<string, Record<string, number>>;
  missing_traits: string[];
};

export type PolygenicScoreResponse = {
  expected_score: number;
};
