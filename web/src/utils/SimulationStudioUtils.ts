import type {
  ChromosomeType,
  DominancePattern,
} from "../services/cppEngine.api";
import type { TraitInfo } from "../types/api";
import type {
  AlleleForm,
  GeneForm,
  ParentGenotypeState,
} from "../types/simulationStudio.types";

class SimulationStudioUtils {
  constructor() {
    console.log("Simulation Studio Utils Constructor called");
  }

  generateUid = () => Math.random().toString(36).slice(2);

  sanitizeGeneId = (value: string): string => {
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return sanitized || `gene_${this.generateUid()}`;
  };

  inferDominancePattern = (trait: TraitInfo): DominancePattern => {
    const pattern = (trait.inheritance_pattern || "").toLowerCase();
    if (pattern.includes("codominant")) {
      return "codominant";
    }
    if (pattern.includes("incomplete")) {
      return "incomplete";
    }
    return "complete";
  };

  inferChromosomeType = (trait: TraitInfo): ChromosomeType => {
    const pattern = (trait.inheritance_pattern || "").toLowerCase();
    if (pattern.includes("x-linked")) {
      return "x";
    }
    if (pattern.includes("y-linked")) {
      return "y";
    }

    const chromosomeValues =
      trait.chromosomes ?? trait.gene_info?.chromosomes ?? [];
    if (
      chromosomeValues.some(
        (value) => String(value).trim().toLowerCase() === "x"
      )
    ) {
      return "x";
    }
    if (
      chromosomeValues.some(
        (value) => String(value).trim().toLowerCase() === "y"
      )
    ) {
      return "y";
    }
    return "autosomal";
  };

  candidateGenotypeKeys = (alleleA: string, alleleB: string): string[] => {
    const permutations = [
      `${alleleA}${alleleB}`,
      `${alleleB}${alleleA}`,
      `${alleleA}/${alleleB}`,
      `${alleleB}/${alleleA}`,
      `${alleleA}-${alleleB}`,
      `${alleleB}-${alleleA}`,
      `${alleleA} ${alleleB}`,
      `${alleleB} ${alleleA}`,
    ];
    if (alleleA !== alleleB) {
      permutations.push(`${alleleA}|${alleleB}`, `${alleleB}|${alleleA}`);
    }
    return permutations;
  };

  findPhenotypeLabel = (
    phenotypeMap: Record<string, string>,
    alleleA: string,
    alleleB: string
  ): string | undefined => {
    const possibleKeys = this.candidateGenotypeKeys(alleleA, alleleB);
    for (const key of possibleKeys) {
      if (phenotypeMap[key] !== undefined) {
        return phenotypeMap[key];
      }
    }
    return undefined;
  };
  extractIntermediateDescriptor = (
    trait: TraitInfo,
    dominance: DominancePattern,
    phenotypeMap: Record<string, string>
  ): string | undefined => {
    if (dominance !== "incomplete" || trait.alleles.length < 2) {
      return undefined;
    }
    const [first, second] = trait.alleles;
    return this.findPhenotypeLabel(phenotypeMap, first, second);
  };

  determineDominanceRank = (
    trait: TraitInfo,
    dominance: DominancePattern,
    alleleIndex: number
  ): number => {
    if (dominance === "codominant") {
      if (trait.alleles.length > 2) {
        return alleleIndex <= 1 ? 2 : 1;
      }
      return 2;
    }
    return alleleIndex === 0 ? 2 : 1;
  };

  determineMagnitude = (dominanceRank: number): number =>
    dominanceRank > 1 ? 1 : 0;
  buildGeneFromTrait = (trait: TraitInfo): GeneForm => {
    const uid = `gene-${this.generateUid()}`;
    const baseId = this.sanitizeGeneId(trait.key || trait.name || uid);

    const dominance = this.inferDominancePattern(trait);
    const chromosome = this.inferChromosomeType(trait);
    const phenotypeMap = trait.phenotype_map || {};
    const intermediateDescriptor = this.extractIntermediateDescriptor(
      trait,
      dominance,
      phenotypeMap
    );

    const alleles: AlleleForm[] = (trait.alleles || []).map((allele, index) => {
      const dominanceRank = this.determineDominanceRank(
        trait,
        dominance,
        index
      );
      const homozygousPhenotype =
        this.findPhenotypeLabel(phenotypeMap, allele, allele) || allele;
      return {
        id: allele,
        dominance_rank: dominanceRank,
        effects: [
          {
            id: `${baseId}-${allele}-effect-${index}`,
            trait_id: baseId,
            magnitude: this.determineMagnitude(dominanceRank),
            description: homozygousPhenotype,
            intermediate_descriptor: intermediateDescriptor,
          },
        ],
      };
    });

    return {
      uid,
      id: baseId,
      displayName: trait.name || baseId,
      traitKey: trait.key,
      chromosome,
      dominance,
      defaultAlleleId: alleles[0]?.id || "",
      alleles,
      linkageGroup: "",
      recombinationProbability: "",
      incompleteBlendWeight: dominance === "incomplete" ? 0.5 : "",
    };
  };

  getDefaultAllelesForGene = (
    gene: GeneForm,
    sex: "female" | "male"
  ): string[] => {
    const primary = gene.defaultAlleleId || gene.alleles[0]?.id || "";
    const safeAllele = primary || (gene.alleles[0]?.id ?? "");
    if (!safeAllele) {
      return [];
    }

    if (gene.chromosome === "autosomal") {
      return [safeAllele, safeAllele];
    }
    if (gene.chromosome === "x") {
      return sex === "male" ? [safeAllele] : [safeAllele, safeAllele];
    }
    if (gene.chromosome === "y") {
      return sex === "male" ? [safeAllele] : [];
    }
    return [safeAllele, safeAllele];
  };

  normaliseAlleles = (
    gene: GeneForm,
    current: string[] | undefined,
    sex: "female" | "male"
  ) => {
    const allowed = new Set(gene.alleles.map((allele) => allele.id));
    const defaults = this.getDefaultAllelesForGene(gene, sex);

    const sanitize = (value: string | undefined) => {
      if (!value || !allowed.has(value)) {
        return defaults[0] ?? "";
      }
      return value;
    };

    if (gene.chromosome === "autosomal") {
      return [
        sanitize(current?.[0] ?? defaults[0]),
        sanitize(current?.[1] ?? current?.[0] ?? defaults[1]),
      ];
    }

    if (gene.chromosome === "x") {
      if (sex === "male") {
        return [sanitize(current?.[0] ?? defaults[0])];
      }
      return [
        sanitize(current?.[0] ?? defaults[0]),
        sanitize(current?.[1] ?? current?.[0] ?? defaults[0]),
      ];
    }

    if (gene.chromosome === "y") {
      return sex === "male" ? [sanitize(current?.[0] ?? defaults[0])] : [];
    }

    return defaults;
  };

  syncGenotype = (
    genes: GeneForm[],
    sex: "female" | "male",
    previous: ParentGenotypeState
  ): ParentGenotypeState => {
    const next: ParentGenotypeState = {};
    genes.forEach((gene) => {
      next[gene.id || gene.uid] = this.normaliseAlleles(
        gene,
        previous[gene.id] ?? previous[gene.uid],
        sex
      );
    });
    return next;
  };
}

export default SimulationStudioUtils;
