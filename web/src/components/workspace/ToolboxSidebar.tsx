import React from "react";
import { toolboxItems } from "./config";
import {
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface ToolboxSidebarProps {
  isToolsCollapsed: boolean;
  setIsToolsCollapsed: (collapsed: boolean) => void;
  selectedTool: string | null;
  setSelectedTool: (tool: string | null) => void;
  showMendelianModal: boolean;
  setShowMendelianModal: (show: boolean) => void;
  clearCanvasDrawings?: () => void;
}

const ToolboxSidebar: React.FC<ToolboxSidebarProps> = ({
  isToolsCollapsed,
  setIsToolsCollapsed,
  selectedTool,
  setSelectedTool,
  showMendelianModal,
  setShowMendelianModal,
  clearCanvasDrawings,
}) => {
  return (
    <div
      className={`${
        isToolsCollapsed ? "w-12" : "w-64"
      } bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden transition-all duration-300`}
    >
      {/* Collapse/Expand Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isToolsCollapsed && <h3 className="font-semibold">Tools</h3>}
        <button
          onClick={() => setIsToolsCollapsed(!isToolsCollapsed)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isToolsCollapsed ? "Expand Tools" : "Collapse Tools"}
        >
          {isToolsCollapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {!isToolsCollapsed ? (
        <div className="p-4 overflow-y-auto">
          <div className="space-y-2">
            {toolboxItems
              .filter(
                (tool) =>
                  !["mendelian-study", "punnett-square"].includes(tool.type)
              )
              .map((tool) => (
                <button
                  key={tool.id}
                  onClick={() =>
                    setSelectedTool(selectedTool === tool.id ? null : tool.id)
                  }
                  className={`w-full flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedTool === tool.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 ${tool.color} rounded flex items-center justify-center mr-3`}
                  >
                    <tool.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{tool.label}</span>
                </button>
              ))}
          </div>

          {/* Mendelian Genetics Section */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="font-semibold mb-3 text-indigo-700">
              Mendelian Genetics
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => setShowMendelianModal(true)}
                className={`w-full flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
                  showMendelianModal
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center mr-3">
                  <AcademicCapIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">Inheritance Study</span>
              </button>

              <button
                onClick={() =>
                  setSelectedTool(
                    selectedTool === "punnett-square" ? null : "punnett-square"
                  )
                }
                className={`w-full flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedTool === "punnett-square"
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center mr-3">
                  <AcademicCapIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">Punnett Square</span>
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="font-medium text-sm text-gray-700 mb-2">
              Instructions
            </h4>
            <p className="text-xs text-gray-500">
              {selectedTool
                ? `Click on the canvas to add a ${
                    toolboxItems.find((t) => t.id === selectedTool)?.label
                  }`
                : "Select a tool from above, then click on the canvas to add it to your workspace."}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-2 overflow-y-auto">
          <div className="space-y-2">
            {/* Regular Tools */}
            {toolboxItems
              .filter(
                (tool) =>
                  !["mendelian-study", "punnett-square"].includes(tool.type)
              )
              .map((tool) => (
                <button
                  key={tool.id}
                  onClick={() =>
                    setSelectedTool(selectedTool === tool.id ? null : tool.id)
                  }
                  className={`w-8 h-8 ${
                    tool.color
                  } rounded flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${
                    selectedTool === tool.id
                      ? "ring-2 ring-blue-500 ring-offset-1"
                      : ""
                  }`}
                  title={tool.label}
                >
                  <tool.icon className="h-4 w-4 text-white" />
                </button>
              ))}

            {/* Divider */}
            <div className="h-px bg-gray-200 my-2"></div>

            {/* Mendelian Genetics Tools */}
            <button
              onClick={() => setShowMendelianModal(true)}
              className={`w-8 h-8 bg-indigo-500 rounded flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${
                showMendelianModal ? "ring-2 ring-indigo-500 ring-offset-1" : ""
              }`}
              title="Inheritance Study"
            >
              <AcademicCapIcon className="h-4 w-4 text-white" />
            </button>

            <button
              onClick={() =>
                setSelectedTool(
                  selectedTool === "punnett-square" ? null : "punnett-square"
                )
              }
              className={`w-8 h-8 bg-pink-500 rounded flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${
                selectedTool === "punnett-square"
                  ? "ring-2 ring-pink-500 ring-offset-1"
                  : ""
              }`}
              title="Punnett Square"
            >
              <AcademicCapIcon className="h-4 w-4 text-white" />
            </button>

            {/* Divider */}
            <div className="h-px bg-gray-200 my-2"></div>

            {/* Canvas Drawing Actions */}
            {clearCanvasDrawings && (
              <button
                onClick={clearCanvasDrawings}
                className="w-8 h-8 bg-red-500 rounded flex items-center justify-center transition-all cursor-pointer hover:scale-110"
                title="Clear All Drawings"
              >
                <TrashIcon className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolboxSidebar;
