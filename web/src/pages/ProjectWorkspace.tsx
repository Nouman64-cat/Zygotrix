import React, { useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  ArrowLeftIcon,
  PlusIcon,
  CubeIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

interface WorkspaceItem {
  id: string;
  type: "sequence" | "variant" | "analysis" | "chart" | "note";
  position: { x: number; y: number };
  data: any;
  size: { width: number; height: number };
}

interface ToolboxItem {
  id: string;
  type: "sequence" | "variant" | "analysis" | "chart" | "note";
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

const ProjectWorkspace: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const toolboxItems: ToolboxItem[] = [
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
  ];

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedTool) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newItem: WorkspaceItem = {
        id: `${selectedTool}-${Date.now()}`,
        type: selectedTool as any,
        position: { x, y },
        size: { width: 200, height: 150 },
        data: getDefaultData(selectedTool as any),
      };

      setItems((prev) => [...prev, newItem]);
      setSelectedTool(null);
    },
    [selectedTool]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const offsetX = e.clientX - rect.left - item.position.x;
      const offsetY = e.clientY - rect.top - item.position.y;

      setDraggedItem(itemId);
      setDragOffset({ x: offsetX, y: offsetY });
    },
    [items]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedItem) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      setItems((prev) =>
        prev.map((item) =>
          item.id === draggedItem
            ? { ...item, position: { x: Math.max(0, x), y: Math.max(0, y) } }
            : item
        )
      );
    },
    [draggedItem, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const getDefaultData = (type: string) => {
    switch (type) {
      case "sequence":
        return { sequence: "ATCGATCGATCG", name: "Sample Sequence" };
      case "variant":
        return { position: "1:123456", ref: "A", alt: "T", gene: "SAMPLE" };
      case "analysis":
        return { name: "New Analysis", status: "ready" };
      case "chart":
        return { title: "Data Visualization", type: "bar" };
      case "note":
        return { content: "Add your notes here..." };
      default:
        return {};
    }
  };

  const renderWorkspaceItem = (item: WorkspaceItem) => {
    const commonClasses = `absolute bg-white rounded-lg shadow-md border cursor-move overflow-hidden ${
      draggedItem === item.id ? "z-50 shadow-xl" : "z-10"
    }`;

    switch (item.type) {
      case "sequence":
        return (
          <div
            key={item.id}
            className={`${commonClasses} border-l-4 border-l-blue-500`}
            style={{
              left: item.position.x,
              top: item.position.y,
              width: item.size.width,
              height: item.size.height,
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <div className="p-4">
              <div className="flex items-center mb-2">
                <CubeIcon className="h-5 w-5 text-blue-500 mr-2" />
                <span className="font-semibold text-sm">{item.data.name}</span>
              </div>
              <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                {item.data.sequence}
              </div>
            </div>
          </div>
        );

      case "variant":
        return (
          <div
            key={item.id}
            className={`${commonClasses} border-l-4 border-l-green-500`}
            style={{
              left: item.position.x,
              top: item.position.y,
              width: item.size.width,
              height: item.size.height,
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <div className="p-4">
              <div className="flex items-center mb-2">
                <BeakerIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-semibold text-sm">Variant</span>
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="font-medium">Position:</span>{" "}
                  {item.data.position}
                </div>
                <div>
                  <span className="font-medium">Change:</span> {item.data.ref} →{" "}
                  {item.data.alt}
                </div>
                <div>
                  <span className="font-medium">Gene:</span> {item.data.gene}
                </div>
              </div>
            </div>
          </div>
        );

      case "analysis":
        return (
          <div
            key={item.id}
            className={`${commonClasses} border-l-4 border-l-purple-500`}
            style={{
              left: item.position.x,
              top: item.position.y,
              width: item.size.width,
              height: item.size.height,
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <div className="p-4">
              <div className="flex items-center mb-2">
                <ChartBarIcon className="h-5 w-5 text-purple-500 mr-2" />
                <span className="font-semibold text-sm">{item.data.name}</span>
              </div>
              <div className="bg-purple-50 p-2 rounded text-xs">
                Status: {item.data.status}
              </div>
            </div>
          </div>
        );

      case "chart":
        return (
          <div
            key={item.id}
            className={`${commonClasses} border-l-4 border-l-orange-500`}
            style={{
              left: item.position.x,
              top: item.position.y,
              width: item.size.width,
              height: item.size.height,
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <div className="p-4">
              <div className="flex items-center mb-2">
                <ChartBarIcon className="h-5 w-5 text-orange-500 mr-2" />
                <span className="font-semibold text-sm">{item.data.title}</span>
              </div>
              <div className="bg-gray-100 h-16 rounded flex items-center justify-center text-xs text-gray-500">
                Chart Placeholder
              </div>
            </div>
          </div>
        );

      case "note":
        return (
          <div
            key={item.id}
            className={`${commonClasses} border-l-4 border-l-yellow-500`}
            style={{
              left: item.position.x,
              top: item.position.y,
              width: item.size.width,
              height: item.size.height,
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <div className="p-4">
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="font-semibold text-sm">Note</span>
              </div>
              <textarea
                className="w-full h-16 text-xs border-none resize-none focus:outline-none"
                defaultValue={item.data.content}
                placeholder="Add your notes..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen min-h-screen">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/portal/projects")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">
                {projectId === "new" ? "New Project" : `Project ${projectId}`}
              </h1>
              <p className="text-gray-500 text-sm">Genomics Workspace</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Save Project
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex bg-gray-50 min-h-0 overflow-hidden">
          {/* Toolbox */}
          <div className="w-64 bg-white border-r p-4 flex-shrink-0 overflow-y-auto">
            <h3 className="font-semibold mb-4">Tools</h3>
            <div className="space-y-2">
              {toolboxItems.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() =>
                    setSelectedTool(selectedTool === tool.id ? null : tool.id)
                  }
                  className={`w-full flex items-center p-3 rounded-lg border transition-all ${
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

          {/* Canvas */}
          <div className="flex-1 relative overflow-auto">
            <div
              ref={canvasRef}
              className={`w-full min-h-full relative ${
                selectedTool ? "cursor-crosshair" : "cursor-default"
              }`}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ minHeight: "calc(100vh - 200px)" }}
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

              {/* Empty State */}
              {items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <PlusIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start Building
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      Select a tool from the left panel and click anywhere on
                      the canvas to start building your genomics project.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
