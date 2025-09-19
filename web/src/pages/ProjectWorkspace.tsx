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

  // Editable project details
  const [projectName, setProjectName] = useState(
    projectId === "new" ? "New Project" : `Project ${projectId}`
  );
  const [projectDescription, setProjectDescription] =
    useState("Genomics Workspace");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

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

  // Sample existing projects for the sidebar
  const existingProjects = [
    {
      id: 1,
      name: "Alzheimer's Disease Study",
      color: "bg-blue-500",
      icon: CubeIcon,
      type: "Neurodegenerative",
      lastUpdated: "2 hours ago",
    },
    {
      id: 2,
      name: "Cancer Genomics Panel",
      color: "bg-red-500",
      icon: BeakerIcon,
      type: "Oncology",
      lastUpdated: "1 day ago",
    },
    {
      id: 3,
      name: "Cardiovascular Risk",
      color: "bg-green-500",
      icon: ChartBarIcon,
      type: "Cardiovascular",
      lastUpdated: "3 days ago",
    },
    {
      id: 4,
      name: "Pharmacogenomics",
      color: "bg-purple-500",
      icon: BeakerIcon,
      type: "Pharmacogenomics",
      lastUpdated: "6 hours ago",
    },
    {
      id: 5,
      name: "Rare Disease Exome",
      color: "bg-orange-500",
      icon: CubeIcon,
      type: "Rare Disease",
      lastUpdated: "5 days ago",
    },
    {
      id: 6,
      name: "Population Genomics",
      color: "bg-indigo-500",
      icon: ChartBarIcon,
      type: "Population",
      lastUpdated: "1 week ago",
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
    const commonClasses = `absolute bg-white rounded-lg shadow-md border border-gray-200 cursor-move overflow-hidden ${
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
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/portal/projects")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              {isEditingName ? (
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingName(false);
                    if (e.key === "Escape") {
                      setProjectName(
                        projectId === "new"
                          ? "New Project"
                          : `Project ${projectId}`
                      );
                      setIsEditingName(false);
                    }
                  }}
                  autoFocus
                  className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
                />
              ) : (
                <h1
                  className="text-xl font-semibold cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
                  onClick={() => setIsEditingName(true)}
                >
                  {projectName}
                </h1>
              )}

              {isEditingDescription ? (
                <input
                  type="text"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  onBlur={() => setIsEditingDescription(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingDescription(false);
                    if (e.key === "Escape") {
                      setProjectDescription("Genomics Workspace");
                      setIsEditingDescription(false);
                    }
                  }}
                  autoFocus
                  className="text-gray-500 text-sm bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
                />
              ) : (
                <p
                  className="text-gray-500 text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {projectDescription}
                </p>
              )}
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
          <div className="w-64 bg-white border-r border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
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
                  <div className="text-center max-w-md">
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
                    </p>

                    {/* Quick Action Buttons */}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Existing Projects */}
          <div className="w-64 bg-white border-l border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
            <h3 className="font-semibold mb-4">Existing Projects</h3>
            <div className="space-y-3">
              {existingProjects
                .filter((project) => project.id.toString() !== projectId)
                .map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/portal/workspace/${project.id}`)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 ${project.color} rounded flex items-center justify-center flex-shrink-0`}
                      >
                        <project.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {project.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {project.type}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {project.lastUpdated}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate("/portal/projects")}
                className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Projects →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
