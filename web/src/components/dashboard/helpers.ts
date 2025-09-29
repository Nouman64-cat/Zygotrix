// dashboard/helpers.ts
// Reusable helper functions extracted from MendelianWorkspaceTool

/**
 * Returns the default genotype string for a trait's alleles (e.g. "Aa" for ["A", "a"])
 */
export function getDefaultGenotype(alleles: string[]): string {
  return alleles.length >= 2 ? `${alleles[0]}${alleles[1]}` : "";
}

/**
 * Returns a mapping of ABO backend genotype keys to I notation
 */
export function getAboGenotypeMap(): Record<string, string> {
  return {
    AA: "IᴬIᴬ",
    AO: "Iᴬi",
    BB: "IᴮIᴮ",
    BO: "Iᴮi",
    AB: "IᴬIᴮ",
    OO: "ii",
  };
}

/**
 * Returns the display order for ABO genotypes
 */
export function getAboGenotypeOrder(): string[] {
  return ["AA", "AO", "BB", "BO", "AB", "OO"];
}
