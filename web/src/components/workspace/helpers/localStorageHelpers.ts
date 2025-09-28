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

/**
 * Canvas drawing interface for storage
 */
export interface CanvasDrawing {
  id: string;
  points: { x: number; y: number }[];
  strokeColor: string;
  strokeWidth: number;
  updatedAt?: string;
  version?: number;
  isDeleted?: boolean;
  origin?: string | null;
}

/**
 * Line drawing interface for storage
 */
export interface LineDrawing {
  id: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  strokeColor: string;
  strokeWidth: number;
  arrowType: "none" | "end"; // no arrow or arrow at end
  // Local-first metadata for sync tracking (optional for legacy records)
  version?: number;
  updatedAt?: string;
  isDeleted?: boolean;
  origin?: string | null;
}

/**
 * Generate the localStorage key for a project's canvas drawings
 */
export const getCanvasDrawingsKey = (projectId: string): string => {
  return `zygotrix_canvas_drawings_${projectId}`;
};

/**
 * Save canvas drawings to localStorage
 */
export const saveCanvasDrawings = (
  projectId: string,
  drawings: CanvasDrawing[]
): void => {
  if (projectId && projectId !== "new") {
    try {
      localStorage.setItem(
        getCanvasDrawingsKey(projectId),
        JSON.stringify(drawings)
      );
    } catch (error) {
      console.warn("Failed to save canvas drawings to localStorage:", error);
    }
  }
};

/**
 * Load canvas drawings from localStorage
 */
export const loadCanvasDrawings = (projectId: string): CanvasDrawing[] => {
  if (!projectId || projectId === "new") return [];

  try {
    const stored = localStorage.getItem(getCanvasDrawingsKey(projectId));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to load canvas drawings from localStorage:", error);
    return [];
  }
};

/** Line drawing storage helpers */
export const getLineDrawingsKey = (projectId: string): string => {
  return `zygotrix_line_drawings_${projectId}`;
};

export const saveLineDrawings = (
  projectId: string,
  lines: LineDrawing[]
): void => {
  if (projectId && projectId !== "new") {
    try {
      localStorage.setItem(
        getLineDrawingsKey(projectId),
        JSON.stringify(lines)
      );
    } catch (error) {
      console.warn("Failed to save line drawings to localStorage:", error);
    }
  }
};

export const loadLineDrawings = (projectId: string): LineDrawing[] => {
  if (!projectId || projectId === "new") return [];
  try {
    const stored = localStorage.getItem(getLineDrawingsKey(projectId));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to load line drawings from localStorage:", error);
    return [];
  }
};
