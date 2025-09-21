import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import MendelianWorkspaceTool from "../components/MendelianWorkspaceTool";
import PunnettSquare from "../components/PunnettSquare";
import { useProject } from "../hooks/useProjects";
import type { MendelianProjectTool } from "../types/api";
import {
  ArrowLeftIcon,
  CubeIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface WorkspaceItem {
  id: string;
  type:
    | "sequence"
    | "variant"
    | "analysis"
    | "chart"
    | "note"
    | "mendelian-study"
    | "punnett-square";
  position: { x: number; y: number };
  data: any;
  size: { width: number; height: number };
}

interface ToolboxItem {
  id: string;
  type:
    | "sequence"
    | "variant"
    | "analysis"
    | "chart"
    | "note"
    | "mendelian-study"
    | "punnett-square";
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

const ProjectWorkspace: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Use project hook to manage project state
  const { project, loading, error, saveProgress, updateProject } = useProject(
    projectId === "new" ? undefined : projectId
  );

  // Workspace state
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showMendelianTool, setShowMendelianTool] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable project details
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Initialize project data when loaded
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || "Genomics Workspace");

      // Convert project tools to workspace items
      const workspaceItems: WorkspaceItem[] = project.tools.map((tool) => ({
        id: tool.id,
        type: tool.type as WorkspaceItem["type"],
        position: tool.position || { x: 100, y: 100 },
        data: {
          name: tool.name,
          // For mendelian-study items, extract data from trait_configurations
          ...(tool.type === "mendelian-study" &&
          tool.trait_configurations?.general
            ? {
                selectedTrait: tool.trait_configurations.general.selectedTrait,
                parent1Genotype:
                  tool.trait_configurations.general.parent1Genotype,
                parent2Genotype:
                  tool.trait_configurations.general.parent2Genotype,
                asPercentages:
                  tool.trait_configurations.general.asPercentages === "true",
                simulationResults:
                  tool.simulation_results?.phenotypes ||
                  tool.simulation_results,
              }
            : {}),
          trait_configurations: tool.trait_configurations,
          simulation_results: tool.simulation_results,
          notes: tool.notes,
        },
        size: { width: 400, height: 300 },
      }));
      setItems(workspaceItems);
    }
  }, [project]); // Save project details when name or description changes
  const handleUpdateProjectDetails = useCallback(async () => {
    if (!project) return;

    try {
      await updateProject({
        name: projectName,
        description: projectDescription,
      });
    } catch (err) {
      console.error("Failed to update project details:", err);
    }
  }, [project, projectName, projectDescription, updateProject]);

  // Manual save function triggered by keyboard shortcut
  const handleManualSave = useCallback(async () => {
    if (!project || saving) return;

    try {
      setSaving(true);

      // Convert workspace items back to project tools
      const projectTools: MendelianProjectTool[] = items
        .filter((item) => item.type === "mendelian-study")
        .map((item) => ({
          id: item.id,
          type: item.type,
          name: item.data.name || "Mendelian Study",
          // Store trait configurations as nested string dictionaries
          trait_configurations: {
            general: {
              selectedTrait: item.data.selectedTrait || "",
              parent1Genotype: item.data.parent1Genotype || "",
              parent2Genotype: item.data.parent2Genotype || "",
              asPercentages: item.data.asPercentages ? "true" : "false",
            },
          },
          simulation_results:
            item.data.simulationResults || item.data.simulation_results
              ? {
                  phenotypes:
                    item.data.simulationResults || item.data.simulation_results,
                }
              : undefined,
          notes: item.data.notes || "",
          position: item.position,
        }));

      await saveProgress(projectTools);
    } catch (err) {
      console.error("Failed to save progress:", err);
    } finally {
      setSaving(false);
    }
  }, [project, items, saveProgress, saving]);

  // Keyboard shortcut for save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        handleManualSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleManualSave]);

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
        size: getDefaultSize(selectedTool),
        data: getDefaultData(selectedTool as any),
      };

      setItems((prev) => [...prev, newItem]);
      setSelectedTool(null);
    },
    [selectedTool]
  );

  const handleAddToCanvas = useCallback((itemData: any) => {
    const newItem: WorkspaceItem = {
      id: `custom-${Date.now()}`,
      type: itemData.type,
      position: { x: 100, y: 100 },
      size: getDefaultSize(itemData.type),
      data: itemData.data,
    };

    setItems((prev) => [...prev, newItem]);
    setShowMendelianTool(false);
  }, []);

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

  const getDefaultSize = (type: string) => {
    switch (type) {
      case "mendelian-study":
        return { width: 400, height: 300 };
      case "punnett-square":
        return { width: 350, height: 400 };
      case "chart":
        return { width: 300, height: 200 };
      case "analysis":
        return { width: 250, height: 180 };
      default:
        return { width: 200, height: 150 };
    }
  };

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
      case "mendelian-study":
        return {
          name: "New Mendelian Study",
          selectedTrait: "",
          parent1Genotype: "",
          parent2Genotype: "",
          simulationResults: null,
          asPercentages: true,
          notes: "",
        };
      case "punnett-square":
        return {
          parent1Genotype: "Aa",
          parent2Genotype: "Aa",
          phenotypeMap: { AA: "Dominant", Aa: "Dominant", aa: "Recessive" },
        };
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

      case "mendelian-study":
        return (
          <div
            key={item.id}
            className={`${commonClasses} border-l-4 border-l-indigo-500`}
            style={{
              left: item.position.x,
              top: item.position.y,
              width: item.size.width,
              height: item.size.height,
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <div className="p-4 h-full overflow-auto">
              <div className="flex items-center mb-3">
                <AcademicCapIcon className="h-5 w-5 text-indigo-500 mr-2" />
                <span className="font-semibold text-sm">{item.data.name}</span>
              </div>
              {item.data.selectedTrait && (
                <div className="space-y-2 text-xs">
                  <div className="bg-indigo-50 p-2 rounded">
                    <div className="font-medium">
                      Trait: {item.data.selectedTrait}
                    </div>
                    <div>
                      Parents: {item.data.parent1Genotype} ×{" "}
                      {item.data.parent2Genotype}
                    </div>
                  </div>
                  {item.data.simulationResults && (
                    <div className="space-y-1">
                      <div className="font-medium">Results:</div>
                      {Object.entries(item.data.simulationResults).map(
                        ([phenotype, prob]: [string, any]) => (
                          <div
                            key={phenotype}
                            className="flex justify-between bg-slate-50 px-2 py-1 rounded"
                          >
                            <span>{phenotype}</span>
                            <span className="font-mono">
                              {item.data.asPercentages
                                ? `${prob.toFixed(1)}%`
                                : prob.toFixed(3)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "punnett-square":
        return (
          <div
            key={item.id}
            className={`${commonClasses} border-l-4 border-l-pink-500`}
            style={{
              left: item.position.x,
              top: item.position.y,
              width: item.size.width,
              height: item.size.height,
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <div className="p-2 h-full overflow-auto">
              <div className="flex items-center mb-2">
                <AcademicCapIcon className="h-4 w-4 text-pink-500 mr-2" />
                <span className="font-semibold text-xs">Punnett Square</span>
              </div>
              <PunnettSquare
                parent1Genotype={item.data.parent1Genotype}
                parent2Genotype={item.data.parent2Genotype}
                phenotypeMap={item.data.phenotypeMap}
                className="scale-75 origin-top-left"
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

          <div className="flex items-center space-x-3">
            {/* Save indicator */}
            {saving ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CloudArrowUpIcon className="h-4 w-4 animate-pulse" />
                <span>Saving...</span>
              </div>
            ) : project ? (
              <div className="text-sm text-green-600 flex items-center space-x-1">
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>Saved</span>
              </div>
            ) : null}

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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Project"}
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

            {/* Mendelian Genetics Section */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="font-semibold mb-3 text-indigo-700">
                Mendelian Genetics
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => setShowMendelianTool(!showMendelianTool)}
                  className={`w-full flex items-center p-3 rounded-lg border transition-all ${
                    showMendelianTool
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
                      selectedTool === "punnett-square"
                        ? null
                        : "punnett-square"
                    )
                  }
                  className={`w-full flex items-center p-3 rounded-lg border transition-all ${
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
                  : showMendelianTool
                  ? "Configure your Mendelian study in the panel below, then add it to the canvas."
                  : "Select a tool from above, then click on the canvas to add it to your workspace."}
              </p>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Mendelian Tool Panel */}
            {showMendelianTool && (
              <div className="bg-white border-b border-gray-200 p-4 max-h-96 overflow-y-auto">
                <MendelianWorkspaceTool onAddToCanvas={handleAddToCanvas} />
              </div>
            )}

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
                style={{
                  minHeight: showMendelianTool
                    ? "calc(100vh - 600px)"
                    : "calc(100vh - 200px)",
                }}
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
                        Create your genomics workspace by selecting tools from
                        the left panel and placing them anywhere on this canvas.
                      </p>

                      {/* Quick Action Buttons */}
                    </div>
                  </div>
                )}
              </div>
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
