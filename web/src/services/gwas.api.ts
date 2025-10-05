import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type { GWASTraitResponse } from "../types/api";

export const searchGWASTraits = async (
  query: string,
  signal?: AbortSignal
): Promise<string[]> => {
  if (!query.trim()) {
    return [];
  }

  const response = await API.get<string[]>(API_ROUTES.gwas.search, {
    params: { q: query },
    signal,
  });

  return response.data;
};

export const fetchGWASTraitDetails = async (
  traitName: string,
  options?: { limit?: number; signal?: AbortSignal }
): Promise<GWASTraitResponse> => {
  const { limit = 50, signal } = options ?? {};

  const response = await API.get<GWASTraitResponse>(
    API_ROUTES.gwas.trait(traitName),
    {
      params: { limit },
      signal,
    }
  );

  return response.data;
};
