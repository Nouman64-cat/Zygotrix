import type {
  GenotypeResponse,
  JointPhenotypeSimulationResponse,
  MendelianSimulationResponse,
  PolygenicScoreResponse,
  TraitInfo,
  TraitListResponse,
  TraitMutationPayload,
  TraitMutationResponse,
  ProjectUpdateRequest,
  ProjectResponse,
} from "../types/api";

export const API_BASE_URL =
  import.meta.env.VITE_ZYGOTRIX_API ?? "http://127.0.0.1:8000";

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("zygotrix_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
};

export const fetchTraits = async (
  signal?: AbortSignal,
  filters?: {
    inheritance_pattern?: string;
    verification_status?: string;
    category?: string;
    gene_info?: string;
  }
): Promise<TraitInfo[]> => {
  const url = new URL(`${API_BASE_URL}/api/traits`);

  if (filters) {
    if (filters.inheritance_pattern)
      url.searchParams.set("inheritance_pattern", filters.inheritance_pattern);
    if (filters.verification_status)
      url.searchParams.set("verification_status", filters.verification_status);
    if (filters.category) url.searchParams.set("category", filters.category);
    if (filters.gene_info) url.searchParams.set("gene_info", filters.gene_info);
  }

  const response = await fetch(url.toString(), { signal });
  const payload = await handleResponse<TraitListResponse>(response);
  return payload.traits;
};

export const createTrait = async (
  payload: TraitMutationPayload
): Promise<TraitMutationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/traits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<TraitMutationResponse>(response);
};

export const updateTrait = async (
  key: string,
  payload: TraitMutationPayload
): Promise<TraitMutationResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/traits/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<TraitMutationResponse>(response);
};

export const deleteTrait = async (key: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/traits/${encodeURIComponent(key)}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Delete failed with status ${response.status}`);
  }
};

export const simulateMendelianTrait = async (
  traitKey: string,
  parent1: string,
  parent2: string,
  asPercentages: boolean
): Promise<MendelianSimulationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/mendelian/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parent1_genotypes: { [traitKey]: parent1 },
      parent2_genotypes: { [traitKey]: parent2 },
      trait_filter: [traitKey],
      as_percentages: asPercentages,
    }),
  });

  return handleResponse<MendelianSimulationResponse>(response);
};

export const simulateMultipleMendelianTraits = async (
  parent1Genotypes: Record<string, string>,
  parent2Genotypes: Record<string, string>,
  traitKeys: string[],
  asPercentages: boolean
): Promise<MendelianSimulationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/mendelian/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parent1_genotypes: parent1Genotypes,
      parent2_genotypes: parent2Genotypes,
      trait_filter: traitKeys,
      as_percentages: asPercentages,
    }),
  });

  return handleResponse<MendelianSimulationResponse>(response);
};

export const simulateJointPhenotypes = async (
  parent1Genotypes: Record<string, string>,
  parent2Genotypes: Record<string, string>,
  traitKeys?: string[],
  asPercentages: boolean = true
): Promise<JointPhenotypeSimulationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/mendelian/simulate-joint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parent1_genotypes: parent1Genotypes,
      parent2_genotypes: parent2Genotypes,
      trait_filter: traitKeys,
      as_percentages: asPercentages,
    }),
  });

  return handleResponse<JointPhenotypeSimulationResponse>(response);
};

export const fetchTraitGenotypes = async (
  traitKeys: string[]
): Promise<GenotypeResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/mendelian/genotypes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trait_keys: traitKeys,
    }),
  });

  return handleResponse<GenotypeResponse>(response);
};

export const fetchPolygenicScore = async (
  signal?: AbortSignal
): Promise<PolygenicScoreResponse> => {
  const body = {
    parent1_genotype: { rs1: 1.0, rs2: 0.0 },
    parent2_genotype: { rs1: 2.0, rs2: 0.0 },
    weights: { rs1: 0.6, rs2: -0.2 },
  };

  const response = await fetch(`${API_BASE_URL}/api/polygenic/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  return handleResponse<PolygenicScoreResponse>(response);
};

// Tool Management API functions
export const createMendelianTool = async (
  projectId: string,
  toolData: {
    name: string;
    trait_configurations?: Record<string, Record<string, string>>;
    simulation_results?: Record<string, Record<string, number>>;
    notes?: string;
    position?: { x: number; y: number };
  }
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/tools`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(toolData),
    }
  );

  return handleResponse<any>(response);
};

export const updateMendelianTool = async (
  projectId: string,
  toolId: string,
  updates: {
    name?: string;
    trait_configurations?: Record<string, Record<string, string>>;
    simulation_results?: Record<string, Record<string, number>>;
    notes?: string;
    position?: { x: number; y: number };
  }
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/tools/${toolId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(updates),
    }
  );

  return handleResponse<any>(response);
};

export const deleteMendelianTool = async (
  projectId: string,
  toolId: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/tools/${toolId}`,
    {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }
};

// Project Management API functions
export const updateProject = async (
  projectId: string,
  updates: ProjectUpdateRequest
): Promise<ProjectResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(updates),
  });

  return handleResponse<ProjectResponse>(response);
};
