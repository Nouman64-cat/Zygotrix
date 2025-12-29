/**
 * Virtual Breeding Lab - Type Definitions
 */

export interface Organism {
  id: string;
  name: string;
  sex: 'male' | 'female';
  genotype: Record<string, string>; // { "eye_color": "Bb", "hair_color": "Hh" }
  phenotype: Record<string, string>; // { "eye_color": "Brown", "hair_color": "Black" }
  createdAt: number;
  isOffspring?: boolean;
  generation?: number;
  parentIds?: [string, string];
}

export interface Trait {
  id: string;
  name: string;
  chromosome: 'autosomal' | 'x' | 'y';
  dominance: 'complete' | 'incomplete' | 'codominant';
  alleles: {
    symbol: string;
    name: string;
    dominance_rank: number;
  }[];
}

export interface BreedingRequest {
  parentA: Organism;
  parentB: Organism;
  simulations?: number;
  traits: string[]; // trait IDs to simulate
}

export interface BreedingResult {
  offspring: Organism[];
  genotypicRatios: Record<string, Record<string, number>>; // { "eye_color": { "BB": 0.25, "Bb": 0.50, "bb": 0.25 } }
  phenotypicRatios: Record<string, Record<string, number>>; // { "eye_color": { "Brown": 0.75, "Blue": 0.25 } }
  simulations: number;
  sexRatios?: Record<string, number>; // { "male": 0.5, "female": 0.5 }
}

// API response types (from backend)
export interface MendelianSimulationTraitResult {
  genotypic_ratios: Record<string, number>;
  phenotypic_ratios: Record<string, number>;
}

export interface MendelianSimulationResponse {
  results: Record<string, MendelianSimulationTraitResult>;
  missing_traits: string[];
}
