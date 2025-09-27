export type TraitInfo = {
  key: string;
  name: string;
  description?: string;
  alleles: string[];
  phenotype_map: Record<string, string>;
  metadata?: Record<string, string>;
  inheritance_pattern?: string;
  verification_status?: string;
  gene_info?: string;
  category?: string;
  // New fields for Level 3 - Real Genes
  gene?: string;
  chromosome?: number;
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
  inheritance_pattern?: string;
  verification_status?: string;
  gene_info?: string;
  category?: string;
};

export type TraitMutationResponse = {
  trait: TraitInfo;
};

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
