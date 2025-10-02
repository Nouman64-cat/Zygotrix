import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type {
  TraitInfo,
  TraitListResponse,
  TraitCreatePayload,
  TraitUpdatePayload,
  TraitCreateResponse,
  TraitUpdateResponse,
  TraitFilters,
} from "../types/api";

/**
 * Fetch traits with filtering and access control
 * - Public traits are visible to everyone
 * - Private/team traits are only visible to authenticated owners
 */
export const fetchTraits = async (
  signal?: AbortSignal,
  filters?: TraitFilters
): Promise<TraitInfo[]> => {
  const response = await API.get<TraitListResponse>(API_ROUTES.traits.root, {
    signal,
    params: filters,
  });
  return response.data.traits;
};

/**
 * Fetch user-owned traits count
 * - Returns count of traits created by the authenticated user
 * - Requires authentication
 */
export const fetchUserTraitsCount = async (
  signal?: AbortSignal
): Promise<number> => {
  const response = await API.get<TraitListResponse>(API_ROUTES.traits.root, {
    signal,
    params: { owned_only: true },
  });
  return response.data.traits.length;
};

/**
 * Fetch public traits count from traits_dataset.json
 * - Returns count of all public traits available in the system
 * - No authentication required
 */
export const fetchPublicTraitsCount = async (
  signal?: AbortSignal
): Promise<number> => {
  const response = await API.get<TraitListResponse>(API_ROUTES.traits.root, {
    signal,
    params: { owned_only: false },
  });
  return response.data.traits.length;
};

/**
 * Get a specific trait by key
 * - Public traits are accessible to everyone
 * - Private traits are only accessible to the owner
 */
export const fetchTraitByKey = async (
  key: string,
  signal?: AbortSignal
): Promise<TraitInfo> => {
  const response = await API.get<TraitInfo>(API_ROUTES.traits.detail(key), {
    signal,
  });
  return response.data;
};

/**
 * Create a new trait (requires authentication)
 * - Validates alleles are non-empty
 * - Canonicalizes genotypes in phenotype_map
 * - Ensures full coverage in phenotype_map
 * - Sets owner_id from JWT token
 * - Defaults to private visibility and draft status
 */
export const createTrait = async (
  payload: TraitCreatePayload
): Promise<TraitCreateResponse> => {
  const response = await API.post<TraitCreateResponse>(
    API_ROUTES.traits.root,
    payload
  );
  return response.data;
};

/**
 * Update an existing trait (requires ownership)
 * - Only the trait owner can update
 * - Bumps version automatically
 * - Keeps audit trail of changes
 */
export const updateTrait = async (
  key: string,
  payload: TraitUpdatePayload
): Promise<TraitUpdateResponse> => {
  const response = await API.put<TraitUpdateResponse>(
    API_ROUTES.traits.detail(key),
    payload
  );
  return response.data;
};

/**
 * Soft delete a trait (set status to deprecated)
 * - Only the trait owner can delete
 * - Performs soft delete by setting status to 'deprecated'
 */
export const deleteTrait = async (key: string): Promise<void> => {
  await API.delete(API_ROUTES.traits.detail(key));
};

/**
 * Helper function to generate all possible genotypes from alleles
 * Used for validation and UI generation
 */
export const generateGenotypes = (alleles: string[]): string[] => {
  const genotypes: string[] = [];
  for (const allele1 of alleles) {
    for (const allele2 of alleles) {
      const genotype = [allele1, allele2]
        .sort((a, b) => a.localeCompare(b))
        .join("");
      if (!genotypes.includes(genotype)) {
        genotypes.push(genotype);
      }
    }
  }
  return genotypes.sort((a, b) => a.localeCompare(b));
};

/**
 * Validate phenotype map coverage
 * Returns validation errors if any
 */
export const validatePhenotypeMap = (
  alleles: string[],
  phenotypeMap: Record<string, string>
): string[] => {
  const errors: string[] = [];

  if (!alleles.length) {
    errors.push("At least one allele must be provided");
    return errors;
  }

  const expectedGenotypes = generateGenotypes(alleles);
  const providedGenotypes = Object.keys(phenotypeMap);

  const missing = expectedGenotypes.filter(
    (g) => !providedGenotypes.includes(g)
  );
  if (missing.length > 0) {
    errors.push(`Missing genotype phenotypes: ${missing.join(", ")}`);
  }

  const extra = providedGenotypes.filter((g) => !expectedGenotypes.includes(g));
  if (extra.length > 0) {
    errors.push(`Unexpected genotypes in phenotype map: ${extra.join(", ")}`);
  }

  return errors;
};
