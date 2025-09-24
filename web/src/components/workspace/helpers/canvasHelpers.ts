import type { Point } from "./coordinateHelpers";

/**
 * Helper functions for canvas operations like zoom calculations and boundary checks
 */

export interface ZoomLimits {
  min: number;
  max: number;
}

export const DEFAULT_ZOOM_LIMITS: ZoomLimits = {
  min: 0.25,
  max: 3,
};

/**
 * Calculate new zoom level with constraints
 */
export const calculateZoom = (
  currentZoom: number,
  zoomFactor: number,
  limits: ZoomLimits = DEFAULT_ZOOM_LIMITS
): number => {
  const newZoom = currentZoom * zoomFactor;
  return Math.max(limits.min, Math.min(limits.max, newZoom));
};

/**
 * Calculate zoom in (increase by 20%)
 */
export const zoomIn = (
  currentZoom: number,
  limits: ZoomLimits = DEFAULT_ZOOM_LIMITS
): number => {
  return calculateZoom(currentZoom, 1.2, limits);
};

/**
 * Calculate zoom out (decrease by 20%)
 */
export const zoomOut = (
  currentZoom: number,
  limits: ZoomLimits = DEFAULT_ZOOM_LIMITS
): number => {
  return calculateZoom(currentZoom, 1 / 1.2, limits);
};

/**
 * Check if user has dragged beyond threshold
 */
export const hasDraggedBeyondThreshold = (
  startPoint: Point,
  currentPoint: Point,
  threshold: number = 2
): boolean => {
  const deltaX = Math.abs(currentPoint.x - startPoint.x);
  const deltaY = Math.abs(currentPoint.y - startPoint.y);
  return deltaX > threshold || deltaY > threshold;
};

/**
 * Calculate minimum size for text area
 */
export const calculateTextAreaSize = (
  startPoint: Point,
  endPoint: Point,
  minWidth: number = 50,
  minHeight: number = 30
): { x: number; y: number; width: number; height: number } => {
  const x = Math.min(startPoint.x, endPoint.x);
  const y = Math.min(startPoint.y, endPoint.y);
  const width = Math.max(Math.abs(endPoint.x - startPoint.x), minWidth);
  const height = Math.max(Math.abs(endPoint.y - startPoint.y), minHeight);

  return { x, y, width, height };
};

/**
 * Check if text area meets minimum size requirements
 */
export const isValidTextAreaSize = (
  startPoint: Point,
  endPoint: Point,
  minWidth: number = 50,
  minHeight: number = 30
): boolean => {
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);
  return width >= minWidth && height >= minHeight;
};

/**
 * Reset canvas transform to default state
 */
export const resetCanvasTransform = (): { zoom: number; panOffset: Point } => {
  return {
    zoom: 1,
    panOffset: { x: 400, y: 300 },
  };
};
