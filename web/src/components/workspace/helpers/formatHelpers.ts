import React from "react";
import {
  CubeIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

/**
 * Helper functions for formatting and mapping utilities
 */

export interface ProjectTypeInfo {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * Get formatted time difference from a date string
 */
export const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
};

/**
 * Get project type icon and color based on project type
 */
export const getProjectTypeIcon = (type: string): ProjectTypeInfo => {
  switch (type.toLowerCase()) {
    case "mendelian":
    case "genetics":
      return { icon: AcademicCapIcon, color: "bg-indigo-500" };
    case "genomics":
    case "sequencing":
      return { icon: CubeIcon, color: "bg-blue-500" };
    case "analysis":
      return { icon: ChartBarIcon, color: "bg-green-500" };
    case "research":
      return { icon: BeakerIcon, color: "bg-purple-500" };
    default:
      return { icon: DocumentTextIcon, color: "bg-gray-500" };
  }
};

/**
 * Format zoom percentage for display
 */
export const formatZoomPercentage = (zoom: number): string => {
  return `${Math.round(zoom * 100)}%`;
};

/**
 * Format tool count for display
 */
export const formatToolCount = (count: number): string => {
  if (count === 0) return "";
  return `${count} tool${count !== 1 ? "s" : ""}`;
};
