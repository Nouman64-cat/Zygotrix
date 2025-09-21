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

export type MendelianSimulationResponse = {
  results: Record<string, Record<string, number>>;
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
  simulation_results?: Record<string, Record<string, number>>;
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
};

export type ProjectCreateRequest = {
  name: string;
  description?: string;
  type: string;
  tags: string[];
  from_template?: string;
};

export type ProjectUpdateRequest = {
  name?: string;
  description?: string;
  tags?: string[];
  tools?: MendelianProjectTool[];
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
