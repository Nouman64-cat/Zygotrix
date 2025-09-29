import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type {
  GenotypeResponse,
  JointPhenotypeSimulationResponse,
  MendelianSimulationResponse,
  PolygenicScoreResponse,
} from "../types/api";

export const simulateMendelianTrait = async (
  traitKey: string,
  parent1: string,
  parent2: string,
  asPercentages: boolean,
): Promise<MendelianSimulationResponse> => {
  const payload = {
    parent1_genotypes: { [traitKey]: parent1 },
    parent2_genotypes: { [traitKey]: parent2 },
    trait_filter: [traitKey],
    as_percentages: asPercentages,
  };
  const response = await API.post<MendelianSimulationResponse>(
    API_ROUTES.mendelian.simulate,
    payload,
  );
  return response.data;
};

export const simulateMultipleMendelianTraits = async (
  parent1Genotypes: Record<string, string>,
  parent2Genotypes: Record<string, string>,
  traitKeys: string[],
  asPercentages: boolean,
): Promise<MendelianSimulationResponse> => {
  const payload = {
    parent1_genotypes: parent1Genotypes,
    parent2_genotypes: parent2Genotypes,
    trait_filter: traitKeys,
    as_percentages: asPercentages,
  };
  const response = await API.post<MendelianSimulationResponse>(
    API_ROUTES.mendelian.simulate,
    payload,
  );
  return response.data;
};

export const simulateJointPhenotypes = async (
  parent1Genotypes: Record<string, string>,
  parent2Genotypes: Record<string, string>,
  traitKeys: string[] | undefined,
  asPercentages: boolean = true,
): Promise<JointPhenotypeSimulationResponse> => {
  const payload: {
    parent1_genotypes: Record<string, string>;
    parent2_genotypes: Record<string, string>;
    trait_filter?: string[];
    as_percentages: boolean;
  } = {
    parent1_genotypes: parent1Genotypes,
    parent2_genotypes: parent2Genotypes,
    as_percentages: asPercentages,
  };
  if (traitKeys) {
    payload.trait_filter = traitKeys;
  }
  const response = await API.post<JointPhenotypeSimulationResponse>(
    API_ROUTES.mendelian.simulateJoint,
    payload,
  );
  return response.data;
};

export const fetchTraitGenotypes = async (
  traitKeys: string[],
): Promise<GenotypeResponse> => {
  const response = await API.post<GenotypeResponse>(
    API_ROUTES.mendelian.genotypes,
    { trait_keys: traitKeys },
  );
  return response.data;
};

export const fetchPolygenicScore = async (
  signal?: AbortSignal,
): Promise<PolygenicScoreResponse> => {
  const payload = {
    parent1_genotype: { rs1: 1.0, rs2: 0.0 },
    parent2_genotype: { rs1: 2.0, rs2: 0.0 },
    weights: { rs1: 0.6, rs2: -0.2 },
  };
  const response = await API.post<PolygenicScoreResponse>(
    API_ROUTES.polygenic.score,
    payload,
    { signal },
  );
  return response.data;
};

