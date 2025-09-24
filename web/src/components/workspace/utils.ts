// Utility functions for workspace components

/**
 * Get default size for different workspace item types
 */
export const getDefaultSize = (type: string) => {
  switch (type) {
    case "mendelian-study":
      return { width: 400, height: 300 };
    case "punnett-square":
      return { width: 350, height: 400 };
    case "chart":
      return { width: 300, height: 200 };
    case "analysis":
      return { width: 250, height: 180 };
    case "text-area":
      return { width: 250, height: 120 };
    case "drawing":
      return { width: 400, height: 300 };
    default:
      return { width: 200, height: 150 };
  }
};

/**
 * Get default data for different workspace item types
 */
export const getDefaultData = (type: string) => {
  switch (type) {
    case "sequence":
      return { sequence: "ATCGATCGATCG", name: "Sample Sequence" };
    case "variant":
      return { position: "1:123456", ref: "A", alt: "T", gene: "SAMPLE" };
    case "analysis":
      return { name: "New Analysis", status: "ready" };
    case "chart":
      return { title: "Data Visualization", type: "bar" };
    case "note":
      return { content: "Add your notes here..." };
    case "mendelian-study":
      return {
        name: "New Mendelian Study",
        selectedTrait: "",
        parent1Genotype: "",
        parent2Genotype: "",
        simulationResults: null,
        asPercentages: true,
        notes: "",
      };
    case "punnett-square":
      return {
        parent1Genotype: "Aa",
        parent2Genotype: "Aa",
        phenotypeMap: { AA: "Dominant", Aa: "Dominant", aa: "Recessive" },
      };
    case "text-area":
      return {
        content: "Double-click to edit text",
        fontSize: 16,
        fontFamily: "Arial",
        color: "#000000",
      };
    case "drawing":
      return {
        paths: [],
        strokeColor: "#000000",
        strokeWidth: 2,
        backgroundColor: "transparent",
      };
    default:
      return {};
  }
};
