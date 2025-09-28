import type { MendelianProjectTool } from "../../../types/api";
import type { WorkspaceItem } from "../types";

/**
 * Helper functions for transforming data between workspace items and project tools
 */

/**
 * Convert project tools from backend to workspace items
 */
export const projectToolsToWorkspaceItems = (
  tools: MendelianProjectTool[]
): WorkspaceItem[] => {
  return tools.map((tool) => ({
    id: tool.id,
    // Normalize backend tool types to frontend workspace types
    type: (tool.type === "mendelian"
      ? "mendelian-study"
      : tool.type) as WorkspaceItem["type"],
    position: tool.position || { x: 100, y: 100 },
    data: {
      name: tool.name,
      // For mendelian-study items, extract data from trait_configurations
      ...(tool.type === "mendelian-study" && tool.trait_configurations?.general
        ? {
            selectedTrait: tool.trait_configurations.general.selectedTrait,
            parent1Genotype: tool.trait_configurations.general.parent1Genotype,
            parent2Genotype: tool.trait_configurations.general.parent2Genotype,
            asPercentages:
              tool.trait_configurations.general.asPercentages === "true",
            // Use simulation results directly without reconstruction
            simulationResults: tool.simulation_results || null,
            // Reconstruct selectedTraits array from saved metadata
            selectedTraits: (() => {
              try {
                const savedTraits =
                  tool.trait_configurations?.metadata?.selectedTraits;
                return savedTraits ? JSON.parse(savedTraits) : [];
              } catch {
                return [];
              }
            })(),
          }
        : {}),
      trait_configurations: tool.trait_configurations,
      simulation_results: tool.simulation_results,
      notes: tool.notes,
    },
    size: { width: 400, height: 300 },
  }));
};

/**
 * Convert workspace items to project tools for backend
 */
export const workspaceItemsToProjectTools = (
  items: WorkspaceItem[]
): MendelianProjectTool[] => {
  return items
    .filter((item) => item.type === "mendelian-study")
    .map((item) => ({
      id: item.id,
      type: item.type,
      name: item.data.name || "Mendelian Study",
      // Store trait configurations including the full selectedTraits array
      trait_configurations: {
        general: {
          selectedTrait: item.data.selectedTrait || "",
          parent1Genotype: item.data.parent1Genotype || "",
          parent2Genotype: item.data.parent2Genotype || "",
          asPercentages: item.data.asPercentages ? "true" : "false",
        },
        // Store the selectedTraits array as JSON string in a nested object
        metadata: {
          selectedTraits: item.data.selectedTraits
            ? JSON.stringify(item.data.selectedTraits)
            : "[]",
        },
      },
      simulation_results:
        item.data.simulationResults ||
        item.data.simulation_results ||
        undefined,
      notes: item.data.notes || "",
      position: item.position,
    }));
};

/**
 * Merge backend items with local items, preserving local-only items
 */
export const mergeBackendAndLocalItems = (
  backendItems: WorkspaceItem[],
  localItems: WorkspaceItem[]
): WorkspaceItem[] => {
  // Get local-only items (items not saved to backend)
  const localOnlyItems = localItems.filter(
    (item) =>
      item.type !== "mendelian-study" &&
      item.type !== "note" &&
      !backendItems.some((newItem) => newItem.id === item.id) // And items not in the new backend data
  );

  return [...backendItems, ...localOnlyItems];
};

/**
 * Filter items to get only local-only items (not saved to backend)
 */
export const getLocalOnlyItems = (items: WorkspaceItem[]): WorkspaceItem[] => {
  return items.filter((item) => item.type !== "mendelian-study");
};
