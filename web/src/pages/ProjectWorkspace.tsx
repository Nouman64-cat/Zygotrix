import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import MendelianStudyModal from "../components/MendelianStudyModal";
import PunnettSquare from "../components/PunnettSquare";
import ColorPicker from "../components/ColorPicker";
import { useProject, useProjects } from "../hooks/useProjects";
import {
  deleteMendelianTool,
  updateMendelianTool,
  createMendelianTool,
  updateProject as updateProjectAPI,
} from "../services/zygotrixApi";
import type { MendelianProjectTool } from "../types/api";
import {
  ArrowLeftIcon,
  CubeIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  TrashIcon,
  PencilIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
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
  const { project, loading, error, saveProgress } = useProject(
    projectId === "new" ? undefined : projectId
  );

  // Use projects hook to get all projects for the sidebar
  const { projects: allProjects, loading: projectsLoading } = useProjects();

  // Local storage helpers for note-type items
  const getLocalItemsKey = (projId: string) => `zygotrix_local_items_${projId}`;

  const saveLocalItems = useCallback(
    (projId: string, localItems: WorkspaceItem[]) => {
      if (projId && projId !== "new") {
        try {
          localStorage.setItem(
            getLocalItemsKey(projId),
            JSON.stringify(localItems)
          );
        } catch (error) {
          console.warn("Failed to save local items to localStorage:", error);
        }
      }
    },
    []
  );

  const loadLocalItems = useCallback((projId: string): WorkspaceItem[] => {
    if (!projId || projId === "new") return [];

    try {
      const stored = localStorage.getItem(getLocalItemsKey(projId));
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to load local items from localStorage:", error);
      return [];
    }
  }, []);

  // Workspace state
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showMendelianModal, setShowMendelianModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable project details
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("bg-blue-500");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Item name editing state
  const [editingItemNameId, setEditingItemNameId] = useState<string | null>(
    null
  );
  const [editingItemName, setEditingItemName] = useState("");

  // Item editing state (for full study editing)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  // Sidebar collapse state
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(true);
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(true);

  // Canvas zoom state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  // Initialize project data when loaded
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || "Genomics Workspace");
      setProjectColor(project.color || "bg-blue-500");

      // Convert project tools to workspace items
      const workspaceItems: WorkspaceItem[] = project.tools.map((tool) => ({
        id: tool.id,
        // Normalize backend tool types to frontend workspace types
        type: (tool.type === "mendelian"
          ? "mendelian-study"
          : tool.type) as WorkspaceItem["type"],
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
                // Use simulation results directly without reconstruction
                simulationResults: tool.simulation_results || null,
                // Reconstruct selectedTraits array from saved metadata
                selectedTraits: (() => {
                  try {
                    const savedTraits =
                      tool.trait_configurations?.metadata?.selectedTraits;
                    return savedTraits ? JSON.parse(savedTraits) : [];
                  } catch {
                    return [];
                  }
                })(),
              }
            : {}),
          trait_configurations: tool.trait_configurations,
          simulation_results: tool.simulation_results,
          notes: tool.notes,
        },
        size: { width: 400, height: 300 },
      }));

      // Preserve any existing local-only items (like note-type items) and merge with backend items
      setItems((prevItems) => {
        // Load persisted local items from localStorage
        const persistedLocalItems = projectId ? loadLocalItems(projectId) : [];

        // Get local-only items from current state (items not saved to backend)
        const currentLocalOnlyItems = prevItems.filter(
          (item) =>
            item.type !== "mendelian-study" && // Keep non-mendelian items (like notes)
            !workspaceItems.some((newItem) => newItem.id === item.id) // And items not in the new backend data
        );

        // Merge backend items with both persisted and current local items
        // Remove duplicates by keeping the most recent version (current over persisted)
        const allLocalItems = [...persistedLocalItems];
        currentLocalOnlyItems.forEach((currentItem) => {
          const existingIndex = allLocalItems.findIndex(
            (item) => item.id === currentItem.id
          );
          if (existingIndex >= 0) {
            allLocalItems[existingIndex] = currentItem; // Update with current version
          } else {
            allLocalItems.push(currentItem); // Add new item
          }
        });

        return [...workspaceItems, ...allLocalItems];
      });
    }
  }, [project, projectId, loadLocalItems]);

  // Persist local-only items to localStorage whenever items change
  useEffect(() => {
    if (projectId && projectId !== "new" && items.length > 0) {
      const localOnlyItems = items.filter(
        (item) => item.type !== "mendelian-study"
      );
      saveLocalItems(projectId, localOnlyItems);
    }
  }, [items, projectId, saveLocalItems]);

  // Save project details when name or description changes
  const handleUpdateProjectDetails = useCallback(async () => {
    if (!project || projectId === "new") return;

    try {
      await updateProjectAPI(projectId!, {
        name: projectName,
        description: projectDescription,
        color: projectColor,
      });
    } catch (err) {
      console.error("Failed to update project details:", err);
    }
  }, [project, projectId, projectName, projectDescription, projectColor]);

  // Color change handler
  const handleColorChange = useCallback(
    async (newColor: string) => {
      if (!project || projectId === "new") return;

      setProjectColor(newColor);

      try {
        await updateProjectAPI(projectId!, {
          color: newColor,
        });
      } catch (err) {
        console.error("Failed to update project color:", err);
        // Revert color on error
        setProjectColor(project.color || "bg-blue-500");
      }
    },
    [project, projectId]
  );

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
          // Store trait configurations including the full selectedTraits array
          trait_configurations: {
            general: {
              selectedTrait: item.data.selectedTrait || "",
              parent1Genotype: item.data.parent1Genotype || "",
              parent2Genotype: item.data.parent2Genotype || "",
              asPercentages: item.data.asPercentages ? "true" : "false",
            },
            // Store the selectedTraits array as JSON string in a nested object
            metadata: {
              selectedTraits: item.data.selectedTraits
                ? JSON.stringify(item.data.selectedTraits)
                : "[]",
            },
          },
          simulation_results:
            item.data.simulationResults ||
            item.data.simulation_results ||
            undefined,
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

  // Helper function to get formatted time difference
  const getTimeAgo = (dateString: string) => {
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

  // Helper function to get project type icon and color
  const getProjectTypeIcon = (type: string) => {
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

  // Process real projects for the sidebar
  const existingProjects = allProjects
    .filter((proj) => proj.id !== projectId) // Exclude current project
    .slice(0, 6) // Show only first 6 projects
    .map((proj) => {
      const typeInfo = getProjectTypeIcon(proj.type);
      return {
        id: proj.id || "",
        name: proj.name,
        color: proj.color || typeInfo.color, // Use project color if available, fallback to type color
        icon: typeInfo.icon,
        type: proj.type || "Unknown",
        lastUpdated: proj.updated_at ? getTimeAgo(proj.updated_at) : "Unknown",
        toolCount: proj.tools?.length || 0,
      };
    });

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't place tools if user was dragging or no tool selected
      if (!selectedTool || hasDragged) {
        setHasDragged(false); // Reset drag state
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Convert screen coordinates to canvas coordinates accounting for zoom and pan
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasX = (screenX - panOffset.x) / zoom;
      const canvasY = (screenY - panOffset.y) / zoom;

      const newItem: WorkspaceItem = {
        id: `${selectedTool}-${Date.now()}`,
        type: selectedTool as any,
        position: { x: Math.max(0, canvasX), y: Math.max(0, canvasY) },
        size: getDefaultSize(selectedTool),
        data: getDefaultData(selectedTool as any),
      };

      setItems((prev) => [...prev, newItem]);
      setSelectedTool(null);
    },
    [selectedTool, zoom, panOffset, hasDragged]
  );

  const handleAddToCanvas = useCallback(
    async (itemData: any) => {
      const newItem: WorkspaceItem = {
        id: `custom-${Date.now()}`,
        type: itemData.type,
        position: { x: 100, y: 100 },
        size: getDefaultSize(itemData.type),
        data: itemData.content || itemData.data || itemData,
      };

      // Save to backend if in a real project
      if (projectId && projectId !== "new") {
        try {
          const toolData = {
            name: newItem.data.name || "New Mendelian Study",
            trait_configurations:
              newItem.data.selectedTraits?.reduce((acc: any, trait: any) => {
                acc[trait.key] = {
                  parent1_genotype: trait.parent1Genotype,
                  parent2_genotype: trait.parent2Genotype,
                };
                return acc;
              }, {}) || {},
            simulation_results: newItem.data.simulationResults || null,
            notes: newItem.data.notes || "",
            position: newItem.position,
          };

          const result = await createMendelianTool(projectId, toolData);
          // Update the item with the backend-generated ID
          newItem.id = result.tool.id;
          newItem.data = { ...newItem.data, ...result.tool };
        } catch (error) {
          console.error("Failed to save tool to backend:", error);
          // Continue with local state even if backend save fails
        }
      }

      setItems((prev) => [...prev, newItem]);
      setShowMendelianModal(false);
    },
    [projectId]
  );

  // Handle note text changes
  const handleNoteChange = useCallback(
    async (itemId: string, noteText: string) => {
      // Update local state immediately
      setItems((prev) => {
        const updatedItems = prev.map((item) =>
          item.id === itemId
            ? { ...item, data: { ...item.data, content: noteText } }
            : item
        );

        // Save to backend only for mendelian-study type items in a real project
        if (projectId && projectId !== "new") {
          const item = prev.find((i) => i.id === itemId);
          if (item && item.type === "mendelian-study") {
            // Use setTimeout to avoid blocking the UI update
            setTimeout(async () => {
              try {
                await updateMendelianTool(projectId, itemId, {
                  notes: noteText,
                });
              } catch (error) {
                console.error("Failed to save note to backend:", error);
              }
            }, 0);
          }
          // Note: pure "note" type items are not saved to backend - they're local only
        }

        return updatedItems;
      });
    },
    [projectId]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      // Convert screen coordinates to canvas coordinates
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasX = (screenX - panOffset.x) / zoom;
      const canvasY = (screenY - panOffset.y) / zoom;

      const offsetX = canvasX - item.position.x;
      const offsetY = canvasY - item.position.y;

      setDraggedItem(itemId);
      setDragOffset({ x: offsetX, y: offsetY });
    },
    [items, zoom, panOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedItem) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Convert screen coordinates to canvas coordinates
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasX = (screenX - panOffset.x) / zoom;
      const canvasY = (screenY - panOffset.y) / zoom;

      const x = canvasX - dragOffset.x;
      const y = canvasY - dragOffset.y;

      setItems((prev) =>
        prev.map((item) =>
          item.id === draggedItem
            ? { ...item, position: { x: Math.max(0, x), y: Math.max(0, y) } }
            : item
        )
      );
    },
    [draggedItem, dragOffset, zoom, panOffset]
  );

  const handleMouseUp = useCallback(() => {
    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
    setIsPanning(false);
    // Don't reset hasDragged here - let handleCanvasClick handle it
  }, []);

  // Handle canvas zoom
  const handleZoomIn = useCallback(() => {
    setZoom((prevZoom) => Math.min(prevZoom * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prevZoom) => Math.max(prevZoom / 1.2, 0.25));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      setZoom((prevZoom) => Math.max(0.25, Math.min(3, prevZoom * zoomFactor)));
    }
  }, []);

  // Handle pan start
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Allow panning with left mouse when no tool is selected, or middle mouse/Alt+click anytime
      if (
        (e.button === 0 && !selectedTool) || // Left click when no tool selected
        e.button === 1 || // Middle mouse button
        (e.button === 0 && e.altKey) // Alt+Left click
      ) {
        e.preventDefault();
        setIsPanning(true);
        setHasDragged(false); // Reset drag state
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [selectedTool]
  );

  // Handle panning
  const handleCanvasPanMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;

        // If there's any movement, mark as dragged
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          setHasDragged(true);
        }

        setPanOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, lastPanPoint]
  );

  // Handle item name editing
  const handleNameClick = useCallback(
    (e: React.MouseEvent, item: WorkspaceItem) => {
      e.stopPropagation();
      setEditingItemNameId(item.id);
      setEditingItemName(item.data?.name || "");
    },
    []
  );

  const handleNameSave = useCallback(
    async (itemId: string, newName: string) => {
      // Find the item to get its data for API call
      const item = items.find((i) => i.id === itemId);
      if (!item || item.type !== "mendelian-study") return;

      try {
        if (projectId && projectId !== "new") {
          // Call backend API to update the tool name
          await updateMendelianTool(projectId, itemId, { name: newName });
        }

        // Update local state
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, data: { ...item.data, name: newName } }
              : item
          )
        );
      } catch (error) {
        console.error("Failed to update Mendelian study name:", error);
        // You could add a toast notification here
      }

      setEditingItemNameId(null);
      setEditingItemName("");
    },
    [items, projectId]
  );

  const handleNameCancel = useCallback(() => {
    setEditingItemNameId(null);
    setEditingItemName("");
  }, []);

  // Handle item deletion
  const handleDeleteItem = useCallback(
    async (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();

      // Find the item to get its data for API call
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      try {
        // Only call backend API for mendelian-study items
        if (
          item.type === "mendelian-study" &&
          projectId &&
          projectId !== "new"
        ) {
          await deleteMendelianTool(projectId, itemId);
        }

        // Remove from local state (works for all item types)
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      } catch (error) {
        console.error("Failed to delete item:", error);
        // You could add a toast notification here
      }
    },
    [items, projectId]
  );

  // Handle item editing
  const handleEditItem = useCallback(
    (e: React.MouseEvent, item: WorkspaceItem) => {
      e.stopPropagation();

      if (item.type !== "mendelian-study") return;

      // Set up editing state with the current item's data
      setEditingItemId(item.id);
      setEditingItemData(item.data);
      setShowMendelianModal(true);
    },
    []
  );

  // Handle updating an existing item after editing
  const handleUpdateItem = useCallback(
    async (itemData: any) => {
      if (!editingItemId) return;

      // Extract the actual project data from the modal's itemData structure
      const updatedData = itemData.content || itemData.data || itemData;

      try {
        if (projectId && projectId !== "new") {
          // Call backend API to update the tool
          await updateMendelianTool(projectId, editingItemId, {
            name: updatedData.name,
            trait_configurations:
              updatedData.selectedTraits?.reduce((acc: any, trait: any) => {
                acc[trait.key] = {
                  parent1_genotype: trait.parent1Genotype,
                  parent2_genotype: trait.parent2Genotype,
                };
                return acc;
              }, {}) || {},
            simulation_results: updatedData.simulationResults,
            notes: updatedData.notes,
          });
        }

        // Update local state with the actual project data
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingItemId ? { ...item, data: updatedData } : item
          )
        );
      } catch (error) {
        console.error("Failed to update Mendelian study:", error);
        // You could add a toast notification here
      }

      // Reset editing state
      setEditingItemId(null);
      setEditingItemData(null);
      setShowMendelianModal(false);
    },
    [editingItemId, projectId]
  );

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
                <span className="font-semibold text-sm">
                  {item.data?.name || "Sequence"}
                </span>
              </div>
              <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                {item.data?.sequence || "No sequence data"}
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
                  {item.data?.position || "Unknown"}
                </div>
                <div>
                  <span className="font-medium">Change:</span>{" "}
                  {item.data?.ref || "?"} → {item.data?.alt || "?"}
                </div>
                <div>
                  <span className="font-medium">Gene:</span>{" "}
                  {item.data?.gene || "Unknown"}
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
                <span className="font-semibold text-sm">
                  {item.data?.name || "Analysis"}
                </span>
              </div>
              <div className="bg-purple-50 p-2 rounded text-xs">
                Status: {item.data?.status || "Unknown"}
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
                <span className="font-semibold text-sm">
                  {item.data?.title || "Chart"}
                </span>
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="font-semibold text-sm">Note</span>
                </div>
                <button
                  onClick={(e) => handleDeleteItem(e, item.id)}
                  className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                  title="Delete note"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <textarea
                className="w-full h-16 text-xs border-none resize-none focus:outline-none"
                value={item.data?.content || ""}
                onChange={(e) => handleNoteChange(item.id, e.target.value)}
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  {editingItemNameId === item.id ? (
                    <input
                      type="text"
                      value={editingItemName}
                      onChange={(e) => setEditingItemName(e.target.value)}
                      onBlur={() => handleNameSave(item.id, editingItemName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleNameSave(item.id, editingItemName);
                        if (e.key === "Escape") handleNameCancel();
                      }}
                      autoFocus
                      className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 py-0.5 flex-1"
                    />
                  ) : (
                    <span
                      className="font-semibold text-sm cursor-text hover:bg-indigo-50 rounded px-1 py-0.5 transition-colors"
                      onClick={(e) => handleNameClick(e, item)}
                    >
                      {item.data?.name || "Mendelian Study"}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleEditItem(e, item)}
                    className="p-1 text-gray-400 cursor-pointer hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    title="Edit study"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="p-1 text-gray-400 cursor-pointer hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete study"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {item.data?.selectedTraits &&
                item.data.selectedTraits.length > 0 && (
                  <div className="space-y-2 text-xs">
                    <div className="bg-indigo-50 p-2 rounded">
                      <div className="font-medium">
                        Traits ({item.data.selectedTraits.length}):
                      </div>
                      {item.data.selectedTraits.map(
                        (trait: any, index: number) => (
                          <div
                            key={index}
                            className="text-xs text-gray-600 mt-1"
                          >
                            {trait.name}: {trait.parent1Genotype} ×{" "}
                            {trait.parent2Genotype}
                          </div>
                        )
                      )}
                    </div>
                    {item.data.simulationResults && (
                      <div className="space-y-1">
                        <div className="font-medium">Results:</div>
                        {Object.entries(item.data.simulationResults).map(
                          ([traitKey, results]: [string, any]) => (
                            <div
                              key={traitKey}
                              className="bg-slate-50 p-2 rounded"
                            >
                              <div className="font-medium text-xs mb-1">
                                {item.data.selectedTraits.find(
                                  (t: any) => t.key === traitKey
                                )?.name || traitKey}
                              </div>
                              {results &&
                                Object.entries(results).map(
                                  ([phenotype, prob]: [string, any]) => (
                                    <div
                                      key={phenotype}
                                      className="flex justify-between text-xs"
                                    >
                                      <span>{phenotype}</span>
                                      <span className="font-mono">
                                        {item.data.asPercentages
                                          ? `${prob.toFixed(1)}%`
                                          : `${(prob * 100).toFixed(1)}%`}
                                      </span>
                                    </div>
                                  )
                                )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                    {item.data.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded border">
                        <div className="flex items-center mb-1">
                          <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="font-medium text-xs text-gray-600">
                            Notes
                          </span>
                        </div>
                        <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                          {item.data.notes}
                        </div>
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
                parent1Genotype={item.data?.parent1Genotype || ""}
                parent2Genotype={item.data?.parent2Genotype || ""}
                phenotypeMap={item.data?.phenotypeMap || {}}
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
      <div className="flex flex-col h-screen min-h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/portal/projects")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
                  className="text-xl  font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
                />
              ) : (
                <h1
                  className="text-xl cursor-text font-semibold cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
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
                  className="text-gray-500 cursor-text text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {projectDescription}
                </p>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Project"}
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex bg-gray-50 min-h-0 overflow-hidden max-w-full">
          {/* Toolbox */}
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
                        !["mendelian-study", "punnett-square"].includes(
                          tool.type
                        )
                    )
                    .map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() =>
                          setSelectedTool(
                            selectedTool === tool.id ? null : tool.id
                          )
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
                        <span className="text-sm font-medium">
                          {tool.label}
                        </span>
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
                      <span className="text-sm font-medium">
                        Inheritance Study
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        setSelectedTool(
                          selectedTool === "punnett-square"
                            ? null
                            : "punnett-square"
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
                      <span className="text-sm font-medium">
                        Punnett Square
                      </span>
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
                        !["mendelian-study", "punnett-square"].includes(
                          tool.type
                        )
                    )
                    .map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() =>
                          setSelectedTool(
                            selectedTool === tool.id ? null : tool.id
                          )
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
                      showMendelianModal
                        ? "ring-2 ring-indigo-500 ring-offset-1"
                        : ""
                    }`}
                    title="Inheritance Study"
                  >
                    <AcademicCapIcon className="h-4 w-4 text-white" />
                  </button>

                  <button
                    onClick={() =>
                      setSelectedTool(
                        selectedTool === "punnett-square"
                          ? null
                          : "punnett-square"
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
                </div>
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Zoom Controls */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
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
              <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
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
              <div className="w-px h-4 bg-gray-300"></div>
              <button
                onClick={handleZoomReset}
                className="p-2 hover:bg-gray-100 rounded transition-colors text-xs"
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>

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
                onWheel={handleWheel}
                style={{
                  minHeight: "calc(100vh - 200px)",
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
                        Create your genomics workspace by selecting tools from
                        the left panel and placing them anywhere on this canvas.
                        <br />
                        <span className="text-sm text-gray-500 mt-2 block">
                          💡 Tip: Drag to pan around • Ctrl+scroll to zoom • Use
                          zoom controls above
                        </span>
                      </p>

                      {/* Quick Action Buttons */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Existing Projects */}
          <div
            className={`${
              isProjectsCollapsed ? "w-12 min-w-[3rem]" : "w-64 min-w-[16rem]"
            } bg-white border-l border-gray-200 flex-shrink-0 overflow-hidden transition-all duration-300`}
          >
            {/* Collapse/Expand Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button
                onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title={
                  isProjectsCollapsed ? "Expand Projects" : "Collapse Projects"
                }
              >
                {isProjectsCollapsed ? (
                  <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {!isProjectsCollapsed && (
                <h3 className="font-semibold">Existing Projects</h3>
              )}
            </div>

            {!isProjectsCollapsed ? (
              <div className="p-4 overflow-y-auto">
                <div className="space-y-3 ">
                  {projectsLoading ? (
                    // Loading state
                    <div className="space-y-3 ">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse ">
                          <div className="flex items-start space-x-3 p-3">
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : existingProjects.length > 0 ? (
                    // Real projects
                    existingProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() =>
                          navigate(`/portal/workspace/${project.id}`)
                        }
                        className="relative w-full text-left p-3 cursor-pointer rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group overflow-hidden"
                      >
                        {/* Mini notebook binding holes */}
                        <div className="absolute left-2 top-3 bottom-3 w-1">
                          <div className="flex flex-col justify-start space-y-2 h-full">
                            {[...Array(4)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 h-1 rounded-full bg-gray-300"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 ml-2">
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
                              {project.toolCount > 0 && (
                                <span className="ml-1 text-gray-400">
                                  • {project.toolCount} tool
                                  {project.toolCount !== 1 ? "s" : ""}
                                </span>
                              )}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-400">
                                {project.lastUpdated}
                              </p>
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Subtle lined effect for mini notebook */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-8 right-2 top-6 bottom-2 opacity-5">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="border-b border-gray-300 h-2"
                                style={{ marginTop: i === 0 ? 0 : "6px" }}
                              />
                            ))}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    // Empty state
                    <div className="text-center py-6">
                      <div className="text-gray-400 text-sm">
                        No other projects found
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate("/portal/projects")}
                    className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    View All Projects →
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 overflow-y-auto">
                <div className="space-y-2">
                  {projectsLoading ? (
                    // Loading state for collapsed
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 bg-gray-200 rounded animate-pulse"
                        ></div>
                      ))}
                    </div>
                  ) : existingProjects.length > 0 ? (
                    // Real projects as icons
                    existingProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() =>
                          navigate(`/portal/workspace/${project.id}`)
                        }
                        className={`w-8 h-8 ${project.color} rounded flex items-center justify-center transition-all cursor-pointer hover:scale-110`}
                        title={`${project.name} - ${project.type}`}
                      >
                        <project.icon className="h-4 w-4 text-white" />
                      </button>
                    ))
                  ) : (
                    // Empty state for collapsed
                    <div
                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"
                      title="No projects"
                    >
                      <FolderIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  )}

                  {/* View All Projects button as icon */}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <button
                      onClick={() => navigate("/portal/projects")}
                      className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center transition-all cursor-pointer hover:scale-110"
                      title="View All Projects"
                    >
                      <ArrowLeftIcon className="h-4 w-4 text-blue-600 rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mendelian Study Modal */}
      {showMendelianModal && (
        <MendelianStudyModal
          onClose={() => {
            setShowMendelianModal(false);
            setEditingItemId(null);
            setEditingItemData(null);
          }}
          onAddToCanvas={editingItemId ? handleUpdateItem : handleAddToCanvas}
          initialData={editingItemData}
          isEditing={!!editingItemId}
        />
      )}
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
