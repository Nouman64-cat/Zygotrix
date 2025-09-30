/**
 * Returns a mapping of Rh backend genotype keys to standardized notation and phenotype
 */
export function getRhGenotypeMap(): Record<
  string,
  { display: string; phenotype: string }
> {
  return {
    "Rh+Rh+": { display: "Rh+Rh+", phenotype: "Rh+" },
    "Rh+Rh-": { display: "Rh+Rh-", phenotype: "Rh+" },
    "Rh-Rh+": { display: "Rh-Rh+", phenotype: "Rh+" },
    "Rh-Rh-": { display: "Rh-Rh-", phenotype: "Rh-" },
  };
}

/**
 * Returns the display order for Rh genotypes
 */
export function getRhGenotypeOrder(): string[] {
  return ["Rh+Rh+", "Rh+Rh-", "Rh-Rh-"];
}
/**
 * Generate all possible genotype combinations for a set of alleles.
 * Includes homozygous and heterozygous (both orders), deduplicated and sorted.
 */
export function getGenotypeOptions(alleles: string[]): string[] {
  if (!alleles || alleles.length === 0) return [];
  const options: string[] = [];
  for (let i = 0; i < alleles.length; i++) {
    for (let j = i; j < alleles.length; j++) {
      if (i === j) {
        options.push(alleles[i] + alleles[i]);
      } else {
        options.push(alleles[i] + alleles[j]);
        options.push(alleles[j] + alleles[i]);
      }
    }
  }
  return [...new Set(options)].sort();
}

/**
 * Add a trait to the selected traits list.
 */
export function addTraitToSelection(
  traits: any[],
  selectedTraits: any[],
  traitKey: string
) {
  if (selectedTraits.length >= 5) return selectedTraits;
  const trait = traits.find((t) => t.key === traitKey);
  if (!trait) return selectedTraits;
  const newTrait = {
    key: trait.key,
    name: trait.name,
    parent1Genotype: "",
    parent2Genotype: "",
    alleles: trait.alleles,
  };
  return [...selectedTraits, newTrait];
}

/**
 * Remove a trait from the selected traits list.
 */
export function removeTraitFromSelection(
  selectedTraits: any[],
  traitKey: string
) {
  return selectedTraits.filter((t) => t.key !== traitKey);
}

/**
 * Update the genotype for a specific parent of a selected trait.
 */
export function updateTraitGenotypeInSelection(
  selectedTraits: any[],
  traitKey: string,
  parent: "parent1" | "parent2",
  genotype: string
) {
  return selectedTraits.map((trait) =>
    trait.key === traitKey
      ? { ...trait, [`${parent}Genotype`]: genotype }
      : trait
  );
}
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
