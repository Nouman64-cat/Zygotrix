import React from "react";
import {
  CubeIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { WorkspaceItem } from "./types";

import type { CanvasDrawing, LineDrawing } from "./helpers/localStorageHelpers";

interface CanvasAreaProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  selectedTool: string | null;
  isPanning: boolean;
  panOffset: { x: number; y: number };
  zoom: number;
  items: WorkspaceItem[];
  isDrawingTextArea: boolean;
  textAreaStart: { x: number; y: number };
  textAreaEnd: { x: number; y: number };
  canvasDrawings: CanvasDrawing[];
  currentCanvasPath: CanvasDrawing | null;
  lineDrawings: LineDrawing[];
  isDrawingLine: boolean;
  lineStartPoint: { x: number; y: number };
  lineEndPoint: { x: number; y: number };
  isEraserMode?: boolean;
  isLineEraserMode?: boolean;
  handleZoomOut: () => void;
  handleZoomIn: () => void;
  handleZoomReset: () => void;
  handleCenterView?: () => void;
  handleCanvasClick: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleCanvasPanMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  renderWorkspaceItem: (item: WorkspaceItem) => React.ReactNode;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({
  canvasRef,
  selectedTool,
  isPanning,
  panOffset,
  zoom,
  items,
  isDrawingTextArea,
  textAreaStart,
  textAreaEnd,
  canvasDrawings,
  currentCanvasPath,
  lineDrawings,
  isDrawingLine,
  lineStartPoint,
  lineEndPoint,
  isEraserMode,
  isLineEraserMode,
  handleZoomOut,
  handleZoomIn,
  handleZoomReset,
  handleCenterView,
  handleCanvasClick,
  handleMouseMove,
  handleCanvasPanMove,
  handleMouseUp,
  handleCanvasMouseDown,
  renderWorkspaceItem,
}) => {
  console.log(
    "CanvasArea received lineDrawings:",
    lineDrawings,
    "isDrawingLine:",
    isDrawingLine
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Top-center zoom controls removed - bottom-right controls used instead */}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className={`w-full h-full relative ${
            // Eraser handled via inline custom cursor
            selectedTool === "drawing" && isEraserMode
              ? ""
              : // If a tool is selected (not hand), show crosshair for placement
              selectedTool
              ? selectedTool === "hand"
                ? isPanning
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-crosshair"
              : // No tool selected -> move/select mode -> simple arrow; show grabbing while panning
              isPanning
              ? "cursor-grabbing"
              : "cursor-default"
          }`}
          onClick={handleCanvasClick}
          onMouseMove={(e) => {
            handleMouseMove(e);
            handleCanvasPanMove(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseDown={handleCanvasMouseDown}
          style={{
            minHeight: "calc(100vh - 200px)",
            touchAction: "none", // Disable touch gestures
            cursor:
              selectedTool === "drawing" && isEraserMode
                ? "url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'><rect x='2' y='6' width='16' height='8' rx='2' fill='%23ff69b4' stroke='%23000' stroke-width='1'/><rect x='4' y='8' width='12' height='4' rx='1' fill='%23ffffff'/></svg>\") 10 10, auto"
                : selectedTool === "line" && isLineEraserMode
                ? "url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'><circle cx='10' cy='10' r='8' fill='%23ff4444' stroke='%23000' stroke-width='2'/><path d='M6 6 l8 8 M14 6 l-8 8' stroke='%23fff' stroke-width='2' stroke-linecap='round'/></svg>\") 10 10, auto"
                : undefined,
          }}
          onWheel={(e) => {
            // Fallback React handler in case native listener doesn't work
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {/* Zoomable and pannable container */}
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: "10000px",
              height: "10000px",
              position: "relative",
            }}
            className="relative"
          >
            {/* Grid Background */}
            <div
              className="absolute"
              style={{
                left: "-5000px",
                top: "-5000px",
                width: "20000px",
                height: "20000px",
                backgroundImage: `repeating-radial-gradient(circle at 10px 10px, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 2px, transparent 2px, transparent 20px)`,
                backgroundSize: "20px 20px",
                opacity: 0.9,
              }}
            />

            {/* Workspace Items */}
            {items.map(renderWorkspaceItem)}

            {/* Text Area Drawing Preview */}
            {isDrawingTextArea && (
              <div
                className="absolute border-2 border-dashed border-cyan-500 bg-cyan-50 bg-opacity-50 pointer-events-none"
                style={{
                  left: Math.min(textAreaStart.x, textAreaEnd.x),
                  top: Math.min(textAreaStart.y, textAreaEnd.y),
                  width: Math.abs(textAreaEnd.x - textAreaStart.x),
                  height: Math.abs(textAreaEnd.y - textAreaStart.y),
                }}
              >
                <div className="flex items-center justify-center h-full text-cyan-600 text-sm font-medium">
                  Text Area
                </div>
              </div>
            )}

            {/* Canvas Drawing SVG Overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                width: "100%",
                height: "100%",
                minWidth: "1200px",
                minHeight: "800px",
              }}
            >
              {/* SVG marker definition for arrowheads */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                </marker>
              </defs>
              {/* Render saved canvas drawings */}
              {canvasDrawings.map((drawing) => {
                const pathString =
                  drawing.points.length < 2
                    ? ""
                    : `M ${drawing.points[0].x} ${
                        drawing.points[0].y
                      } ${drawing.points
                        .slice(1)
                        .map(
                          (point: { x: number; y: number }) =>
                            `L ${point.x} ${point.y}`
                        )
                        .join(" ")}`;

                return (
                  <path
                    key={drawing.id}
                    d={pathString}
                    stroke={drawing.strokeColor}
                    strokeWidth={drawing.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {/* Render current drawing path */}
              {currentCanvasPath && currentCanvasPath.points.length > 1 && (
                <path
                  d={`M ${currentCanvasPath.points[0].x} ${
                    currentCanvasPath.points[0].y
                  } ${currentCanvasPath.points
                    .slice(1)
                    .map(
                      (point: { x: number; y: number }) =>
                        `L ${point.x} ${point.y}`
                    )
                    .join(" ")}`}
                  stroke={currentCanvasPath.strokeColor}
                  strokeWidth={currentCanvasPath.strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Render saved line drawings */}
              {lineDrawings.map((line) => (
                <line
                  key={line.id}
                  x1={line.startPoint.x}
                  y1={line.startPoint.y}
                  x2={line.endPoint.x}
                  y2={line.endPoint.y}
                  stroke={line.strokeColor}
                  strokeWidth={line.strokeWidth}
                  strokeLinecap="round"
                  markerEnd={
                    line.arrowType === "end" ? "url(#arrowhead)" : undefined
                  }
                  style={{ color: line.strokeColor }}
                />
              ))}

              {/* Render current line being drawn */}
              {isDrawingLine && (
                <line
                  x1={lineStartPoint.x}
                  y1={lineStartPoint.y}
                  x2={lineEndPoint.x}
                  y2={lineEndPoint.y}
                  stroke="#666"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="5,5"
                  opacity={0.7}
                />
              )}
            </svg>
          </div>{" "}
          {/* Close zoomable container */}
          {/* Empty State - outside zoomable container for proper positioning */}
          {items.length === 0 &&
            !currentCanvasPath &&
            canvasDrawings.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center max-w-md pointer-events-auto">
                  {/* Animated Icon Container */}
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <CubeIcon className="h-12 w-12 text-blue-500" />
                    </div>
                    {/* Floating Icons */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                      <BeakerIcon className="h-4 w-4 text-green-500" />
                    </div>
                    <div
                      className="absolute -bottom-2 -left-2 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <ChartBarIcon className="h-4 w-4 text-orange-500" />
                    </div>
                    <div
                      className="absolute top-1/2 -right-6 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    >
                      <DocumentTextIcon className="h-3 w-3 text-purple-500" />
                    </div>
                  </div>

                  {/* Improved Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Start Building Your Project
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Create your genomics workspace by selecting tools from the
                    left panel and placing them anywhere on this canvas.
                    <br />
                    <span className="text-sm text-gray-500 mt-2 block">
                      💡 Tip: Drag to pan around • Ctrl+scroll to zoom • Use
                      zoom controls (bottom-right)
                    </span>
                  </p>

                  {/* Quick Action Buttons */}
                </div>
              </div>
            )}
          {/* Bottom-right magnification controls */}
          <div className="absolute bottom-4 right-4 z-30 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Zoom Out"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>

            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-xs bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>

            {handleCenterView && (
              <button
                onClick={handleCenterView}
                className="px-2 py-1 text-xs bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                title="Center View"
              >
                Center
              </button>
            )}

            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Zoom In"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
