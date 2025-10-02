import type { TraitCreatePayload } from "../types/api";

/**
 * Generates realistic dummy trait data for development purposes
 * @returns {TraitCreatePayload} Complete trait data ready for form population
 */
export const generateDummyTraitData = (): TraitCreatePayload => {
  const dummyTraits: TraitCreatePayload[] = [
    {
      key: "eye_color_development",
      name: "Eye Color (Dev)",
      alleles: ["B", "b"],
      phenotype_map: {
        BB: "Brown eyes",
        Bb: "Brown eyes",
        bb: "Blue eyes",
      },
      inheritance_pattern: "autosomal_dominant",
      verification_status: "simplified",
      category: "physical_traits",
      gene_info: {
        genes: ["HERC2"],
        chromosomes: ["15"],
        locus: "15q13.1",
      },
      description:
        "Eye color inheritance following dominant-recessive pattern. Brown is dominant over blue.",
      tags: ["physical", "eye", "dominant", "recessive"],
      references: ["https://example.com/eye-color-genetics"],
      education_note: "Great example for teaching basic Mendelian inheritance",
      epistasis_hint: "May be modified by other eye color genes like OCA2",
      visibility: "private",
    },
    {
      key: "hair_texture_development",
      name: "Hair Texture (Dev)",
      alleles: ["C", "c"],
      phenotype_map: {
        CC: "Curly hair",
        Cc: "Wavy hair",
        cc: "Straight hair",
      },
      inheritance_pattern: "incomplete_dominance",
      verification_status: "experimental",
      category: "physical_traits",
      gene_info: {
        genes: ["TCHH"],
        chromosomes: ["1"],
        locus: "1q21.3",
      },
      description:
        "Hair texture showing incomplete dominance where heterozygotes have intermediate phenotype.",
      tags: ["physical", "hair", "incomplete-dominance"],
      references: ["https://example.com/hair-genetics"],
      education_note: "Excellent for demonstrating incomplete dominance",
      epistasis_hint: "Multiple genes affect hair texture",
      visibility: "private",
    },
    {
      key: "widow_peak_development",
      name: "Widow's Peak (Dev)",
      alleles: ["W", "w"],
      phenotype_map: {
        WW: "Widow's peak present",
        Ww: "Widow's peak present",
        ww: "No widow's peak",
      },
      inheritance_pattern: "autosomal_dominant",
      verification_status: "simplified",
      category: "physical_traits",
      gene_info: {
        genes: ["WIDOWS"],
        chromosomes: ["2"],
        locus: "2p21",
      },
      description:
        "Hairline pattern where a V-shaped point extends into the forehead.",
      tags: ["physical", "hairline", "dominant"],
      references: ["https://example.com/widows-peak"],
      education_note: "Simple dominant trait for basic genetics lessons",
      visibility: "private",
    },
    {
      key: "taste_ptc_development",
      name: "PTC Tasting Ability (Dev)",
      alleles: ["T", "t"],
      phenotype_map: {
        TT: "Can taste PTC (bitter)",
        Tt: "Can taste PTC (bitter)",
        tt: "Cannot taste PTC",
      },
      inheritance_pattern: "autosomal_dominant",
      verification_status: "verified",
      category: "sensory_traits",
      gene_info: {
        genes: ["TAS2R38"],
        chromosomes: ["7"],
        locus: "7q34",
      },
      description:
        "Ability to taste phenylthiocarbamide (PTC), a bitter compound used in genetics education.",
      tags: ["sensory", "taste", "dominant", "education"],
      references: ["https://example.com/ptc-tasting"],
      education_note:
        "Classic genetics lab exercise - safe to test with students",
      epistasis_hint: "Variants in TAS2R38 affect sensitivity levels",
      visibility: "private",
    },
  ];

  // Randomly select one of the dummy traits
  const randomTrait =
    dummyTraits[Math.floor(Math.random() * dummyTraits.length)];

  // Add timestamp to make key unique
  const timestamp = Date.now();

  return {
    ...randomTrait,
    key: `${randomTrait.key}_${timestamp}`,
    name: `${randomTrait.name} ${timestamp}`,
  };
};
