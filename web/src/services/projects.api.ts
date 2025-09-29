import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type {
  MendelianSimulationTraitResult,
  Project,
  ProjectCreateRequest,
  ProjectDrawingPayload,
  ProjectDrawingSaveResponse,
  ProjectDrawingSnapshot,
  ProjectLinePayload,
  ProjectLineSaveResponse,
  ProjectLineSnapshot,
  ProjectListResponse,
  ProjectNotePayload,
  ProjectNoteSaveResponse,
  ProjectNoteSnapshot,
  ProjectResponse,
  ProjectTemplate,
  ProjectTemplateListResponse,
  ProjectUpdateRequest,
} from "../types/api";

type ProjectToolPayload = {
  name: string;
  trait_configurations?: Record<string, Record<string, string>>;
  simulation_results?: Record<string, MendelianSimulationTraitResult>;
  notes?: string;
  position?: { x: number; y: number };
};

export const fetchProjects = async (
  page: number = 1,
  pageSize: number = 20,
  signal?: AbortSignal,
): Promise<ProjectListResponse> => {
  const response = await API.get<ProjectListResponse>(API_ROUTES.projects.root, {
    params: { page, page_size: pageSize },
    signal,
  });
  return response.data;
};

export const fetchProject = async (
  projectId: string,
  signal?: AbortSignal,
): Promise<Project> => {
  const response = await API.get<ProjectResponse>(
    API_ROUTES.projects.detail(projectId),
    { signal },
  );
  return response.data.project;
};

export const createProject = async (
  payload: ProjectCreateRequest,
): Promise<Project> => {
  const response = await API.post<ProjectResponse>(
    API_ROUTES.projects.root,
    payload,
  );
  return response.data.project;
};

export const updateProject = async (
  projectId: string,
  payload: ProjectUpdateRequest,
): Promise<Project> => {
  const response = await API.put<ProjectResponse>(
    API_ROUTES.projects.detail(projectId),
    payload,
  );
  return response.data.project;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await API.delete(API_ROUTES.projects.detail(projectId));
};

export const fetchProjectTemplates = async (
  signal?: AbortSignal,
): Promise<ProjectTemplate[]> => {
  const response = await API.get<ProjectTemplateListResponse>(
    API_ROUTES.projectTemplates.root,
    { signal },
  );
  return response.data.templates;
};

export const saveProjectProgress = async (
  projectId: string,
  tools: any[],
): Promise<Project> => updateProject(projectId, { tools });

export const fetchProjectNotes = async (
  projectId: string,
  signal?: AbortSignal,
): Promise<ProjectNoteSnapshot> => {
  const response = await API.get<ProjectNoteSnapshot>(
    API_ROUTES.projects.notes(projectId),
    { signal },
  );
  return response.data;
};

export const saveProjectNotes = async (
  projectId: string,
  notes: ProjectNotePayload[],
): Promise<ProjectNoteSaveResponse> => {
  const response = await API.post<ProjectNoteSaveResponse>(
    API_ROUTES.projects.notesSave(projectId),
    { notes },
  );
  return response.data;
};

export const fetchProjectDrawings = async (
  projectId: string,
  signal?: AbortSignal,
): Promise<ProjectDrawingSnapshot> => {
  const response = await API.get<ProjectDrawingSnapshot>(
    API_ROUTES.projects.drawings(projectId),
    { signal },
  );
  return response.data;
};

export const saveProjectDrawings = async (
  projectId: string,
  drawings: ProjectDrawingPayload[],
): Promise<ProjectDrawingSaveResponse> => {
  const response = await API.post<ProjectDrawingSaveResponse>(
    API_ROUTES.projects.drawingsSave(projectId),
    { drawings },
  );
  return response.data;
};

export const fetchProjectLines = async (
  projectId: string,
  signal?: AbortSignal,
): Promise<ProjectLineSnapshot> => {
  const response = await API.get<ProjectLineSnapshot>(
    API_ROUTES.projects.lines(projectId),
    { signal },
  );
  return response.data;
};

export const saveProjectLines = async (
  projectId: string,
  lines: ProjectLinePayload[],
): Promise<ProjectLineSaveResponse> => {
  const response = await API.post<ProjectLineSaveResponse>(
    API_ROUTES.projects.linesSave(projectId),
    { lines },
  );
  return response.data;
};

export const createMendelianTool = async (
  projectId: string,
  toolData: ProjectToolPayload,
): Promise<any> => {
  const response = await API.post(
    API_ROUTES.projects.tools(projectId),
    toolData,
  );
  return response.data;
};

export const updateMendelianTool = async (
  projectId: string,
  toolId: string,
  updates: Partial<ProjectToolPayload>,
): Promise<any> => {
  const response = await API.put(
    API_ROUTES.projects.toolDetail(projectId, toolId),
    updates,
  );
  return response.data;
};

export const deleteMendelianTool = async (
  projectId: string,
  toolId: string,
): Promise<void> => {
  await API.delete(API_ROUTES.projects.toolDetail(projectId, toolId));
};

