import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import MendelianStudyModal from "../components/MendelianStudyModal";

import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { useProject, useProjects } from "../hooks/useProjects";
import {
  deleteMendelianTool,
  updateMendelianTool,
  createMendelianTool,
  updateProject as updateProjectAPI,
} from "../services/zygotrixApi";

import type { WorkspaceItem } from "../components/workspace/types";
import { getDefaultSize, getDefaultData } from "../components/workspace/config";
import ToolboxSidebar from "../components/workspace/ToolboxSidebar";
import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import ProjectsSidebar from "../components/workspace/ProjectsSidebar";
import CanvasArea from "../components/workspace/CanvasArea";
import SequenceComponent from "../components/workspace/tools/SequenceComponent";
import VariantComponent from "../components/workspace/tools/VariantComponent";
import AnalysisComponent from "../components/workspace/tools/AnalysisComponent";
import ChartComponent from "../components/workspace/tools/ChartComponent";
import NoteComponent from "../components/workspace/tools/NoteComponent";
import MendelianStudyComponent from "../components/workspace/tools/MendelianStudyComponent";
import PunnettSquareComponent from "../components/workspace/tools/PunnettSquareComponent";
import TextAreaComponent from "../components/workspace/tools/TextAreaComponent";
import DrawingComponent from "../components/workspace/tools/DrawingComponent";
// Helper function imports
import {
  saveLocalItems,
  loadLocalItems,
  saveCanvasDrawings,
  loadCanvasDrawings,
  type CanvasDrawing,
} from "../components/workspace/helpers/localStorageHelpers";
import { getCanvasCoordinatesFromEvent } from "../components/workspace/helpers/coordinateHelpers";
import {
  projectToolsToWorkspaceItems,
  workspaceItemsToProjectTools,
  mergeBackendAndLocalItems,
} from "../components/workspace/helpers/dataTransformHelpers";
import {
  getTimeAgo,
  getProjectTypeIcon,
} from "../components/workspace/helpers/formatHelpers";
import {
  zoomIn,
  zoomOut,
  hasDraggedBeyondThreshold,
  calculateTextAreaSize,
  isValidTextAreaSize,
  resetCanvasTransform,
} from "../components/workspace/helpers/canvasHelpers";

