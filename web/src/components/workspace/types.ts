// Types for workspace components
import React from "react";

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
    | "hand"; // virtual tool for panning
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}
