export type GeneInfo = {
  genes: string[];
  chromosomes: string[];
  locus?: string;
};

export type ValidationRules = {
  passed: boolean;
  errors: string[];
};

export type TraitStatus = "draft" | "active" | "deprecated";
export type TraitVisibility = "private" | "team" | "public";

export type TraitInfo = {
  id?: string;
  key: string;
  name: string;
  alleles: string[];
  phenotype_map: Record<string, string>;
  inheritance_pattern?: string;
  verification_status?: string;
  category?: string;
  gene_info?: GeneInfo;
  allele_freq?: Record<string, number>;
  epistasis_hint?: string;
  education_note?: string;
  references: string[];
  version: string;
  status: TraitStatus;
  owner_id: string;
  visibility: TraitVisibility;
  tags: string[];
  validation_rules: ValidationRules;
  test_case_seed?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  // New fields for updated dataset format
  genes?: string[];
  chromosomes?: string[];
  trait_type?: string; // "monogenic" or "polygenic"

  // Legacy fields for backward compatibility
  description?: string;
  metadata?: Record<string, string>;
  gene?: string;
  chromosome?: number;
};

export type TraitListResponse = {
  traits: TraitInfo[];
};

export type TraitCreatePayload = {
  key: string;
  name: string;
  alleles: string[];
  phenotype_map: Record<string, string>;
  inheritance_pattern?: string;
  verification_status?: string;
  category?: string;
  gene_info?: GeneInfo;
  allele_freq?: Record<string, number>;
  epistasis_hint?: string;
  education_note?: string;
  references?: string[];
  visibility?: TraitVisibility;
  tags?: string[];
  test_case_seed?: string;
  // Legacy fields for backward compatibility
  description?: string;
  metadata?: Record<string, string>;
};

export type TraitUpdatePayload = {
  name?: string;
  alleles?: string[];
  phenotype_map?: Record<string, string>;
  inheritance_pattern?: string;
  verification_status?: string;
  category?: string;
  gene_info?: GeneInfo;
  allele_freq?: Record<string, number>;
  epistasis_hint?: string;
  education_note?: string;
  references?: string[];
  visibility?: TraitVisibility;
  tags?: string[];
  test_case_seed?: string;
  // Legacy fields for backward compatibility
  description?: string;
  metadata?: Record<string, string>;
};

export type TraitFilters = {
  inheritance_pattern?: string;
  verification_status?: string;
  category?: string;
  gene?: string;
  tags?: string[];
  search?: string;
  status?: TraitStatus;
  visibility?: TraitVisibility;
  owned_only?: boolean;
};

export type TraitCreateResponse = {
  trait: TraitInfo;
};

export type TraitUpdateResponse = {
  trait: TraitInfo;
};

export type GWASTraitRecordValue = string | number | boolean | null;
export type GWASTraitRecord = Record<string, GWASTraitRecordValue>;

export type GWASTraitResponse = {
  columns: string[];
  records: GWASTraitRecord[];
};

export type TraitPreviewPayload = {
  alleles: string[];
  phenotype_map: Record<string, string>;
  inheritance_pattern?: string;
};

export type MendelianPreviewRequest = {
  trait: TraitPreviewPayload;
  parent1: string;
  parent2: string;
  as_percentages: boolean;
  seed?: number;
};

export type GameteProbability = {
  allele: string;
  probability: number;
};

export type PunnettCell = {
  genotype: string;
  probability: number;
  parent1_allele: string;
  parent2_allele: string;
};

export type MendelianPreviewResponse = {
  gametes: {
    p1: GameteProbability[];
    p2: GameteProbability[];
  };
  punnett: PunnettCell[][];
  genotype_dist: Record<string, number>;
  phenotype_dist: Record<string, number>;
  steps: string[];
  errors: string[];
};

export type DataImportResponse = {
  normalized_calls: Array<{
    rsid: string;
    genotype?: string | null;
    reference?: string | null;
    alternate?: string | null;
    dosage?: number | null;
  }>;
  mapped_traits: Record<
    string,
    {
      trait_key?: string | null;
      genotype?: string | null;
      confidence?: number | null;
      sources: string[];
      notes?: string | null;
    }
  >;
  unmapped_variants: string[];
  warnings: string[];
  persisted_path?: string | null;
};

export type PopulationSimRequest = {
  population: string;
  trait_keys: string[];
  n: number;
  seed?: number;
};

export type PopulationTraitResult = {
  trait_key: string;
  population: string;
  sample_size: number;
  allele_frequencies: Record<string, number>;
  genotype_counts: Record<string, number>;
  phenotype_counts: Record<string, number>;
  phenotype_ci: Record<string, { lower: number; upper: number }>;
  warnings: string[];
};

export type PopulationSimResponse = {
  results: PopulationTraitResult[];
  missing_traits: string[];
};

export type PGSDemoRequest = {
  weights: Array<{
    rsid: string;
    effect_allele: string;
    weight: number;
  }>;
  genotype_calls?: Record<string, number>;
  reference_mean?: number;
  reference_sd?: number;
};