const ProjectWorkspace: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Use project hook to manage project state
  const { project, loading, error, saveProgress } = useProject(
    projectId === "new" ? undefined : projectId
  );

  // Use projects hook to get all projects for the sidebar
  const {
    projects: allProjects,
    loading: projectsLoading,
    deleteProject,
  } = useProjects();

  // Local storage helpers for note-type items (now using imported helpers)

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
  const [panOffset, setPanOffset] = useState({ x: 400, y: 300 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  // Settings dropdown and delete confirmation state
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Text area drawing state
  const [isDrawingTextArea, setIsDrawingTextArea] = useState(false);
  const [textAreaStart, setTextAreaStart] = useState({ x: 0, y: 0 });
  const [textAreaEnd, setTextAreaEnd] = useState({ x: 0, y: 0 });

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Canvas drawing state
  const [isDrawingOnCanvas, setIsDrawingOnCanvas] = useState(false);
  const [currentCanvasPath, setCurrentCanvasPath] =
    useState<CanvasDrawing | null>(null);
  const [canvasDrawings, setCanvasDrawings] = useState<CanvasDrawing[]>([]);
  const [drawingStrokeColor, setDrawingStrokeColor] = useState("#000000");
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(2);
  const [isEraserMode, setIsEraserMode] = useState(false);

  // Update current drawing path when color or width changes
  useEffect(() => {
    if (currentCanvasPath && isDrawingOnCanvas) {
      setCurrentCanvasPath((prev) =>
        prev
          ? {
              ...prev,
              strokeColor: drawingStrokeColor,
              strokeWidth: drawingStrokeWidth,
            }
          : null
      );
    }
  }, [drawingStrokeColor, drawingStrokeWidth, isDrawingOnCanvas]);

  // Robust one-time centering for any empty project/workspace using ResizeObserver
  const hasCenteredRef = React.useRef(false);
  const centerWorkspace = useCallback(() => {
    if (!canvasRef.current) return;
    const el = canvasRef.current;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const innerMidpoint = 10000 / 2; // 5000
    const newX = rect.width / 2 - innerMidpoint * zoom;
    const newY = rect.height / 2 - innerMidpoint * zoom;
    setPanOffset({ x: newX, y: newY });
  }, [zoom]);

  useEffect(() => {
    // Only auto-center if there is nothing placed or drawn yet
    if (items.length > 0 || canvasDrawings.length > 0) return;
    if (hasCenteredRef.current) return;
    const defaultPan = panOffset.x === 400 && panOffset.y === 300;
    if (!defaultPan) return;
    if (!canvasRef.current) return;

    const attempt = () => {
      centerWorkspace();
      hasCenteredRef.current = true;
    };
    requestAnimationFrame(attempt);

    const ro = new ResizeObserver(() => {
      if (
        !hasCenteredRef.current &&
        panOffset.x === 400 &&
        panOffset.y === 300
      ) {
        attempt();
      } else if (hasCenteredRef.current) {
        ro.disconnect();
      }
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [
    items.length,
    canvasDrawings.length,
    panOffset.x,
    panOffset.y,
    zoom,
    centerWorkspace,
  ]);

  // Initialize project data when loaded
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || "Genomics Workspace");
      setProjectColor(project.color || "bg-blue-500");

      // Convert project tools to workspace items using helper
      const workspaceItems = projectToolsToWorkspaceItems(project.tools);

      // Preserve any existing local-only items (like note-type items) and merge with backend items
      setItems((prevItems) => {
        const persistedLocalItems = projectId ? loadLocalItems(projectId) : [];
        // Combine current local items with persisted ones
        const allLocalItems = [...prevItems, ...persistedLocalItems];
        return mergeBackendAndLocalItems(workspaceItems, allLocalItems);
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

  // Load canvas drawings when project loads
  useEffect(() => {
    if (projectId && projectId !== "new") {
      const savedDrawings = loadCanvasDrawings(projectId);
      setCanvasDrawings(savedDrawings);
    }
  }, [projectId, loadCanvasDrawings]);

  // Persist canvas drawings to localStorage whenever they change
  useEffect(() => {
    if (projectId && projectId !== "new" && canvasDrawings.length > 0) {
      saveCanvasDrawings(projectId, canvasDrawings);
    }
  }, [canvasDrawings, projectId, saveCanvasDrawings]);

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

      // Convert workspace items back to project tools using helper
      const projectTools = workspaceItemsToProjectTools(items);

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
      // Deselect any selected tool when pressing Escape
      if (event.key === "Escape" || event.key === "Esc") {
        setSelectedTool(null);
        // also cancel any drawing/text-area in progress
        setIsDrawingTextArea(false);
        setIsDrawingOnCanvas(false);
        setCurrentCanvasPath(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleManualSave]);

  // Canvas zoom with native event listener to capture Ctrl+Scroll before browser
  useEffect(() => {
    const handleCanvasWheel = (e: WheelEvent) => {
      try {
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        // Only intercept when the pointer/event is over the canvas element
        const eventTarget = e.target as Node | null;
        if (!eventTarget || !canvasEl.contains(eventTarget)) return;

        if (e.ctrlKey || e.metaKey) {
          // Prevent browser from zooming the page
          e.preventDefault();
          e.stopPropagation();

          const delta = -e.deltaY;
          const zoomFactor = delta > 0 ? 1.1 : 0.9;

          setZoom((prevZoom) =>
            Math.max(0.25, Math.min(3, prevZoom * zoomFactor))
          );
        }
      } catch (err) {
        // Fail-safe: don't break the app if something unexpected happens
        // eslint-disable-next-line no-console
        console.error("Error handling canvas wheel:", err);
      }
    };

    // Attach to window so we can catch wheel events even when browser tries to act first
    window.addEventListener("wheel", handleCanvasWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", handleCanvasWheel, {
        capture: true,
      } as EventListenerOptions);
    };
  }, []);

  // Settings dropdown and delete project handlers
  const handleDeleteProject = useCallback(async () => {
    if (!project || !projectId || projectId === "new") return;

    try {
      setIsDeleting(true);
      await deleteProject(projectId);
      navigate("/portal/projects");
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  }, [project, projectId, deleteProject, navigate]);

  const handleSettingsClick = useCallback(() => {
    setShowSettingsDropdown(!showSettingsDropdown);
  }, [showSettingsDropdown]);

  const handleDeleteClick = useCallback(() => {
    setShowSettingsDropdown(false);
    setShowDeleteConfirmation(true);
  }, []);

  const handleCloseDeleteConfirmation = useCallback(() => {
    setShowDeleteConfirmation(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsDropdown) {
        const target = event.target as HTMLElement;
        const dropdown = target.closest(".relative");
        if (!dropdown?.contains(target)) {
          setShowSettingsDropdown(false);
        }
      }
    };

    if (showSettingsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showSettingsDropdown]);

  // Helper functions are now imported from formatHelpers

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

      // Special handling for drawing tool - don't place as component
      if (selectedTool === "drawing") {
        return; // Drawing is handled via mouse down/move/up events
      }

      // Special handling for text-area tool - don't place immediately
      if (selectedTool === "text-area") {
        return; // Text areas are placed via mouse down/up events
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Convert screen coordinates to canvas coordinates accounting for zoom and pan
      const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
        zoom,
        panOffset,
      });
      if (!canvasCoords) return;
      const canvasX = canvasCoords.x;
      const canvasY = canvasCoords.y;

      const newItem: WorkspaceItem = {
        id: `${selectedTool}-${Date.now()}`,
        type: selectedTool as any,
        position: { x: canvasX, y: canvasY },
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

      // Convert screen coordinates to canvas coordinates using helper
      const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
        zoom,
        panOffset,
      });
      if (!canvasCoords) return;

      const offsetX = canvasCoords.x - item.position.x;
      const offsetY = canvasCoords.y - item.position.y;

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

      // Convert screen coordinates to canvas coordinates using helper
      const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
        zoom,
        panOffset,
      });
      if (!canvasCoords) return;

      const x = canvasCoords.x - dragOffset.x;
      const y = canvasCoords.y - dragOffset.y;

      setItems((prev) =>
        prev.map((item) =>
          item.id === draggedItem ? { ...item, position: { x, y } } : item
        )
      );
    },
    [draggedItem, dragOffset, zoom, panOffset]
  );

  const handleMouseUp = useCallback(() => {
    // Handle canvas drawing completion
    if (isDrawingOnCanvas && currentCanvasPath) {
      // Only save path if it has more than one point
      if (currentCanvasPath.points.length > 1) {
        setCanvasDrawings((prev) => [...prev, currentCanvasPath]);
      }

      setIsDrawingOnCanvas(false);
      setCurrentCanvasPath(null);
      setHasDragged(false);
      return;
    }

    // Handle text area completion using helper functions
    if (isDrawingTextArea) {
      // Only create text area if it has meaningful size
      if (isValidTextAreaSize(textAreaStart, textAreaEnd)) {
        const { x, y, width, height } = calculateTextAreaSize(
          textAreaStart,
          textAreaEnd
        );

        const newItem: WorkspaceItem = {
          id: `text-area-${Date.now()}`,
          type: "text-area",
          position: { x, y },
          size: { width, height },
          data: getDefaultData("text-area"),
        };

        setItems((prev) => [...prev, newItem]);
      }

      setIsDrawingTextArea(false);
      setSelectedTool(null);
      setHasDragged(false);
      return;
    }

    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
    setIsPanning(false);
    // Don't reset hasDragged here - let handleCanvasClick handle it
  }, [
    isDrawingOnCanvas,
    currentCanvasPath,
    isDrawingTextArea,
    textAreaStart,
    textAreaEnd,
  ]);

  // Handle canvas zoom using imported helpers
  const handleZoomIn = useCallback(() => {
    setZoom((prevZoom) => zoomIn(prevZoom));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prevZoom) => zoomOut(prevZoom));
  }, []);

  const handleZoomReset = useCallback(() => {
    const transform = resetCanvasTransform();
    setZoom(transform.zoom);
    setPanOffset(transform.panOffset);
  }, []);

  // Handle pan start
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Handle canvas drawing
      if (selectedTool === "drawing" && e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
          zoom,
          panOffset,
        });
        if (!canvasCoords) return;

        // Handle eraser mode
        if (isEraserMode) {
          // Find and remove drawing paths near the click point
          const eraserRadius = 10; // Adjust this for eraser sensitivity
          const pathsToRemove: string[] = [];

          canvasDrawings.forEach((drawing) => {
            const isNearPath = drawing.points.some((point) => {
              const distanceX = Math.abs(point.x - canvasCoords.x);
              const distanceY = Math.abs(point.y - canvasCoords.y);
              return distanceX <= eraserRadius && distanceY <= eraserRadius;
            });

            if (isNearPath) {
              pathsToRemove.push(drawing.id);
            }
          });

          if (pathsToRemove.length > 0) {
            setCanvasDrawings((prev) =>
              prev.filter((drawing) => !pathsToRemove.includes(drawing.id))
            );
          }

          setHasDragged(false);
          return;
        }

        // Handle normal drawing mode
        const newPath = {
          id: `canvas-path-${Date.now()}`,
          points: [canvasCoords],
          strokeColor: drawingStrokeColor,
          strokeWidth: drawingStrokeWidth,
        };

        setCurrentCanvasPath(newPath);
        setIsDrawingOnCanvas(true);
        setHasDragged(false);
        return;
      }

      // Handle text area drawing
      if (selectedTool === "text-area" && e.button === 0) {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
          zoom,
          panOffset,
        });
        if (!canvasCoords) return;

        setIsDrawingTextArea(true);
        setTextAreaStart(canvasCoords);
        setTextAreaEnd(canvasCoords);
        setHasDragged(false);
        return;
      }

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
    [selectedTool, zoom, panOffset]
  );

  // Handle panning, text area drawing, and canvas drawing
  const handleCanvasPanMove = useCallback(
    (e: React.MouseEvent) => {
      // Handle eraser drag mode
      if (selectedTool === "drawing" && isEraserMode && e.buttons === 1) {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
          zoom,
          panOffset,
        });
        if (!canvasCoords) return;

        // Find and remove drawing paths near the current position while dragging
        const eraserRadius = 10;
        const pathsToRemove: string[] = [];

        canvasDrawings.forEach((drawing) => {
          const isNearPath = drawing.points.some((point) => {
            const distanceX = Math.abs(point.x - canvasCoords.x);
            const distanceY = Math.abs(point.y - canvasCoords.y);
            return distanceX <= eraserRadius && distanceY <= eraserRadius;
          });

          if (isNearPath) {
            pathsToRemove.push(drawing.id);
          }
        });

        if (pathsToRemove.length > 0) {
          setCanvasDrawings((prev) =>
            prev.filter((drawing) => !pathsToRemove.includes(drawing.id))
          );
        }

        setHasDragged(true);
        return;
      }

      if (isDrawingOnCanvas && currentCanvasPath) {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
          zoom,
          panOffset,
        });
        if (!canvasCoords) return;

        setCurrentCanvasPath((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            points: [...prev.points, canvasCoords],
          };
        });
        setHasDragged(true);
        return;
      }

      if (isDrawingTextArea) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
          zoom,
          panOffset,
        });
        if (!canvasCoords) return;

        setTextAreaEnd(canvasCoords);
        setHasDragged(true);
        return;
      }

      if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;

        // If there's any movement, mark as dragged using helper
        if (
          hasDraggedBeyondThreshold(lastPanPoint, {
            x: e.clientX,
            y: e.clientY,
          })
        ) {
          setHasDragged(true);
        }

        setPanOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [
      isPanning,
      lastPanPoint,
      isDrawingTextArea,
      isDrawingOnCanvas,
      currentCanvasPath,
      zoom,
      panOffset,
    ]
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

  // Drawing-specific handlers
  const handleDrawingNameClick = useCallback(
    (e: React.MouseEvent, itemId: string, currentName: string) => {
      e.stopPropagation();
      setEditingItemNameId(itemId);
      setEditingItemName(currentName);
    },
    []
  );

  const handleDrawingEditItem = useCallback(
    (itemId: string, field: string, value: any) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, data: { ...item.data, [field]: value } }
            : item
        )
      );
    },
    []
  );

  const handleDrawingDeleteItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // Clear all canvas drawings
  const clearCanvasDrawings = useCallback(() => {
    setCanvasDrawings([]);
    if (projectId && projectId !== "new") {
      // Clear from localStorage
      localStorage.removeItem(`zygotrix_canvas_drawings_${projectId}`);
    }
  }, [projectId]);

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

  const renderWorkspaceItem = (item: WorkspaceItem) => {
    const commonClasses = `absolute bg-white rounded-lg shadow-md border border-gray-200 cursor-move overflow-hidden ${
      draggedItem === item.id ? "z-50 shadow-xl" : "z-10"
    }`;

    switch (item.type) {
      case "sequence":
        return (
          <SequenceComponent
            item={item}
            commonClasses={commonClasses}
            onMouseDown={handleMouseDown}
          />
        );

      case "variant":
        return (
          <VariantComponent
            item={item}
            commonClasses={commonClasses}
            onMouseDown={handleMouseDown}
          />
        );

      case "analysis":
        return (
          <AnalysisComponent
            item={item}
            commonClasses={commonClasses}
            onMouseDown={handleMouseDown}
          />
        );

      case "chart":
        return (
          <ChartComponent
            item={item}
            commonClasses={commonClasses}
            onMouseDown={handleMouseDown}
          />
        );

      case "note":
        return (
          <NoteComponent
            item={item}
            commonClasses={commonClasses}
            onMouseDown={handleMouseDown}
            onDeleteItem={handleDeleteItem}
            onNoteChange={handleNoteChange}
          />
        );

      case "mendelian-study":
        return (
          <MendelianStudyComponent
            item={item}
            commonClasses={commonClasses}
            editingItemNameId={editingItemNameId}
            editingItemName={editingItemName}
            setEditingItemName={setEditingItemName}
            onMouseDown={handleMouseDown}
            onNameClick={handleNameClick}
            onNameSave={handleNameSave}
            onNameCancel={handleNameCancel}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        );

      case "punnett-square":
        return (
          <PunnettSquareComponent
            item={item}
            commonClasses={commonClasses}
            onMouseDown={handleMouseDown}
          />
        );

      case "text-area":
        return (
          <TextAreaComponent
            item={item}
            editingTextId={editingTextId}
            editingText={editingText}
            setEditingTextId={setEditingTextId}
            setEditingText={setEditingText}
            items={items}
            setItems={setItems}
            onMouseDown={handleMouseDown}
          />
        );

      case "drawing":
        return (
          <DrawingComponent
            item={item}
            commonClasses={commonClasses}
            editingItemNameId={editingItemNameId}
            editingItemName={editingItemName}
            setEditingItemName={setEditingItemName}
            onMouseDown={handleMouseDown}
            onNameClick={handleDrawingNameClick}
            onNameSave={handleNameSave}
            onNameCancel={handleNameCancel}
            onEditItem={handleDrawingEditItem}
            onDeleteItem={handleDrawingDeleteItem}
          />
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div
        className="flex flex-col overflow-hidden -m-4 lg:-m-6"
        style={{ height: "calc(100vh - 5rem)" }}
      >
        {/* Header */}
        <WorkspaceHeader
          projectId={projectId}
          project={project}
          projectName={projectName}
          setProjectName={setProjectName}
          projectDescription={projectDescription}
          setProjectDescription={setProjectDescription}
          projectColor={projectColor}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          isEditingDescription={isEditingDescription}
          setIsEditingDescription={setIsEditingDescription}
          saving={saving}
          loading={loading}
          error={error}
          showSettingsDropdown={showSettingsDropdown}
          handleUpdateProjectDetails={handleUpdateProjectDetails}
          handleColorChange={handleColorChange}
          handleManualSave={handleManualSave}
          handleSettingsClick={handleSettingsClick}
          handleDeleteClick={handleDeleteClick}
        />

        <div className="flex-1 flex bg-gray-50 min-h-0 overflow-hidden max-w-full">
          {/* Toolbox */}
          <ToolboxSidebar
            isToolsCollapsed={isToolsCollapsed}
            setIsToolsCollapsed={setIsToolsCollapsed}
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            showMendelianModal={showMendelianModal}
            setShowMendelianModal={setShowMendelianModal}
            clearCanvasDrawings={clearCanvasDrawings}
          />

          {/* Canvas Area */}
          <CanvasArea
            canvasRef={canvasRef}
            selectedTool={selectedTool}
            isPanning={isPanning}
            panOffset={panOffset}
            zoom={zoom}
            items={items}
            isDrawingTextArea={isDrawingTextArea}
            textAreaStart={textAreaStart}
            textAreaEnd={textAreaEnd}
            canvasDrawings={canvasDrawings}
            currentCanvasPath={currentCanvasPath}
            isEraserMode={isEraserMode}
            handleZoomOut={handleZoomOut}
            handleZoomIn={handleZoomIn}
            handleZoomReset={handleZoomReset}
            handleCenterView={centerWorkspace}
            handleCanvasClick={handleCanvasClick}
            handleMouseMove={handleMouseMove}
            handleCanvasPanMove={handleCanvasPanMove}
            handleMouseUp={handleMouseUp}
            handleCanvasMouseDown={handleCanvasMouseDown}
            renderWorkspaceItem={renderWorkspaceItem}
          />

          {/* Right Sidebar - Existing Projects */}
          <ProjectsSidebar
            isProjectsCollapsed={isProjectsCollapsed}
            setIsProjectsCollapsed={setIsProjectsCollapsed}
            existingProjects={existingProjects}
            projectsLoading={projectsLoading}
          />
        </div>
      </div>

      {/* Modern Drawing Controls Panel - Samsung Notes Style */}
      {selectedTool === "drawing" && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-3">
          <div className="flex items-center space-x-3">
            {/* Mode Toggle Buttons */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setIsEraserMode(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  !isEraserMode
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span className="text-sm font-medium">Draw</span>
              </button>
              <button
                onClick={() => setIsEraserMode(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  isEraserMode
                    ? "bg-white shadow-sm text-pink-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 7.586 8.707 5.293z" />
                  <path
                    fillRule="evenodd"
                    d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 110-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">Erase</span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200"></div>

            {/* Drawing Controls - only show when in draw mode */}
            {!isEraserMode && (
              <>
                {/* Color Palette */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-medium">
                    Color
                  </span>
                  <div className="flex space-x-1">
                    {[
                      "#000000",
                      "#FF0000",
                      "#00FF00",
                      "#0000FF",
                      "#FFFF00",
                      "#FF00FF",
                      "#00FFFF",
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setDrawingStrokeColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          drawingStrokeColor === color
                            ? "border-gray-400 scale-110"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={drawingStrokeColor}
                      onChange={(e) => setDrawingStrokeColor(e.target.value)}
                      className="w-6 h-6 rounded-full border-2 border-gray-200 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200"></div>

                {/* Brush Size */}
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500 font-medium">
                    Size
                  </span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="rounded-full bg-current transition-all"
                      style={{
                        width: `${Math.max(4, drawingStrokeWidth * 2)}px`,
                        height: `${Math.max(4, drawingStrokeWidth * 2)}px`,
                        color: drawingStrokeColor,
                      }}
                    />
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={drawingStrokeWidth}
                      onChange={(e) =>
                        setDrawingStrokeWidth(parseInt(e.target.value))
                      }
                      className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 w-4 text-center">
                      {drawingStrokeWidth}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 ml-4">
              {/* Clear All */}
              <button
                onClick={() => setCanvasDrawings([])}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear All Drawings"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>

              {/* Close */}
              <button
                onClick={() => setSelectedTool(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exit Drawing Mode"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={handleCloseDeleteConfirmation}
        onConfirm={handleDeleteProject}
        projectName={project?.name || ""}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
