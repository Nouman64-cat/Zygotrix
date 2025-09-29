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

export const PRESET_COLORS = [
  // Reds / Warm
  "bg-red-400",
  "bg-red-500",
  "bg-red-600",
  "bg-rose-400",
  "bg-rose-500",
  // Oranges / Yellows
  "bg-orange-400",
  "bg-orange-500",
  "bg-amber-400",
  "bg-amber-500",
  "bg-yellow-400",
  "bg-yellow-500",
  // Greens
  "bg-lime-400",
  "bg-lime-500",
  "bg-green-400",
  "bg-green-500",
  "bg-emerald-400",
  "bg-emerald-500",
  // Teals / Cyans
  "bg-teal-400",
  "bg-teal-500",
  "bg-cyan-400",
  "bg-cyan-500",
  // Blues
  "bg-sky-400",
  "bg-sky-500",
  "bg-blue-400",
  "bg-blue-500",
  "bg-indigo-400",
  "bg-indigo-500",
  // Purples
  "bg-violet-400",
  "bg-violet-500",
  "bg-purple-400",
  "bg-purple-500",
  "bg-fuchsia-400",
  "bg-fuchsia-500",
  // Pinks
  "bg-pink-400",
  "bg-pink-500",
  // Neutrals
  "bg-slate-400",
  "bg-slate-500",
  "bg-gray-400",
  "bg-gray-500",
  "bg-neutral-400",
  "bg-neutral-500",
  "bg-zinc-400",
  "bg-zinc-500",
];
