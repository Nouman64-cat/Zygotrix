export interface PedigreeMember {
  id: string;
  relation: string;
  phenotype: string;
  parent_ids: string[];
}

export interface PedigreeStructure {
  members: PedigreeMember[];
  target_trait: string;
}

export interface GeneticAnalysisResult {
  status: "SOLVABLE" | "CONFLICT" | "MISSING_DATA" | "UNKNOWN";
  mode_used: "MENDELIAN" | "EPISTATIC" | "POLYGENIC" | "UNKNOWN";
  probability_map: Record<string, any>;
  conflict_reason?: string;
  visualization_grid?: Record<string, any>;
}

export interface PedigreeResponse {
  ai_message: string;
  analysis_result?: GeneticAnalysisResult;
  structured_data?: PedigreeStructure;
  requires_clarification: boolean;
}

export interface PedigreeRequest {
  query: string;
  conversation_history?: Record<string, string>[];
}
