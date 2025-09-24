import React from "react";
import { useNavigate } from "react-router-dom";
import ColorPicker from "../ColorPicker";
import { getTimeAgo } from "./helpers/formatHelpers";
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface WorkspaceHeaderProps {
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
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  projectId,
  project,
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  projectColor,
  isEditingName,
  setIsEditingName,
  isEditingDescription,
  setIsEditingDescription,
  saving,
  loading,
  error,
  showSettingsDropdown,
  handleUpdateProjectDetails,
  handleColorChange,
  handleManualSave,
  handleSettingsClick,
  handleDeleteClick,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/portal/projects")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex flex-col space-y-1">
          {isEditingName ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => {
                setIsEditingName(false);
                handleUpdateProjectDetails();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingName(false);
                  handleUpdateProjectDetails();
                }
                if (e.key === "Escape") {
                  setProjectName(project?.name || "New Project");
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="text-lg font-extrabold text-gray-700 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="text-lg cursor-text font-extrabold text-gray-700 hover:bg-gray-50 rounded px-1 transition-colors text-left"
              aria-label="Edit project name"
            >
              {projectName}
            </button>
          )}

          {isEditingDescription ? (
            <input
              type="text"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              onBlur={() => {
                setIsEditingDescription(false);
                handleUpdateProjectDetails();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingDescription(false);
                  handleUpdateProjectDetails();
                }
                if (e.key === "Escape") {
                  setProjectDescription(
                    project?.description || "Genomics Workspace"
                  );
                  setIsEditingDescription(false);
                }
              }}
              autoFocus
              className="text-gray-500 text-xs bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingDescription(true)}
              className="text-gray-500 text-xs hover:bg-gray-50 rounded px-1 transition-colors text-left"
              aria-label="Edit project description"
            >
              {projectDescription}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Project Color Picker */}
        {projectId !== "new" && (
          <ColorPicker
            currentColor={projectColor}
            onColorChange={handleColorChange}
          />
        )}

        {/* Save/modified indicator */}
        {saving && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <CloudArrowUpIcon className="h-4 w-4 animate-pulse" />
            <span>Saving...</span>
          </div>
        )}
        {!saving && project && (
          <div className="text-sm text-gray-600 flex items-center space-x-1">
            <CloudArrowUpIcon className="h-4 w-4" />
            <span>
              {project?.updated_at
                ? getTimeAgo(project.updated_at)
                : "Just now"}
            </span>
          </div>
        )}

        {/* Error indicator */}
        {error && (
          <div className="text-sm text-red-600 flex items-center space-x-1">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>Error</span>
          </div>
        )}

        {/* Loading indicator */}
        {loading && <div className="text-sm text-gray-500">Loading...</div>}

        <button
          onClick={handleManualSave}
          disabled={saving || !project}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Project"}
        </button>

        {/* Settings Dropdown */}
        <div className="relative">
          <button
            onClick={handleSettingsClick}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ${
              showSettingsDropdown ? "bg-gray-100" : ""
            }`}
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>

          {/* Dropdown Menu */}
          {showSettingsDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]">
              <div className="py-1">
                <button
                  onClick={handleDeleteClick}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceHeader;
