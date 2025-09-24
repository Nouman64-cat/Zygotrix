/**
 * Helper functions for coordinate transformations between canvas and screen coordinates
 */

export interface Point {
  x: number;
  y: number;
}

export interface CanvasTransformParams {
  zoom: number;
  panOffset: Point;
}

/**
 * Convert screen coordinates to canvas coordinates
 */
export const screenToCanvas = (
  screenPoint: Point,
  rect: DOMRect,
  transform: CanvasTransformParams
): Point => {
  const screenX = screenPoint.x - rect.left;
  const screenY = screenPoint.y - rect.top;
  const canvasX = (screenX - transform.panOffset.x) / transform.zoom;
  const canvasY = (screenY - transform.panOffset.y) / transform.zoom;

  return { x: canvasX, y: canvasY };
};

/**
 * Convert canvas coordinates to screen coordinates
 */
export const canvasToScreen = (
  canvasPoint: Point,
  rect: DOMRect,
  transform: CanvasTransformParams
): Point => {
  const screenX =
    canvasPoint.x * transform.zoom + transform.panOffset.x + rect.left;
  const screenY =
    canvasPoint.y * transform.zoom + transform.panOffset.y + rect.top;

  return { x: screenX, y: screenY };
};

/**
 * Get canvas coordinates from a React mouse event
 */
export const getCanvasCoordinatesFromEvent = (
  e: React.MouseEvent,
  canvasRef: React.RefObject<HTMLDivElement | null>,
  transform: CanvasTransformParams
): Point | null => {
  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return null;

  return screenToCanvas({ x: e.clientX, y: e.clientY }, rect, transform);
};

/**
 * Constrain a point to be within canvas bounds
 */
export const constrainToCanvas = (
  point: Point,
  minX: number = 0,
  minY: number = 0,
  maxX?: number,
  maxY?: number
): Point => {
  let constrainedX = Math.max(minX, point.x);
  let constrainedY = Math.max(minY, point.y);

  if (maxX !== undefined) {
    constrainedX = Math.min(maxX, constrainedX);
  }

  if (maxY !== undefined) {
    constrainedY = Math.min(maxY, constrainedY);
  }

  return { x: constrainedX, y: constrainedY };
};
