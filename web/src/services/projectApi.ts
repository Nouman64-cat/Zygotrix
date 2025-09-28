import type {
  Project,
  ProjectCreateRequest,
  ProjectListResponse,
  ProjectResponse,
  ProjectLinePayload,
  ProjectLineSaveResponse,
  ProjectLineSnapshot,
  ProjectNotePayload,
  ProjectNoteSaveResponse,
  ProjectNoteSnapshot,
  ProjectDrawingPayload,
  ProjectDrawingSaveResponse,
  ProjectDrawingSnapshot,
  ProjectTemplate,
  ProjectTemplateListResponse,
  ProjectUpdateRequest,
} from "../types/api";
import { parseJsonResponse, parseVoidResponse } from "./http";

export const API_BASE_URL =
  import.meta.env.VITE_ZYGOTRIX_API ?? "http://127.0.0.1:8000";

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("zygotrix_auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchProjects = async (
  page: number = 1,
  pageSize: number = 20,
  signal?: AbortSignal
): Promise<ProjectListResponse> => {
  const url = new URL(`${API_BASE_URL}/api/projects`);
  url.searchParams.set("page", page.toString());
  url.searchParams.set("page_size", pageSize.toString());

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
    signal,
  });
  return parseJsonResponse<ProjectListResponse>(response);
};

export const fetchProject = async (
  projectId: string,
  signal?: AbortSignal
): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    headers: getAuthHeaders(),
    signal,
  });

  const result = await parseJsonResponse<ProjectResponse>(response);
  return result.project;
};

export const createProject = async (
  payload: ProjectCreateRequest
): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await parseJsonResponse<ProjectResponse>(response);
  return result.project;
};

export const updateProject = async (
  projectId: string,
  payload: ProjectUpdateRequest
): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await parseJsonResponse<ProjectResponse>(response);
  return result.project;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await parseVoidResponse(response);
};

export const fetchProjectTemplates = async (
  signal?: AbortSignal
): Promise<ProjectTemplate[]> => {
  const response = await fetch(`${API_BASE_URL}/api/project-templates`, {
    signal,
  });

  const result = await parseJsonResponse<ProjectTemplateListResponse>(response);
  return result.templates;
};

export const saveProjectProgress = async (
  projectId: string,
  tools: any[]
): Promise<Project> => {
  return updateProject(projectId, { tools });
};

export const fetchProjectNotes = async (
  projectId: string,
  signal?: AbortSignal
): Promise<ProjectNoteSnapshot> => {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/notes`,
    {
      headers: getAuthHeaders(),
      signal,
    }
  );
  return parseJsonResponse<ProjectNoteSnapshot>(response);
};

export const saveProjectNotes = async (
  projectId: string,
  notes: ProjectNotePayload[]
): Promise<ProjectNoteSaveResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/notes/save`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    }
  );
  return parseJsonResponse<ProjectNoteSaveResponse>(response);
};

export const fetchProjectDrawings = async (
  projectId: string,
  signal?: AbortSignal
): Promise<ProjectDrawingSnapshot> => {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/drawings`,
    {
      headers: getAuthHeaders(),
      signal,
    }
  );
  return parseJsonResponse<ProjectDrawingSnapshot>(response);
};

export const saveProjectDrawings = async (
  projectId: string,
  drawings: ProjectDrawingPayload[]
): Promise<ProjectDrawingSaveResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/drawings/save`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ drawings }),
    }
  );
  return parseJsonResponse<ProjectDrawingSaveResponse>(response);
};

export const fetchProjectLines = async (
  projectId: string,
  signal?: AbortSignal
): Promise<ProjectLineSnapshot> => {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/lines`,
    {
      headers: getAuthHeaders(),
      signal,
    }
  );
  return parseJsonResponse<ProjectLineSnapshot>(response);
};

export const saveProjectLines = async (
  projectId: string,
  lines: ProjectLinePayload[]
): Promise<ProjectLineSaveResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/lines/save`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ lines }),
    }
  );
  return parseJsonResponse<ProjectLineSaveResponse>(response);
};
