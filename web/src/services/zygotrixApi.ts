import type {
  MendelianSimulationResponse,
  PolygenicScoreResponse,
  TraitInfo,
  TraitListResponse,
  TraitMutationPayload,
  TraitMutationResponse,
} from "../types/api";

export const API_BASE_URL = import.meta.env.VITE_ZYGOTRIX_API ?? "http://127.0.0.1:8000";

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
};

export const fetchTraits = async (signal?: AbortSignal): Promise<TraitInfo[]> => {
  const response = await fetch(`${API_BASE_URL}/api/traits`, { signal });
  const payload = await handleResponse<TraitListResponse>(response);
  return payload.traits;
};

export const createTrait = async (payload: TraitMutationPayload): Promise<TraitMutationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/traits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<TraitMutationResponse>(response);
};

export const updateTrait = async (
  key: string,
  payload: TraitMutationPayload,
): Promise<TraitMutationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/traits/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<TraitMutationResponse>(response);
};

export const deleteTrait = async (key: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/traits/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Delete failed with status ${response.status}`);
  }
};

export const simulateMendelianTrait = async (
  traitKey: string,
  parent1: string,
  parent2: string,
  asPercentages: boolean,
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

export const fetchPolygenicScore = async (signal?: AbortSignal): Promise<PolygenicScoreResponse> => {
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
