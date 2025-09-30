import type { TraitInfo } from "../types/api";

/**
 * Sanitize a diploid genotype string, supporting multi-character alleles.
 * If alleles are multi-character, pass the allele list for the trait.
 * Example: sanitizeDiploidGenotype('Rh-Rh-', ['Rh+', 'Rh-']) => 'Rh-Rh-'
 */
export function sanitizeDiploidGenotype(
  value: string,
  alleles?: string[]
): string {
  const cleaned = value.replace(/\s/g, "");
  if (alleles && alleles.length > 0) {
    // Try to find two alleles in order from the string
    for (let i = 1; i < cleaned.length; i++) {
      const allele1 = cleaned.slice(0, i);
      const allele2 = cleaned.slice(i);
      if (alleles.includes(allele1) && alleles.includes(allele2)) {
        return allele1 + allele2;
      }
    }
    // fallback: if not found, return as is
    return cleaned;
  }
  // fallback: old logic for single-char alleles
  return cleaned.replace(/[^A-Za-z]/g, "").slice(0, 2);
}

export const deriveDefaultGenotypes = (
  trait: TraitInfo | undefined
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
