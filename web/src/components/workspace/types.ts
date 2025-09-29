// Types for workspace components
import React from "react";
import type {
  ProjectDrawingSaveSummary,
  ProjectLineSaveSummary,
  ProjectNoteSaveSummary,
} from "../../types/api";
import type { CanvasDrawing, LineDrawing } from "./helpers/localStorageHelpers";

export interface WorkspaceItem {
  id: string;
  type:
    | "sequence"
    | "variant"
    | "analysis"
    | "chart"
    | "note"
    | "mendelian-study"
    | "punnett-square"
    | "text-area"
    | "drawing";
  position: { x: number; y: number };
  data: any;
  size: { width: number; height: number };
}

export interface ToolboxItem {
  id: string;
  type:
    | "sequence"
    | "variant"
    | "analysis"
    | "chart"
    | "note"
    | "mendelian-study"
    | "punnett-square"
    | "text-area"
    | "drawing"
    | "line" // virtual tool for line drawing
    | "hand"; // virtual tool for panning
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

export interface WorkspaceHeaderProps {
  projectId: string | undefined;
  project: any;
  projectName: string;
  setProjectName: (name: string) => void;
  projectDescription: string;
  setProjectDescription: (description: string) => void;
  projectColor: string;
  isEditingName: boolean;
  setIsEditingName: (editing: boolean) => void;
  isEditingDescription: boolean;
  setIsEditingDescription: (editing: boolean) => void;
  saving: boolean;
  loading: boolean;
  error: any;
  showSettingsDropdown: boolean;
  handleUpdateProjectDetails: () => void;
  handleColorChange: (color: string) => void;
  handleManualSave: () => void;
  handleSettingsClick: () => void;
  handleDeleteClick: () => void;
  workspaceDirty: boolean;
  isOffline: boolean;
  saveSummary: {
    lines: ProjectLineSaveSummary | null;
    notes: ProjectNoteSaveSummary | null;
    drawings: ProjectDrawingSaveSummary | null;
  };
}

export interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

export interface CanvasAreaProps {
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
