import React from "react";
import {
  CubeIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { WorkspaceItem } from "./types";

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
  handleZoomOut: () => void;
  handleZoomIn: () => void;
  handleZoomReset: () => void;
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
  handleZoomOut,
  handleZoomIn,
  handleZoomReset,
  handleCanvasClick,
  handleMouseMove,
  handleCanvasPanMove,
  handleMouseUp,
  handleCanvasMouseDown,
  renderWorkspaceItem,
}) => {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Top-center zoom controls removed - bottom-right controls used instead */}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className={`w-full h-full relative ${
            selectedTool
              ? "cursor-crosshair"
              : isPanning
              ? "cursor-grabbing"
              : "cursor-grab"
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
              width: "100%",
              height: "100%",
              minWidth: "1200px",
              minHeight: "800px",
            }}
            className="relative"
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
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
          </div>{" "}
          {/* Close zoomable container */}
          {/* Empty State - outside zoomable container for proper positioning */}
          {items.length === 0 && (
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
                    💡 Tip: Drag to pan around • Ctrl+scroll to zoom • Use zoom
                    controls (bottom-right)
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
