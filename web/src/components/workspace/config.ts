// Toolbox configuration for workspace components
import {
  CubeIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import type { ToolboxItem } from "./types";
import { getDefaultSize, getDefaultData } from "./utils";

export const toolboxItems: ToolboxItem[] = [
  {
    id: "sequence",
    type: "sequence",
    label: "DNA Sequence",
    icon: CubeIcon,
    color: "bg-blue-500",
  },
  {
    id: "variant",
    type: "variant",
    label: "Variant",
    icon: BeakerIcon,
    color: "bg-green-500",
  },
  {
    id: "analysis",
    type: "analysis",
    label: "Analysis",
    icon: ChartBarIcon,
    color: "bg-purple-500",
  },
  {
    id: "chart",
    type: "chart",
    label: "Chart",
    icon: ChartBarIcon,
    color: "bg-orange-500",
  },
  {
    id: "note",
    type: "note",
    label: "Note",
    icon: DocumentTextIcon,
    color: "bg-yellow-500",
  },
  {
    id: "mendelian-study",
    type: "mendelian-study",
    label: "Mendelian Study",
    icon: AcademicCapIcon,
    color: "bg-indigo-500",
  },
  {
    id: "punnett-square",
    type: "punnett-square",
    label: "Punnett Square",
    icon: AcademicCapIcon,
    color: "bg-pink-500",
  },
  {
    id: "drawing",
    type: "drawing",
    label: "Drawing",
    icon: PencilIcon,
    color: "bg-red-500",
  },
  // Text area removed from toolbox - feature deprecated/hidden
  // {
  //   id: "text-area",
  //   type: "text-area",
  //   label: "Text Area",
  //   icon: ChatBubbleLeftEllipsisIcon,
  //   color: "bg-cyan-500",
  // },
];

// Re-export utility functions for convenience
export { getDefaultSize, getDefaultData };
