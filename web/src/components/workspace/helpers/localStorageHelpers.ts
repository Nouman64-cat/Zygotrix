import type { WorkspaceItem } from "../types";

/**
 * Helper functions for managing local storage of workspace items
 */

/**
 * Generate the localStorage key for a project's local items
 */
export const getLocalItemsKey = (projectId: string): string => {
  return `zygotrix_local_items_${projectId}`;
};

/**
 * Save local workspace items to localStorage
 */
export const saveLocalItems = (
  projectId: string,
  localItems: WorkspaceItem[]
): void => {
  if (projectId && projectId !== "new") {
    try {
      localStorage.setItem(
        getLocalItemsKey(projectId),
        JSON.stringify(localItems)
      );
    } catch (error) {
      console.warn("Failed to save local items to localStorage:", error);
    }
  }
};

/**
 * Load local workspace items from localStorage
 */
export const loadLocalItems = (projectId: string): WorkspaceItem[] => {
  if (!projectId || projectId === "new") return [];

  try {
    const stored = localStorage.getItem(getLocalItemsKey(projectId));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to load local items from localStorage:", error);
    return [];
  }
};