export type PGSDemoResponse = {
  raw_score: number;
  z_score: number;
  percentile: number;
  used_snps: string[];
  missing_snps: string[];
  warnings: string[];
};

// Legacy aliases for backward compatibility (deprecated - use TraitCreatePayload/TraitUpdatePayload)
// export type TraitMutationPayload = TraitCreatePayload;
// export type TraitMutationResponse = TraitCreateResponse;

export type MendelianSimulationTraitResult = {
  genotypic_ratios: Record<string, number>;
  phenotypic_ratios: Record<string, number>;
};

export type MendelianSimulationResponse = {
  results: Record<string, MendelianSimulationTraitResult>;
  missing_traits: string[];
};

export type JointPhenotypeSimulationRequest = {
  parent1_genotypes: Record<string, string>;
  parent2_genotypes: Record<string, string>;
  trait_filter?: string[];
  as_percentages?: boolean;
};

export type JointPhenotypeSimulationResponse = {
  results: Record<string, number>;
  missing_traits: string[];
};

export type GenotypeRequest = {
  trait_keys: string[];
};

export type GenotypeResponse = {
  genotypes: Record<string, string[]>;
  missing_traits: string[];
};

export type PolygenicScoreResponse = {
  expected_score: number;
};

export type MendelianProjectTool = {
  id: string;
  type: string;
  name: string;
  trait_configurations: Record<string, Record<string, string>>;
  simulation_results?: Record<string, MendelianSimulationTraitResult>;
  notes?: string;
  position?: { x: number; y: number };
};

export type Project = {
  id?: string;
  name: string;
  description?: string;
  type: string;
  owner_id: string;
  tools: MendelianProjectTool[];
  created_at?: string;
  updated_at?: string;
  tags: string[];
  is_template: boolean;
  template_category?: string;
  color?: string;
};

export type ProjectCreateRequest = {
  name: string;
  description?: string;
  type: string;
  tags: string[];
  from_template?: string;
  color?: string;
};

export type ProjectUpdateRequest = {
  name?: string;
  description?: string;
  tags?: string[];
  tools?: MendelianProjectTool[];
  color?: string;
};

export type ProjectResponse = {
  project: Project;
};

export type ProjectListResponse = {
  projects: Project[];
  total: number;
  page: number;
  page_size: number;
};

export type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_image?: string;
  tools: MendelianProjectTool[];
  tags: string[];
};

export type ProjectTemplateListResponse = {
  templates: ProjectTemplate[];
};

export type ProjectLinePoint = {
  x: number;
  y: number;
};

export type ProjectLinePayload = {
  id: string;
  start_point: ProjectLinePoint;
  end_point: ProjectLinePoint;
  stroke_color: string;
  stroke_width: number;
  arrow_type: "none" | "end";
  is_deleted: boolean;
  updated_at: string;
  version: number;
  origin?: string | null;
};

export type ProjectLine = ProjectLinePayload & {
  project_id: string;
};

export type ProjectLineSnapshot = {
  lines: ProjectLine[];
  snapshot_version: number;
};

export type ProjectLineSaveSummary = {
  created: number;
  updated: number;
  deleted: number;
  ignored: number;
};

export type ProjectLineSaveResponse = ProjectLineSnapshot & {
  summary: ProjectLineSaveSummary;
};

export type ProjectLineSaveRequest = {
  lines: ProjectLinePayload[];
};

export type ProjectNoteSize = {
  width: number;
  height: number;
};

export type ProjectNotePayload = {
  id: string;
  content: string;
  position: ProjectLinePoint;
  size: ProjectNoteSize;
  is_deleted: boolean;
  updated_at: string;
  version: number;
  origin?: string | null;
};

export type ProjectNote = ProjectNotePayload & {
  project_id: string;
};

export type ProjectNoteSnapshot = {
  notes: ProjectNote[];
  snapshot_version: number;
};

export type ProjectNoteSaveSummary = {
  created: number;
  updated: number;
  deleted: number;
  ignored: number;
};

export type ProjectNoteSaveResponse = ProjectNoteSnapshot & {
  summary: ProjectNoteSaveSummary;
};

export type ProjectNoteSaveRequest = {
  notes: ProjectNotePayload[];
};

export type ProjectDrawingPoint = {
  x: number;
  y: number;
};

export type ProjectDrawingPayload = {
  id: string;
  points: ProjectDrawingPoint[];
  stroke_color: string;
  stroke_width: number;
  is_deleted: boolean;
  updated_at: string;
  version: number;
  origin?: string | null;
};

export type ProjectDrawing = ProjectDrawingPayload & {
  project_id: string;
};

export type ProjectDrawingSnapshot = {
  drawings: ProjectDrawing[];
  snapshot_version: number;
};

export type ProjectDrawingSaveSummary = {
  created: number;
  updated: number;
  deleted: number;
  ignored: number;
};

export type ProjectDrawingSaveResponse = ProjectDrawingSnapshot & {
  summary: ProjectDrawingSaveSummary;
};

export type ProjectDrawingSaveRequest = {
  drawings: ProjectDrawingPayload[];
};
