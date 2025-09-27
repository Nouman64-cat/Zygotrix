import type {
  Project,
  ProjectCreateRequest,
  ProjectListResponse,
  ProjectResponse,
  ProjectLinePayload,
  ProjectLineSaveResponse,
  ProjectLineSnapshot,
  ProjectTemplate,
  ProjectTemplateListResponse,
  ProjectUpdateRequest,
} from "../types/api";

export const API_BASE_URL =
  import.meta.env.VITE_ZYGOTRIX_API ?? "http://127.0.0.1:8000";

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
};

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

  return handleResponse<ProjectListResponse>(response);
};

export const fetchProject = async (
  projectId: string,
  signal?: AbortSignal
): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    headers: getAuthHeaders(),
    signal,
  });

  const result = await handleResponse<ProjectResponse>(response);
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

  const result = await handleResponse<ProjectResponse>(response);
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

  const result = await handleResponse<ProjectResponse>(response);
  return result.project;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Delete failed with status ${response.status}`);
  }
};

export const fetchProjectTemplates = async (
  signal?: AbortSignal
): Promise<ProjectTemplate[]> => {
  const response = await fetch(`${API_BASE_URL}/api/project-templates`, {
    signal,
  });

  const result = await handleResponse<ProjectTemplateListResponse>(response);
  return result.templates;
};

export const saveProjectProgress = async (
  projectId: string,
  tools: any[]
): Promise<Project> => {
  return updateProject(projectId, { tools });
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

  return handleResponse<ProjectLineSnapshot>(response);
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

  return handleResponse<ProjectLineSaveResponse>(response);
};
