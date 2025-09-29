import type { IconKey } from "../components/universal/Icon";

type FeatureCardContent = {
  title: string;
  description: string;
  icon: IconKey;
  accent: string;
};

type StatHighlight = {
  value: string;
  label: string;
};

type WorkflowStep = {
  title: string;
  description: string;
};

export const featureCards: FeatureCardContent[] = [
  {
    title: "Composable trait registry",
    description:
      "Model diploid traits with canonical genotype enforcement, phenotype mapping, and metadata you control.",
    icon: "dna",
    accent: "from-[#1E3A8A] to-[#3B82F6]",
  },
  {
    title: "Hybrid simulations",
    description:
      "Blend Mendelian ratios and polygenic scores in a single simulator to explore complex inheritance scenarios.",
    icon: "network",
    accent: "from-[#3B82F6] to-[#10B981]",
  },
  {
    title: "Insightful distributions",
    description:
      "Convert genotype probabilities into phenotypes or percentages instantly, complete with sampling utilities.",
    icon: "chart",
    accent: "from-[#10B981] to-[#FBBF24]",
  },
  {
    title: "Type-safe toolkit",
    description:
      "Ships as a pure Python package with dataclass-powered traits, keeping your scientific code maintainable.",
    icon: "shield",
    accent: "from-[#4B5563] to-[#1E3A8A]",
  },
  {
    title: "Fast experimentation",
    description:
      "Swap registries, plug in weights, and iterate on hypotheses without rewriting probability logic.",
    icon: "spark",
    accent: "from-[#3B82F6] to-[#FBBF24]",
  },
  {
    title: "Layered integrations",
    description:
      "Embed results into dashboards, notebooks, or APIs thanks to modular calculators and helper utilities.",
    icon: "layers",
    accent: "from-[#1E3A8A] to-[#10B981]",
  },
];

export const stats: StatHighlight[] = [
  { value: "3", label: "Bundled traits" },
  { value: "0", label: "External deps" },
  { value: "100%", label: "Probability safe" },
];

export const workflow: WorkflowStep[] = [
  {
    title: "Define traits",
    description:
      "Leverage ready-made blueprints for eye color, blood type, and hair color or register your own domain traits.",
  },
  {
    title: "Simulate inheritance",
    description:
      "Feed parental genotypes to compute offspring distributions, with automatic phenotype aggregation and percentages.",
  },
  {
    title: "Interpret insights",
    description:
      "Layer in polygenic weights, sample outcomes, or export distributions to power downstream analytics.",
  },
];
