import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type {
  TraitInfo,
  TraitListResponse,
  TraitMutationPayload,
  TraitMutationResponse,
} from "../types/api";

export type TraitFilters = {
  inheritance_pattern?: string;
  verification_status?: string;
  category?: string;
  gene_info?: string;
};

export const fetchTraits = async (
  signal?: AbortSignal,
  filters?: TraitFilters,
): Promise<TraitInfo[]> => {
  const response = await API.get<TraitListResponse>(API_ROUTES.traits.root, {
    signal,
    params: filters,
  });
  return response.data.traits;
};

export const createTrait = async (
  payload: TraitMutationPayload,
): Promise<TraitMutationResponse> => {
  const response = await API.post<TraitMutationResponse>(
    API_ROUTES.traits.root,
    payload,
  );
  return response.data;
};

export const updateTrait = async (
  key: string,
  payload: TraitMutationPayload,
): Promise<TraitMutationResponse> => {
  const response = await API.put<TraitMutationResponse>(
    API_ROUTES.traits.detail(key),
    payload,
  );
  return response.data;
};

export const deleteTrait = async (key: string): Promise<void> => {
  await API.delete(API_ROUTES.traits.detail(key));
};

