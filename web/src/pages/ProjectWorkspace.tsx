import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import WorkspaceLayout from "../layouts/WorkspaceLayout";
import MendelianStudyModal from "../components/dashboard/MendelianStudyModal";

import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";
import { useProject, useProjects } from "../hooks/useProjects";
import type { WorkspaceItem } from "../components/workspace/types";
import { getDefaultSize, getDefaultData } from "../components/workspace/config";
import ToolboxSidebar from "../components/workspace/sidebar/ToolboxSidebar";
import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import ProjectsSidebar from "../components/workspace/sidebar/ProjectsSidebar";
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
  loadLineDrawings,
  type LineDrawing,
} from "../components/workspace/helpers/localStorageHelpers";
import {
  getCanvasCoordinatesFromEvent,
  screenToCanvas,
} from "../components/workspace/helpers/coordinateHelpers";
import {
  projectToolsToWorkspaceItems,
  workspaceItemsToProjectTools,
  mergeBackendAndLocalItems,
} from "../components/workspace/helpers/dataTransformHelpers";
import {
  formatDate,
  getProjectTypeIcon,
} from "../components/workspace/helpers/formatHelpers";
import {
  zoomIn,
  zoomOut,
  hasDraggedBeyondThreshold,
  calculateTextAreaSize,
  isValidTextAreaSize,
  resetCanvasTransform,
  DEFAULT_ZOOM_LIMITS,
} from "../components/workspace/helpers/canvasHelpers";
import {
  ensureDeviceId,
  getStoredLines,
  getLinesForSave,
  getStoredNotes,
  getNotesForSave,
  getStoredDrawings,
  getDrawingsForSave,
  areLinesDirty,
  areNotesDirty,
  areDrawingsDirty,
  markLinesDirty,
  markNotesDirty,
  markDrawingsDirty,
  recordLineSnapshot,
  recordNoteSnapshot,
  recordDrawingSnapshot,
  replaceProjectLines as replaceStoredProjectLines,
  replaceProjectNotes as replaceStoredProjectNotes,
  replaceProjectDrawings as replaceStoredProjectDrawings,
  upsertManyLines,
  upsertStoredLine,
  upsertStoredNote,
  upsertStoredDrawing,
  type StoredLineRecord,
  type StoredNoteRecord,
  type StoredDrawingRecord,
} from "../services/workspaceLocalStore";
import {
  createMendelianTool,
  deleteMendelianTool,
  fetchProjectDrawings,
  fetchProjectLines,
  fetchProjectNotes,
  saveProjectDrawings as saveProjectDrawingsApi,
  saveProjectLines as saveProjectLinesApi,
  saveProjectNotes as saveProjectNotesApi,
  updateMendelianTool,
  updateProject as updateProjectAPI,
} from "../services/projects.api";
import type {
  ProjectDrawingSaveSummary,
  ProjectLineSaveSummary,
  ProjectNoteSaveSummary,
} from "../types/api";

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
  const [targetZoom, setTargetZoom] = useState(1);
  const [targetPanOffset, setTargetPanOffset] = useState({ x: 400, y: 300 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  const adjustZoom = useCallback(
    (
      zoomUpdater: (previousZoom: number) => number,
      focusPoint?: { x: number; y: number }
    ) => {
      const canvasEl = canvasRef.current;
      const rect = canvasEl?.getBoundingClientRect();
      const target =
        focusPoint ??
        (rect ? { x: rect.width / 2, y: rect.height / 2 } : undefined);

      // Compute using currently displayed zoom/pan so the focus point remains anchored
      const currentZoom = zoomRef.current ?? zoom;
      const currentPan = panRef.current ?? panOffset;

      const nextZoomRaw = zoomUpdater(currentZoom);
      const clampedZoom = Math.max(
        DEFAULT_ZOOM_LIMITS.min,
        Math.min(DEFAULT_ZOOM_LIMITS.max, nextZoomRaw)
      );

      if (!target || clampedZoom === currentZoom || currentZoom === 0) {
        setTargetZoom(clampedZoom);
        return;
      }

      const focusCanvasX = (target.x - currentPan.x) / currentZoom;
      const focusCanvasY = (target.y - currentPan.y) / currentZoom;

      setTargetZoom(clampedZoom);
      setTargetPanOffset({
        x: target.x - focusCanvasX * clampedZoom,
        y: target.y - focusCanvasY * clampedZoom,
      });
    },
    [canvasRef]
  );

  // Refs to hold current values for RAF loop and event handlers
  const zoomRef = React.useRef(zoom);
  const panRef = React.useRef(panOffset);
  const rafRef = React.useRef<number | null>(null);
  const isPanningRef = React.useRef(isPanning);
  useEffect(() => {
    isPanningRef.current = isPanning;
  }, [isPanning]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panRef.current = panOffset;
  }, [panOffset]);

  // Smoothly animate zoom/pan towards target values using requestAnimationFrame
  useEffect(() => {
    const ease = 0.22; // easing factor per frame (0 < ease < 1)

    const step = () => {
      // If user is actively panning, pause the zoom animation to avoid conflicting transforms
      if (isPanningRef.current) {
        rafRef.current = null;
        return;
      }
      const curZoom = zoomRef.current;
      const curPan = panRef.current;
      const dz = targetZoom - curZoom;
      const dx = targetPanOffset.x - curPan.x;
      const dy = targetPanOffset.y - curPan.y;

      // If changes are very small, snap to targets and stop animation
      if (Math.abs(dz) < 0.0005 && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        if (curZoom !== targetZoom) setZoom(targetZoom);
        if (curPan.x !== targetPanOffset.x || curPan.y !== targetPanOffset.y)
          setPanOffset({ x: targetPanOffset.x, y: targetPanOffset.y });
        rafRef.current = null;
        return;
      }

      const nextZoom = curZoom + dz * ease;
      const nextPanX = curPan.x + dx * ease;
      const nextPanY = curPan.y + dy * ease;

      // Clamp pan so the large content (10000x10000) doesn't drift out of view
      const rect = canvasRef.current?.getBoundingClientRect();
      let clampedX = nextPanX;
      let clampedY = nextPanY;
      if (rect) {
        const contentW = 10000 * nextZoom;
        const contentH = 10000 * nextZoom;
        if (contentW <= rect.width) {
          clampedX = (rect.width - contentW) / 2;
        } else {
          const minX = rect.width - contentW; // negative
          const maxX = 0;
          clampedX = Math.max(minX, Math.min(maxX, nextPanX));
        }

        if (contentH <= rect.height) {
          clampedY = (rect.height - contentH) / 2;
        } else {
          const minY = rect.height - contentH; // negative
          const maxY = 0;
          clampedY = Math.max(minY, Math.min(maxY, nextPanY));
        }
      }

      setZoom(nextZoom);
      setPanOffset({ x: clampedX, y: clampedY });

      rafRef.current = window.requestAnimationFrame(step);
    };

    // kick off animation only if targets differ
    if (
      Math.abs(targetZoom - zoomRef.current) > 0.0005 ||
      Math.abs(targetPanOffset.x - panRef.current.x) > 0.5 ||
      Math.abs(targetPanOffset.y - panRef.current.y) > 0.5
    ) {
      if (rafRef.current == null)
        rafRef.current = window.requestAnimationFrame(step);
    }

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [targetZoom, targetPanOffset]);

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

  // Line drawing state
  const [lineDrawings, setLineDrawings] = useState<LineDrawing[]>([]);
  const [linesDirty, setLinesDirty] = useState(false);
  const [lineSaveSummary, setLineSaveSummary] =
    useState<ProjectLineSaveSummary | null>(null);
  const [notesDirty, setNotesDirty] = useState(false);
  const [noteSaveSummary, setNoteSaveSummary] =
    useState<ProjectNoteSaveSummary | null>(null);
  const [drawingsDirty, setDrawingsDirty] = useState(false);
  const [drawingSaveSummary, setDrawingSaveSummary] =
    useState<ProjectDrawingSaveSummary | null>(null);
  const deviceIdRef = useRef<string>(ensureDeviceId());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStartPoint, setLineStartPoint] = useState({ x: 0, y: 0 });
  const [lineEndPoint, setLineEndPoint] = useState({ x: 0, y: 0 });
  const [lineArrowType, setLineArrowType] = useState<"none" | "end">("none");

  // Line eraser mode (similar to drawing eraser mode)
  const [isLineEraserMode, setIsLineEraserMode] = useState(false);
  // Active line erasing drag state
  const [isErasingLines, setIsErasingLines] = useState(false);

  // Use ref for immediate access to current eraser mode (performance optimization)
  const isLineEraserModeRef = useRef(isLineEraserMode);
  useEffect(() => {
    isLineEraserModeRef.current = isLineEraserMode;
  }, [isLineEraserMode]);

  const mapStoredLineToDrawing = useCallback(
    (record: StoredLineRecord): LineDrawing => ({
      id: record.id,
      startPoint: record.start_point,
      endPoint: record.end_point,
      strokeColor: record.stroke_color,
      strokeWidth: record.stroke_width,
      arrowType: record.arrow_type === "end" ? "end" : "none",
      isDeleted: record.is_deleted,
      updatedAt: record.updated_at,
      version: record.version,
      origin: record.origin ?? null,
    }),
    []
  );

  const mapDrawingToStoredLine = useCallback(
    (projectIdValue: string, line: LineDrawing): StoredLineRecord => ({
      id: line.id,
      project_id: projectIdValue,
      start_point: line.startPoint,
      end_point: line.endPoint,
      stroke_color: line.strokeColor,
      stroke_width: line.strokeWidth,
      arrow_type: line.arrowType,
      is_deleted: Boolean(line.isDeleted),
      updated_at: line.updatedAt ?? new Date().toISOString(),
      version: line.version ?? 0,
      origin: line.origin ?? deviceIdRef.current,
    }),
    []
  );

  const mapStoredNoteToItem = useCallback(
    (record: StoredNoteRecord): WorkspaceItem => ({
      id: record.id,
      type: "note",
      position: { x: record.position.x, y: record.position.y },
      size: { width: record.size.width, height: record.size.height },
      data: {
        content: record.content,
        updatedAt: record.updated_at,
        version: record.version,
        origin: record.origin ?? null,
      },
    }),
    []
  );

  const mapItemToStoredNote = useCallback(
    (projectIdValue: string, item: WorkspaceItem): StoredNoteRecord => ({
      id: item.id,
      project_id: projectIdValue,
      content: item.data?.content ?? "",
      position: {
        x: item.position.x,
        y: item.position.y,
      },
      size: {
        width: item.size.width,
        height: item.size.height,
      },
      is_deleted: Boolean(item.data?.isDeleted),
      updated_at: item.data?.updatedAt ?? new Date().toISOString(),
      version: item.data?.version ?? 0,
      origin: item.data?.origin ?? deviceIdRef.current,
    }),
    []
  );

  const mapStoredDrawingToCanvas = useCallback(
    (record: StoredDrawingRecord): CanvasDrawing => ({
      id: record.id,
      points: record.points.map((point) => ({ x: point.x, y: point.y })),
      strokeColor: record.stroke_color,
      strokeWidth: record.stroke_width,
      updatedAt: record.updated_at,
      version: record.version,
      origin: record.origin ?? null,
      isDeleted: record.is_deleted,
    }),
    []
  );

  const mapCanvasToStoredDrawing = useCallback(
    (projectIdValue: string, drawing: CanvasDrawing): StoredDrawingRecord => ({
      id: drawing.id,
      project_id: projectIdValue,
      points: drawing.points.map((point) => ({ x: point.x, y: point.y })),
      stroke_color: drawing.strokeColor,
      stroke_width: drawing.strokeWidth,
      is_deleted: Boolean(drawing.isDeleted),
      updated_at: drawing.updatedAt ?? new Date().toISOString(),
      version: drawing.version ?? 0,
      origin: drawing.origin ?? deviceIdRef.current,
    }),
    []
  );

  const workspaceDirty = linesDirty || notesDirty || drawingsDirty;

  const workspaceSaveSummary = useMemo(
    () => ({
      lines: lineSaveSummary,
      notes: noteSaveSummary,
      drawings: drawingSaveSummary,
    }),
    [lineSaveSummary, noteSaveSummary, drawingSaveSummary]
  );

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

  // Initialize project data when loaded (reset items per project to avoid leakage)
  useEffect(() => {
    if (!project) return;
    setProjectName(project.name);
    setProjectDescription(project.description || "Genomics Workspace");
    setProjectColor(project.color || "bg-blue-500");
    const workspaceItems = projectToolsToWorkspaceItems(project.tools);
    const persistedLocalItems = projectId ? loadLocalItems(projectId) : [];
    const merged = mergeBackendAndLocalItems(
      workspaceItems,
      persistedLocalItems
    );
    setItems(merged);
  }, [project, projectId]);

  // Persist local-only items to localStorage whenever items change
  useEffect(() => {
    if (projectId && projectId !== "new" && items.length > 0) {
      const localOnlyItems = items.filter(
        (item) => item.type !== "mendelian-study" && item.type !== "note"
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

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      setLinesDirty(true);
      setNotesDirty(true);
      setDrawingsDirty(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateLines = async () => {
      if (
        !projectId ||
        projectId === "new" ||
        projectId === "null" ||
        projectId === "None" ||
        projectId === ""
      ) {
        setLineDrawings([]);
        setLinesDirty(false);
        return;
      }

      try {
        let records = await getStoredLines(projectId, { includeDeleted: true });

        if (!records.length) {
          const legacy = loadLineDrawings(projectId);
          if (legacy.length) {
            const now = new Date().toISOString();
            const migrated: StoredLineRecord[] = legacy.map((line, index) => ({
              id: line.id || `legacy-line-${index}`,
              project_id: projectId,
              start_point: line.startPoint,
              end_point: line.endPoint,
              stroke_color: line.strokeColor,
              stroke_width: line.strokeWidth,
              arrow_type: line.arrowType,
              is_deleted: Boolean(line.isDeleted),
              updated_at: line.updatedAt ?? now,
              version: line.version ?? 1,
              origin: line.origin ?? deviceIdRef.current,
            }));
            if (migrated.length) {
              await upsertManyLines(migrated);
              records = migrated;
            }
          }
        }

        if (!cancelled) {
          setLineDrawings(
            records
              .filter((record) => !record.is_deleted)
              .map(mapStoredLineToDrawing)
          );
          const dirty = await areLinesDirty(projectId);
          if (!cancelled) {
            setLinesDirty(dirty || isOffline);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load workspace lines", error);
        }
      }

      if (cancelled || isOffline) {
        return;
      }

      try {
        const snapshot = await fetchProjectLines(projectId);
        await recordLineSnapshot(projectId, snapshot);

        if (cancelled) return;

        setLineDrawings(
          snapshot.lines
            .filter((record) => !record.is_deleted)
            .map(mapStoredLineToDrawing)
        );
        setLinesDirty(false);
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to pull line snapshot", error);
          setLinesDirty(true);
        }
      }
    };

    void hydrateLines();

    return () => {
      cancelled = true;
    };
  }, [projectId, isOffline, mapStoredLineToDrawing]);

  useEffect(() => {
    let cancelled = false;

    const hydrateNotes = async () => {
      if (
        !projectId ||
        projectId === "null" ||
        projectId === "None" ||
        projectId === ""
      ) {
        if (!cancelled) {
          setItems((prev) => prev.filter((item) => item.type !== "note"));
          setNotesDirty(false);
        }
        return;
      }

      const storageProjectId = projectId === "new" ? "new" : projectId;

      try {
        let records = await getStoredNotes(storageProjectId, {
          includeDeleted: true,
        });

        if (!records.length) {
          const legacyNotes = loadLocalItems(projectId).filter(
            (legacy) => legacy.type === "note"
          );
          if (legacyNotes.length) {
            const nowIso = new Date().toISOString();
            records = legacyNotes.map((legacy) => ({
              id: legacy.id,
              project_id: storageProjectId,
              content: legacy.data?.content ?? "",
              position: {
                x: legacy.position.x,
                y: legacy.position.y,
              },
              size: {
                width: legacy.size.width,
                height: legacy.size.height,
              },
              is_deleted: false,
              updated_at: legacy.data?.updatedAt ?? nowIso,
              version: legacy.data?.version ?? 0,
              origin: legacy.data?.origin ?? deviceIdRef.current,
            }));

            await Promise.all(records.map((note) => upsertStoredNote(note)));
          }
        }

        if (!cancelled) {
          setItems((prev) => {
            const withoutNotes = prev.filter((item) => item.type !== "note");
            const noteItems = records
              .filter((record) => !record.is_deleted)
              .map(mapStoredNoteToItem);
            return [...withoutNotes, ...noteItems];
          });

          if (projectId !== "new") {
            const dirty = await areNotesDirty(projectId);
            if (!cancelled) {
              setNotesDirty(dirty || isOffline);
            }
          } else if (!cancelled) {
            setNotesDirty(false);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load workspace notes", error);
          setNotesDirty(true);
        }
      }

      if (cancelled || projectId === "new" || isOffline) {
        return;
      }

      try {
        const snapshot = await fetchProjectNotes(projectId);
        await recordNoteSnapshot(projectId, snapshot);

        if (cancelled) return;

        setItems((prev) => {
          const withoutNotes = prev.filter((item) => item.type !== "note");
          const noteItems = snapshot.notes
            .filter((record) => !record.is_deleted)
            .map(mapStoredNoteToItem);
          return [...withoutNotes, ...noteItems];
        });
        setNotesDirty(false);
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to pull note snapshot", error);
          setNotesDirty(true);
        }
      }
    };

    void hydrateNotes();

    return () => {
      cancelled = true;
    };
  }, [projectId, isOffline, mapStoredNoteToItem]);

  useEffect(() => {
    let cancelled = false;

    const hydrateDrawings = async () => {
      if (
        !projectId ||
        projectId === "null" ||
        projectId === "None" ||
        projectId === ""
      ) {
        if (!cancelled) {
          setCanvasDrawings([]);
          setDrawingsDirty(false);
        }
        return;
      }

      const storageProjectId = projectId === "new" ? "new" : projectId;

      try {
        let records = await getStoredDrawings(storageProjectId, {
          includeDeleted: true,
        });

        if (!records.length) {
          const legacy = loadCanvasDrawings(projectId);
          if (legacy.length) {
            const nowIso = new Date().toISOString();
            records = legacy.map((drawing) => ({
              id: drawing.id,
              project_id: storageProjectId,
              points: drawing.points.map((point) => ({
                x: point.x,
                y: point.y,
              })),
              stroke_color: drawing.strokeColor,
              stroke_width: drawing.strokeWidth,
              is_deleted: Boolean(drawing.isDeleted),
              updated_at: drawing.updatedAt ?? nowIso,
              version: drawing.version ?? 0,
              origin: drawing.origin ?? deviceIdRef.current,
            }));

            await Promise.all(
              records.map((drawing) => upsertStoredDrawing(drawing))
            );
          }
        }

        if (!cancelled) {
          const active = records
            .filter((record) => !record.is_deleted)
            .map(mapStoredDrawingToCanvas);
          setCanvasDrawings(active);

          if (projectId !== "new") {
            const dirty = await areDrawingsDirty(projectId);
            if (!cancelled) {
              setDrawingsDirty(dirty || isOffline);
            }
          } else if (!cancelled) {
            setDrawingsDirty(false);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load workspace drawings", error);
          setDrawingsDirty(true);
        }
      }

      if (cancelled || projectId === "new" || isOffline) {
        return;
      }

      try {
        const snapshot = await fetchProjectDrawings(projectId);
        await recordDrawingSnapshot(projectId, snapshot);

        if (cancelled) return;

        const active = snapshot.drawings
          .filter((record) => !record.is_deleted)
          .map(mapStoredDrawingToCanvas);
        setCanvasDrawings(active);
        setDrawingsDirty(false);
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to pull drawing snapshot", error);
          setDrawingsDirty(true);
        }
      }
    };

    void hydrateDrawings();

    return () => {
      cancelled = true;
    };
  }, [projectId, isOffline, mapStoredDrawingToCanvas]);

  // Persist canvas drawings to localStorage whenever they change
  useEffect(() => {
    if (projectId && projectId !== "new" && canvasDrawings.length > 0) {
      saveCanvasDrawings(projectId, canvasDrawings);
    }
  }, [canvasDrawings, projectId, saveCanvasDrawings]);

  // When projectId becomes a real id (was previously 'new' or undefined), persist any in-memory drawings/lines
  const prevProjectIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;

    const migrateFromNewProject = async () => {
      if (
        projectId &&
        projectId !== "new" &&
        prevProjectIdRef.current === "new"
      ) {
        if (canvasDrawings.length > 0) {
          saveCanvasDrawings(projectId, canvasDrawings);
        }

        try {
          const stagedLines = await getStoredLines("new", {
            includeDeleted: true,
          });
          if (!cancelled && stagedLines.length) {
            const reassigned = stagedLines.map((record) => ({
              ...record,
              project_id: projectId,
            }));
            await replaceStoredProjectLines(projectId, reassigned);
            await replaceStoredProjectLines("new", []);
            if (!cancelled) {
              setLineDrawings(
                reassigned
                  .filter((record) => !record.is_deleted)
                  .map(mapStoredLineToDrawing)
              );
            }
            await markLinesDirty(projectId);
            if (!cancelled) {
              setLinesDirty(true);
            }
          }
        } catch (migrationError) {
          if (!cancelled) {
            console.error(
              "Failed to migrate staged lines to new project",
              migrationError
            );
          }
        }

        try {
          const stagedNotes = await getStoredNotes("new", {
            includeDeleted: true,
          });
          if (!cancelled && stagedNotes.length) {
            const reassignedNotes = stagedNotes.map((record) => ({
              ...record,
              project_id: projectId,
            }));
            await replaceStoredProjectNotes(projectId, reassignedNotes);
            await replaceStoredProjectNotes("new", []);
            if (!cancelled) {
              setItems((prev) => {
                const withoutNotes = prev.filter(
                  (item) => item.type !== "note"
                );
                const noteItems = reassignedNotes
                  .filter((record) => !record.is_deleted)
                  .map(mapStoredNoteToItem);
                return [...withoutNotes, ...noteItems];
              });
            }
            await markNotesDirty(projectId);
            if (!cancelled) {
              setNotesDirty(true);
            }
          }
        } catch (migrationError) {
          if (!cancelled) {
            console.error(
              "Failed to migrate staged notes to new project",
              migrationError
            );
          }
        }

        try {
          const stagedDrawings = await getStoredDrawings("new", {
            includeDeleted: true,
          });
          if (!cancelled && stagedDrawings.length) {
            const reassignedDrawings = stagedDrawings.map((record) => ({
              ...record,
              project_id: projectId,
            }));
            await replaceStoredProjectDrawings(projectId, reassignedDrawings);
            await replaceStoredProjectDrawings("new", []);
            if (!cancelled) {
              const active = reassignedDrawings
                .filter((record) => !record.is_deleted)
                .map(mapStoredDrawingToCanvas);
              setCanvasDrawings(active);
            }
            await markDrawingsDirty(projectId);
            if (!cancelled) {
              setDrawingsDirty(true);
            }
          }
        } catch (migrationError) {
          if (!cancelled) {
            console.error(
              "Failed to migrate staged drawings to new project",
              migrationError
            );
          }
        }
      }
      prevProjectIdRef.current = projectId;
    };

    void migrateFromNewProject();

    return () => {
      cancelled = true;
    };
  }, [
    projectId,
    canvasDrawings,
    saveCanvasDrawings,
    mapStoredLineToDrawing,
    mapStoredNoteToItem,
    mapStoredDrawingToCanvas,
  ]);

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

      if (projectId && projectId !== "new") {
        saveCanvasDrawings(projectId, canvasDrawings);

        try {
          const payload = await getLinesForSave(projectId);
          const response = await saveProjectLinesApi(projectId, payload);
          await recordLineSnapshot(projectId, response);

          setLineDrawings(
            response.lines
              .filter((record) => !record.is_deleted)
              .map(mapStoredLineToDrawing)
          );
          setLineSaveSummary(response.summary);
          setLinesDirty(false);
        } catch (lineError) {
          console.error("Failed to sync workspace lines:", lineError);
          setLineSaveSummary(null);
          setLinesDirty(true);
        }

        try {
          const notePayload = await getNotesForSave(projectId);
          const noteResponse = await saveProjectNotesApi(
            projectId,
            notePayload
          );
          await recordNoteSnapshot(projectId, noteResponse);

          setItems((prev) => {
            const withoutNotes = prev.filter((item) => item.type !== "note");
            const noteItems = noteResponse.notes
              .filter((record) => !record.is_deleted)
              .map(mapStoredNoteToItem);
            return [...withoutNotes, ...noteItems];
          });
          setNoteSaveSummary(noteResponse.summary);
          setNotesDirty(false);
        } catch (noteError) {
          console.error("Failed to sync workspace notes:", noteError);
          setNoteSaveSummary(null);
          setNotesDirty(true);
        }

        try {
          const drawingPayload = await getDrawingsForSave(projectId);
          const drawingResponse = await saveProjectDrawingsApi(
            projectId,
            drawingPayload
          );
          await recordDrawingSnapshot(projectId, drawingResponse);

          const activeDrawings = drawingResponse.drawings
            .filter((record) => !record.is_deleted)
            .map(mapStoredDrawingToCanvas);
          setCanvasDrawings(activeDrawings);
          setDrawingSaveSummary(drawingResponse.summary);
          setDrawingsDirty(false);
        } catch (drawingError) {
          console.error("Failed to sync workspace drawings:", drawingError);
          setDrawingSaveSummary(null);
          setDrawingsDirty(true);
        }
      }
    } catch (err) {
      console.error("Failed to save progress:", err);
    } finally {
      setSaving(false);
    }
  }, [
    project,
    items,
    canvasDrawings,
    projectId,
    saveProgress,
    saving,
    saveCanvasDrawings,
    mapStoredLineToDrawing,
    mapStoredNoteToItem,
    mapStoredDrawingToCanvas,
  ]);

  // Keyboard shortcuts: save, escape, hand (h), move (v)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "s") {
        event.preventDefault();
        handleManualSave();
      }
      if (key === "escape" || key === "esc") {
        setSelectedTool(null);
        setIsDrawingTextArea(false);
        setIsDrawingOnCanvas(false);
        setCurrentCanvasPath(null);
      }
      if (key === "h") {
        setSelectedTool("hand");
      }
      if (key === "v") {
        setSelectedTool(null); // move/select mode
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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

          const rect = canvasEl.getBoundingClientRect();
          const delta = -e.deltaY;
          const zoomFactor = delta > 0 ? 1.1 : 0.9;

          adjustZoom((prevZoom) => prevZoom * zoomFactor, {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
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
  }, [adjustZoom]);

  // Settings dropdown and delete project handlers
  const handleDeleteProject = useCallback(async () => {
    if (!project || !projectId || projectId === "new") return;

    try {
      setIsDeleting(true);
      await deleteProject(projectId);
      navigate("/studio/projects");
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

  // Handle document-level mouse events during line drawing
  useEffect(() => {
    if (!isDrawingLine) return;

    const handleDocumentMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const canvasCoords = {
        x: (event.clientX - rect.left - panOffset.x) / zoom,
        y: (event.clientY - rect.top - panOffset.y) / zoom,
      };

      setLineEndPoint(canvasCoords);
      setHasDragged(true);
    };

    const handleDocumentMouseUp = () => {
      // Only create line if it has meaningful length (> 1 pixel)
      const distance = Math.sqrt(
        Math.pow(lineEndPoint.x - lineStartPoint.x, 2) +
          Math.pow(lineEndPoint.y - lineStartPoint.y, 2)
      );

      if (distance > 1) {
        const lineId = window.crypto?.randomUUID
          ? `line-${window.crypto.randomUUID()}`
          : `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const nowIso = new Date().toISOString();
        const newLine: LineDrawing = {
          id: lineId,
          startPoint: lineStartPoint,
          endPoint: lineEndPoint,
          strokeColor: drawingStrokeColor,
          strokeWidth: drawingStrokeWidth,
          arrowType: lineArrowType,
          isDeleted: false,
          updatedAt: nowIso,
          version: 1,
          origin: deviceIdRef.current,
        };

        setLineDrawings((prev) => [...prev, newLine]);
        setLineSaveSummary(null);

        const storageProjectId =
          projectId && projectId !== "new" ? projectId : "new";
        void upsertStoredLine(mapDrawingToStoredLine(storageProjectId, newLine))
          .then(() => {
            if (projectId && projectId !== "new") {
              return markLinesDirty(projectId);
            }
            return undefined;
          })
          .then(() => {
            setLinesDirty(true);
            setLineSaveSummary(null);
          })
          .catch((persistError) => {
            console.error("Failed to persist line locally:", persistError);
            setLinesDirty(true);
            setLineSaveSummary(null);
          });
      }

      setIsDrawingLine(false);
      setHasDragged(false);
    };

    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [
    isDrawingLine,
    panOffset,
    zoom,
    lineStartPoint,
    lineEndPoint,
    drawingStrokeColor,
    drawingStrokeWidth,
    lineArrowType,
  ]);

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
        // Use created_at if available; show formatted absolute date
        createdAt: proj.created_at
          ? formatDate(proj.created_at)
          : proj.updated_at
          ? formatDate(proj.updated_at)
          : "Unknown",
        toolCount: proj.tools?.length || 0,
      };
    });

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't place tools if user was dragging, no tool selected, or hand tool active
      if (!selectedTool || selectedTool === "hand" || hasDragged) {
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

      // Special handling for line tool - don't place as component
      if (selectedTool === "line") {
        return; // Line drawing is handled via mouse down/move/up events
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

      if (newItem.type === "note") {
        setNoteSaveSummary(null);
        const nowIso = new Date().toISOString();
        newItem.data = {
          content: "",
          updatedAt: nowIso,
          version: 0,
          origin: deviceIdRef.current,
        };
      }

      setItems((prev) => [...prev, newItem]);
      setSelectedTool(null);

      if (newItem.type === "note") {
        const storageProjectId =
          projectId && projectId !== "new" ? projectId : "new";
        const storedRecord = mapItemToStoredNote(storageProjectId, newItem);
        void upsertStoredNote(storedRecord)
          .then(() => {
            if (projectId && projectId !== "new") {
              return markNotesDirty(projectId);
            }
            return undefined;
          })
          .then(() => {
            setNotesDirty(true);
          })
          .catch((persistError) =>
            console.error("Failed to persist note locally:", persistError)
          );
      }
    },
    [selectedTool, zoom, panOffset, hasDragged]
  );

  const handleAddToCanvas = useCallback(
    async (itemData: any) => {
      // Determine viewport-centered canvas position
      let position = { x: 100, y: 100 };
      try {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const screenCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          const canvasCoords = screenToCanvas(screenCenter, rect, {
            zoom,
            panOffset,
          });
          position = {
            x: Math.max(
              0,
              canvasCoords.x - getDefaultSize(itemData.type).width / 2
            ),
            y: Math.max(
              0,
              canvasCoords.y - getDefaultSize(itemData.type).height / 2
            ),
          };
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Center placement failed, using fallback (100,100)", err);
      }

      const newItem: WorkspaceItem = {
        id: `custom-${Date.now()}`,
        type: itemData.type,
        position,
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

      setItems((prev) => [
        ...prev,
        { ...newItem, data: { ...newItem.data, __justAdded: true } },
      ]);
      setShowMendelianModal(false);

      // Remove highlight flag after a short delay
      setTimeout(() => {
        setItems((prev) =>
          prev.map((it) =>
            it.id === newItem.id
              ? { ...it, data: { ...it.data, __justAdded: undefined } }
              : it
          )
        );
      }, 1200);
    },
    [projectId, zoom, panOffset]
  );

  // Handle note text changes
  const handleNoteChange = useCallback(
    async (itemId: string, noteText: string) => {
      const nowIso = new Date().toISOString();
      const projectKey = projectId && projectId !== "new" ? projectId : "new";

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                data: {
                  ...item.data,
                  content: noteText,
                  updatedAt: nowIso,
                  version: (item.data?.version ?? 0) + 1,
                },
              }
            : item
        )
      );

      setNoteSaveSummary(null);

      const existingItem = items.find((item) => item.id === itemId);
      const persistedItem = existingItem
        ? {
            ...existingItem,
            data: {
              ...existingItem.data,
              content: noteText,
              updatedAt: nowIso,
              version: (existingItem.data?.version ?? 0) + 1,
            },
          }
        : null;

      if (
        projectId &&
        projectId !== "new" &&
        existingItem?.type === "mendelian-study"
      ) {
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

      if (!persistedItem || !projectId) {
        return;
      }

      const storedRecord = mapItemToStoredNote(projectKey, persistedItem);

      void upsertStoredNote(storedRecord)
        .then(() => {
          if (projectId && projectId !== "new") {
            return markNotesDirty(projectId);
          }
          return undefined;
        })
        .then(() => {
          setNotesDirty(true);
        })
        .catch((persistError) =>
          console.error("Failed to persist note update", persistError)
        );
    },
    [projectId, items, mapItemToStoredNote, updateMendelianTool]
  );

  const handlePunnettSquareChange = useCallback(
    (itemId: string, updates: {
      parent1Genotype?: string;
      parent2Genotype?: string;
      phenotypeMap?: Record<string, string>
    }) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                data: {
                  ...item.data,
                  ...updates,
                },
              }
            : item
        )
      );

      // Save to local storage
      const projectKey = projectId && projectId !== "new" ? projectId : "new";
      const updatedItems = items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              data: {
                ...item.data,
                ...updates,
              },
            }
          : item
      );
      saveLocalItems(projectKey, updatedItems);
    },
    [items, projectId]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      if (selectedTool === "hand") return; // disable dragging items in hand mode
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
    [items, zoom, panOffset, selectedTool]
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
        const finalizedPath: CanvasDrawing = {
          ...currentCanvasPath,
          updatedAt: new Date().toISOString(),
          version: (currentCanvasPath.version ?? 0) + 1,
          isDeleted: false,
        };
        setCanvasDrawings((prev) => [...prev, finalizedPath]);
        setDrawingSaveSummary(null);

        const storageProjectId =
          projectId && projectId !== "new" ? projectId : "new";

        void upsertStoredDrawing(
          mapCanvasToStoredDrawing(storageProjectId, finalizedPath)
        )
          .then(() => {
            if (projectId && projectId !== "new") {
              return markDrawingsDirty(projectId);
            }
            return undefined;
          })
          .then(() => {
            setDrawingsDirty(true);
          })
          .catch((persistError) =>
            console.error("Failed to persist drawing locally:", persistError)
          );
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

    // Line drawing completion is now handled by document event listener
    // Line eraser stays active (no auto-deselection)

    if (draggedItem) {
      const draggedNote = items.find(
        (workspaceItem) => workspaceItem.id === draggedItem
      );
      if (draggedNote && draggedNote.type === "note") {
        const storageProjectId =
          projectId && projectId !== "new" ? projectId : "new";
        const storedRecord = mapItemToStoredNote(storageProjectId, draggedNote);
        void upsertStoredNote(storedRecord)
          .then(() => {
            if (projectId && projectId !== "new") {
              return markNotesDirty(projectId);
            }
            return undefined;
          })
          .then(() => {
            setNotesDirty(true);
          })
          .catch((persistError) =>
            console.error("Failed to persist note position", persistError)
          );
      }
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
    isDrawingLine,
    lineStartPoint,
    lineEndPoint,
    drawingStrokeColor,
    drawingStrokeWidth,
    lineArrowType,
    projectId,
    mapCanvasToStoredDrawing,
    markDrawingsDirty,
    draggedItem,
    items,
    mapItemToStoredNote,
    markNotesDirty,
  ]);

  // Function to erase lines near a given point (uses functional state update to avoid stale closures)
  const eraseLineAtPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (!lineDrawings.length) {
        return;
      }

      const eraserRadius = 15;
      const linesToDelete: LineDrawing[] = [];

      const remaining = lineDrawings.filter((line) => {
        const { startPoint, endPoint } = line;
        const lineVector = {
          x: endPoint.x - startPoint.x,
          y: endPoint.y - startPoint.y,
        };
        const pointVector = {
          x: point.x - startPoint.x,
          y: point.y - startPoint.y,
        };
        const lineLengthSquared =
          lineVector.x * lineVector.x + lineVector.y * lineVector.y;

        let distance: number;
        if (lineLengthSquared === 0) {
          distance = Math.sqrt(
            pointVector.x * pointVector.x + pointVector.y * pointVector.y
          );
        } else {
          const t = Math.max(
            0,
            Math.min(
              1,
              (pointVector.x * lineVector.x + pointVector.y * lineVector.y) /
                lineLengthSquared
            )
          );
          const closestPoint = {
            x: startPoint.x + t * lineVector.x,
            y: startPoint.y + t * lineVector.y,
          };
          distance = Math.sqrt(
            Math.pow(point.x - closestPoint.x, 2) +
              Math.pow(point.y - closestPoint.y, 2)
          );
        }

        const shouldErase = distance <= eraserRadius;
        if (shouldErase) {
          linesToDelete.push(line);
        }
        return !shouldErase;
      });

      if (!linesToDelete.length) {
        return;
      }

      setLineDrawings(remaining);
      setLineSaveSummary(null);

      const storageProjectId =
        projectId && projectId !== "new" ? projectId : "new";

      const persistOperations = linesToDelete.map((line) => {
        const tombstone: LineDrawing = {
          ...line,
          isDeleted: true,
          updatedAt: new Date().toISOString(),
          version: (line.version ?? 0) + 1,
          origin: line.origin ?? deviceIdRef.current,
        };
        const storedRecord = mapDrawingToStoredLine(
          storageProjectId,
          tombstone
        );
        return upsertStoredLine(storedRecord);
      });

      void Promise.all(persistOperations)
        .then(() => {
          if (projectId && projectId !== "new") {
            return markLinesDirty(projectId);
          }
          return undefined;
        })
        .then(() => {
          setLinesDirty(true);
          setLineSaveSummary(null);
        })
        .catch((persistError) =>
          console.error("Failed to persist tombstoned lines", persistError)
        );
    },
    [lineDrawings, projectId, mapDrawingToStoredLine]
  );

  // While user is actively dragging in eraser mode for lines, erase continuously (placed after eraseLineAtPoint so dependency is defined)
  useEffect(() => {
    if (!isErasingLines) return;

    const handleDocMove = (event: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const canvasCoords = {
        x: (event.clientX - rect.left - panOffset.x) / zoom,
        y: (event.clientY - rect.top - panOffset.y) / zoom,
      };
      eraseLineAtPoint(canvasCoords);
    };

    const handleDocUp = () => {
      setIsErasingLines(false);
    };

    document.addEventListener("mousemove", handleDocMove);
    document.addEventListener("mouseup", handleDocUp);

    return () => {
      document.removeEventListener("mousemove", handleDocMove);
      document.removeEventListener("mouseup", handleDocUp);
    };
  }, [isErasingLines, panOffset, zoom, eraseLineAtPoint]);

  // Handle canvas zoom using imported helpers
  const handleZoomIn = useCallback(() => {
    adjustZoom((prevZoom) => zoomIn(prevZoom));
  }, [adjustZoom]);

  const handleZoomOut = useCallback(() => {
    adjustZoom((prevZoom) => zoomOut(prevZoom));
  }, [adjustZoom]);

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
          updatedAt: new Date().toISOString(),
          version: 0,
          isDeleted: false,
          origin: deviceIdRef.current,
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

      // Handle line drawing (only when not in eraser mode)
      if (
        selectedTool === "line" &&
        !isLineEraserModeRef.current &&
        e.button === 0
      ) {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
          zoom,
          panOffset,
        });
        if (!canvasCoords) return;

        setIsDrawingLine(true);
        setLineStartPoint(canvasCoords);
        setLineEndPoint(canvasCoords);
        setHasDragged(false);
        // Ensure erasing state is off if switching back to drawing
        if (isErasingLines) setIsErasingLines(false);
        return;
      }

      // Handle line eraser mode (when line tool is selected with eraser mode on)
      if (
        selectedTool === "line" &&
        isLineEraserModeRef.current &&
        e.button === 0
      ) {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
          zoom,
          panOffset,
        });
        if (!canvasCoords) return;

        // Immediately check for lines to erase at the click point
        eraseLineAtPoint(canvasCoords);
        // Start continuous erasing until mouseup
        setIsErasingLines(true);
        return;
      } // Allow panning with left mouse when no tool is selected, or middle mouse/Alt+click anytime
      if (
        (e.button === 0 && (!selectedTool || selectedTool === "hand")) ||
        e.button === 1 ||
        (e.button === 0 && e.altKey)
      ) {
        e.preventDefault();
        setIsPanning(true);
        setHasDragged(false); // Reset drag state
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [
      selectedTool,
      zoom,
      panOffset,
      canvasDrawings,
      projectId,
      mapCanvasToStoredDrawing,
      markDrawingsDirty,
    ]
  );

  // Handle panning, text area drawing, and canvas drawing
  const handleCanvasPanMove = useCallback(
    (e: React.MouseEvent) => {
      if (selectedTool === "line") {
      }
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
          const removedDrawings = canvasDrawings.filter((drawing) =>
            pathsToRemove.includes(drawing.id)
          );

          setCanvasDrawings((prev) =>
            prev.filter((drawing) => !pathsToRemove.includes(drawing.id))
          );
          setDrawingSaveSummary(null);

          if (removedDrawings.length) {
            const storageProjectId =
              projectId && projectId !== "new" ? projectId : "new";
            const operations = removedDrawings.map((drawing) => {
              const tombstone: CanvasDrawing = {
                ...drawing,
                isDeleted: true,
                updatedAt: new Date().toISOString(),
                version: (drawing.version ?? 0) + 1,
              };
              return upsertStoredDrawing(
                mapCanvasToStoredDrawing(storageProjectId, tombstone)
              );
            });

            void Promise.all(operations)
              .then(() => {
                if (projectId && projectId !== "new") {
                  return markDrawingsDirty(projectId);
                }
                return undefined;
              })
              .then(() => {
                setDrawingsDirty(true);
              })
              .catch((persistError) =>
                console.error(
                  "Failed to persist erased drawing tombstones",
                  persistError
                )
              );
          }
        }

        setHasDragged(true);
        return;
      }

      // Handle line eraser drag mode
      if (
        selectedTool === "line" &&
        isLineEraserModeRef.current &&
        e.buttons === 1
      ) {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
          zoom,
          panOffset,
        });
        if (!canvasCoords) return;

        // Erase lines while dragging
        eraseLineAtPoint(canvasCoords);
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
            updatedAt: new Date().toISOString(),
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

      if (isDrawingLine) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasCoords = getCanvasCoordinatesFromEvent(e, canvasRef, {
          zoom,
          panOffset,
        });
        if (!canvasCoords) return;

        setLineEndPoint(canvasCoords);
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
    if (!canvasDrawings.length) {
      return;
    }

    const storageProjectId =
      projectId && projectId !== "new" ? projectId : "new";

    const tombstones = canvasDrawings.map((drawing) => ({
      ...drawing,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
      version: (drawing.version ?? 0) + 1,
    }));

    setCanvasDrawings([]);
    setDrawingSaveSummary(null);

    const persistOperations = tombstones.map((drawing) =>
      upsertStoredDrawing(mapCanvasToStoredDrawing(storageProjectId, drawing))
    );

    void Promise.all(persistOperations)
      .then(() => {
        if (projectId && projectId !== "new") {
          return markDrawingsDirty(projectId);
        }
        return undefined;
      })
      .then(() => {
        setDrawingsDirty(true);
      })
      .catch((persistError) =>
        console.error("Failed to persist drawing tombstones", persistError)
      );

    if (projectId && projectId !== "new") {
      saveCanvasDrawings(projectId, []);
    }
  }, [
    canvasDrawings,
    projectId,
    mapCanvasToStoredDrawing,
    markDrawingsDirty,
    saveCanvasDrawings,
  ]);

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

        if (item.type === "note") {
          const storageProjectId =
            projectId && projectId !== "new" ? projectId : "new";
          const tombstone: StoredNoteRecord = {
            ...mapItemToStoredNote(storageProjectId, item),
            is_deleted: true,
            updated_at: new Date().toISOString(),
            version: (item.data?.version ?? 0) + 1,
          };
          await upsertStoredNote(tombstone);
          if (projectId && projectId !== "new") {
            await markNotesDirty(projectId);
            setNotesDirty(true);
          }
        }

        // Remove from local state (works for all item types)
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      } catch (error) {
        console.error("Failed to delete item:", error);
        // You could add a toast notification here
      }
    },
    [items, projectId, mapItemToStoredNote]
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
            onDeleteItem={handleDeleteItem}
            onPunnettSquareChange={handlePunnettSquareChange}
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
    <>
      <WorkspaceLayout
        header={
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
            workspaceDirty={workspaceDirty}
            isOffline={isOffline}
            saveSummary={workspaceSaveSummary}
          />
        }
        leftSidebar={
          <ToolboxSidebar
            isToolsCollapsed={isToolsCollapsed}
            setIsToolsCollapsed={setIsToolsCollapsed}
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            showMendelianModal={showMendelianModal}
            setShowMendelianModal={setShowMendelianModal}
            clearCanvasDrawings={clearCanvasDrawings}
          />
        }
        rightSidebar={
          <ProjectsSidebar
            isProjectsCollapsed={isProjectsCollapsed}
            setIsProjectsCollapsed={setIsProjectsCollapsed}
            existingProjects={existingProjects}
            projectsLoading={projectsLoading}
          />
        }
      >
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
          lineDrawings={lineDrawings}
          isDrawingLine={isDrawingLine}
          lineStartPoint={lineStartPoint}
          lineEndPoint={lineEndPoint}
          isEraserMode={isEraserMode}
          isLineEraserMode={isLineEraserMode}
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
      </WorkspaceLayout>

      {/* Modern Drawing Controls Panel - Samsung Notes Style */}
      {selectedTool === "drawing" && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-3">
          <div className="flex items-center space-x-3">
            {/* Mode Toggle Buttons */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
              <button
                onClick={() => setIsEraserMode(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  !isEraserMode
                    ? "bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
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
                    ? "bg-white dark:bg-slate-900 shadow-sm text-pink-600 dark:text-pink-400"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
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
            <div className="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>

            {/* Drawing Controls - only show when in draw mode */}
            {!isEraserMode && (
              <>
                {/* Color Palette */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
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
                            ? "border-gray-400 dark:border-slate-500 scale-110"
                            : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={drawingStrokeColor}
                      onChange={(e) => setDrawingStrokeColor(e.target.value)}
                      className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-slate-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>

                {/* Brush Size */}
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
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
                      className="w-16 h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 dark:text-slate-400 w-4 text-center">
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
                className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
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

      {/* Line Controls Panel */}
      {selectedTool === "line" && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-3">
          <div className="flex items-center space-x-3">
            {/* Debug: Show current mode */}
            <div className="text-xs text-gray-500 dark:text-slate-400">
              Mode: {isLineEraserMode ? "ERASE" : "DRAW"}
            </div>
            {/* Arrow Type Selection */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
              <button
                onClick={() => setLineArrowType("none")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  lineArrowType === "none"
                    ? "bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                }`}
              >
                <div className="w-6 h-1 bg-current rounded"></div>
                <span className="text-sm font-medium">Line</span>
              </button>
              <button
                onClick={() => setLineArrowType("end")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  lineArrowType === "end"
                    ? "bg-white dark:bg-slate-900 shadow-sm text-green-600 dark:text-green-400"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-current rounded-l"></div>
                  <div className="w-0 h-0 border-l-4 border-l-current border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                </div>
                <span className="text-sm font-medium">Arrow</span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>

            {/* Mode Toggle Buttons */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
              <button
                onClick={() => {
                  setIsLineEraserMode(false);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  !isLineEraserMode
                    ? "bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                }`}
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span className="text-sm font-medium">Draw</span>
              </button>
              <button
                onClick={() => {
                  setIsLineEraserMode(true);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  isLineEraserMode
                    ? "bg-white dark:bg-slate-900 shadow-sm text-red-600 dark:text-red-400"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                }`}
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
                <span className="text-sm font-medium">Erase</span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>

            {/* Color Palette */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Color</span>
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
                        ? "border-gray-400 dark:border-slate-500 scale-110"
                        : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={drawingStrokeColor}
                  onChange={(e) => setDrawingStrokeColor(e.target.value)}
                  className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-slate-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>

            {/* Line Width */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Width</span>
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
                  max="8"
                  value={drawingStrokeWidth}
                  onChange={(e) =>
                    setDrawingStrokeWidth(parseInt(e.target.value))
                  }
                  className="w-16 h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-gray-500 dark:text-slate-400 w-4 text-center">
                  {drawingStrokeWidth}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 ml-4">
              {/* Clear All Lines */}
              <button
                onClick={() => {
                  if (!lineDrawings.length) {
                    return;
                  }

                  const linesSnapshot = [...lineDrawings];
                  setLineDrawings([]);
                  setLineSaveSummary(null);

                  const storageProjectId =
                    projectId && projectId !== "new" ? projectId : "new";

                  const operations = linesSnapshot.map((line) => {
                    const tombstone: LineDrawing = {
                      ...line,
                      isDeleted: true,
                      updatedAt: new Date().toISOString(),
                      version: (line.version ?? 0) + 1,
                      origin: line.origin ?? deviceIdRef.current,
                    };
                    const stored = mapDrawingToStoredLine(
                      storageProjectId,
                      tombstone
                    );
                    return upsertStoredLine(stored);
                  });

                  void Promise.all(operations)
                    .then(() => {
                      if (projectId && projectId !== "new") {
                        return markLinesDirty(projectId);
                      }
                      return undefined;
                    })
                    .then(() => {
                      setLinesDirty(true);
                      setLineSaveSummary(null);
                    })
                    .catch((persistError) =>
                      console.error(
                        "Failed to persist cleared line tombstones",
                        persistError
                      )
                    );
                }}
                className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Clear All Lines"
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
                className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Exit Line Mode"
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
    </>
  );
};

export default ProjectWorkspace;
