import { TraitInfo } from "../types/api";

export const sanitizeDiploidGenotype = (value: string): string =>
  value.replace(/[^A-Za-z]/g, "").slice(0, 2);

export const deriveDefaultGenotypes = (
  trait: TraitInfo | undefined,
): { parent1: string; parent2: string } => {
  if (!trait || trait.alleles.length === 0) {
    return { parent1: "", parent2: "" };
  }

  if (trait.alleles.length === 1) {
    const allele = trait.alleles[0];
    return { parent1: allele.repeat(2), parent2: allele.repeat(2) };
  }

  const parent1 = `${trait.alleles[0]}${trait.alleles[1]}`;
  const parent2 = trait.alleles[0].repeat(2);
  return { parent1, parent2 };
};