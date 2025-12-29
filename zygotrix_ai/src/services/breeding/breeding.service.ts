/**
 * Virtual Breeding Lab - API Service
 * Handles communication with genetics endpoints
 */

import axiosInstance from '../api/config/axios.config';
import { API_ENDPOINTS } from '../api/constants/api.constants';
import type {
  Trait,
  BreedingRequest,
  BreedingResult,
  MendelianSimulationResponse,
  Organism,
} from '../../types';
import { generateId } from '../../utils';

class BreedingService {
  /**
   * Get available traits from the API
   */
  async getTraits(filters?: { category?: string }): Promise<Trait[]> {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GENETICS.TRAITS, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch traits:', error);
      throw new Error('Failed to load traits');
    }
  }

  /**
   * Simulate breeding between two organisms
   */
  async breed(request: BreedingRequest): Promise<BreedingResult> {
    try {
      // Map request to backend API format
      const apiRequest = {
        parent1_genotypes: request.parentA.genotype,
        parent2_genotypes: request.parentB.genotype,
        trait_filter: request.traits,
        as_percentages: true,
      };

      const response = await axiosInstance.post<MendelianSimulationResponse>(
        API_ENDPOINTS.GENETICS.MENDELIAN_SIMULATE,
        apiRequest
      );

      // Transform API response to frontend format
      return this.transformResponse(response.data, request);
    } catch (error) {
      console.error('Breeding simulation failed:', error);
      throw new Error('Breeding simulation failed');
    }
  }

  /**
   * Transform API response to frontend BreedingResult format
   */
  private transformResponse(
    apiResponse: MendelianSimulationResponse,
    request: BreedingRequest
  ): BreedingResult {
    const { results } = apiResponse;
    const simulations = request.simulations || 100;

    // Extract genotypic and phenotypic ratios per trait
    // Backend returns percentages (0-100), convert to decimals (0-1)
    const genotypicRatios: Record<string, Record<string, number>> = {};
    const phenotypicRatios: Record<string, Record<string, number>> = {};

    Object.entries(results).forEach(([traitId, traitResult]) => {
      genotypicRatios[traitId] = Object.fromEntries(
        Object.entries(traitResult.genotypic_ratios).map(([key, value]) => [key, value / 100])
      );
      phenotypicRatios[traitId] = Object.fromEntries(
        Object.entries(traitResult.phenotypic_ratios).map(([key, value]) => [key, value / 100])
      );
    });

    // Generate offspring organisms based on ratios
    const offspring = this.generateOffspring(
      request.parentA,
      request.parentB,
      genotypicRatios,
      phenotypicRatios,
      simulations
    );

    return {
      offspring,
      genotypicRatios,
      phenotypicRatios,
      simulations,
      sexRatios: { male: 0.5, female: 0.5 }, // 50/50 sex ratio for simplicity
    };
  }

  /**
   * Generate offspring organisms based on breeding ratios
   */
  private generateOffspring(
    parentA: Organism,
    parentB: Organism,
    genotypicRatios: Record<string, Record<string, number>>,
    phenotypicRatios: Record<string, Record<string, number>>,
    count: number
  ): Organism[] {
    const offspring: Organism[] = [];
    const nextGeneration = Math.max(
      parentA.generation || 1,
      parentB.generation || 1
    ) + 1;

    // For simplicity, generate a few representative offspring (max 12)
    const displayCount = Math.min(12, count);

    for (let i = 0; i < displayCount; i++) {
      // Randomly assign sex
      const sex = Math.random() < 0.5 ? 'male' : 'female';

      // Generate genotype based on ratios
      const genotype: Record<string, string> = {};
      const phenotype: Record<string, string> = {};

      Object.keys(genotypicRatios).forEach((traitId) => {
        const genotypeOptions = Object.keys(genotypicRatios[traitId]);
        const phenotypeOptions = Object.keys(phenotypicRatios[traitId]);

        // Pick a genotype based on weighted random selection
        const selectedGenotype = this.weightedRandomSelection(
          genotypeOptions,
          genotypicRatios[traitId]
        );

        genotype[traitId] = selectedGenotype;

        // Determine phenotype from genotype
        // For complete dominance, uppercase = dominant
        phenotype[traitId] = this.determinePhenotype(
          selectedGenotype,
          phenotypeOptions,
          phenotypicRatios[traitId]
        );
      });

      offspring.push({
        id: generateId(),
        name: `Offspring #${i + 1}`,
        sex,
        genotype,
        phenotype,
        createdAt: Date.now() + i, // Slight offset for uniqueness
        isOffspring: true,
        generation: nextGeneration,
        parentIds: [parentA.id, parentB.id],
      });
    }

    return offspring;
  }

  /**
   * Weighted random selection based on ratios
   */
  private weightedRandomSelection(
    options: string[],
    ratios: Record<string, number>
  ): string {
    const random = Math.random();
    let cumulative = 0;

    for (const option of options) {
      cumulative += ratios[option];
      if (random <= cumulative) {
        return option;
      }
    }

    return options[0]; // Fallback
  }

  /**
   * Determine phenotype from genotype
   * For complete dominance: if any uppercase letter, use dominant phenotype
   */
  private determinePhenotype(
    genotype: string,
    phenotypeOptions: string[],
    phenotypicRatios: Record<string, number>
  ): string {
    // Find the phenotype that matches the genotype characteristics
    // For now, use weighted random based on phenotypic ratios
    return this.weightedRandomSelection(phenotypeOptions, phenotypicRatios);
  }
}

export default new BreedingService();
