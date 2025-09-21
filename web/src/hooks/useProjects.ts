import { useCallback, useEffect, useState } from "react";
import type {
  Project,
  ProjectCreateRequest,
  ProjectTemplate,
  ProjectUpdateRequest,
} from "../types/api";
import * as projectApi from "../services/projectApi";

export const useProjects = (page: number = 1, pageSize: number = 20) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await projectApi.fetchProjects(page, pageSize);
      setProjects(result.projects);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(async (payload: ProjectCreateRequest) => {
    try {
      const newProject = await projectApi.createProject(payload);
      setProjects((prev) => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create project";
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateProject = useCallback(
    async (projectId: string, payload: ProjectUpdateRequest) => {
      try {
        const updatedProject = await projectApi.updateProject(
          projectId,
          payload
        );
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId ? updatedProject : project
          )
        );
        return updatedProject;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update project";
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await projectApi.deleteProject(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete project";
      setError(message);
      throw new Error(message);
    }
  }, []);

  return {
    projects,
    total,
    loading,
    error,
    refetch: loadProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

export const useProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await projectApi.fetchProject(projectId);
      setProject(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const saveProgress = useCallback(
    async (tools: any[]) => {
      if (!projectId) return;

      try {
        const updatedProject = await projectApi.saveProjectProgress(
          projectId,
          tools
        );
        setProject(updatedProject);
        return updatedProject;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save progress";
        setError(message);
        throw new Error(message);
      }
    },
    [projectId]
  );

  const updateProject = useCallback(
    async (payload: ProjectUpdateRequest) => {
      if (!projectId) return;

      try {
        const updatedProject = await projectApi.updateProject(
          projectId,
          payload
        );
        setProject(updatedProject);
        return updatedProject;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update project";
        setError(message);
        throw new Error(message);
      }
    },
    [projectId]
  );

  return {
    project,
    loading,
    error,
    refetch: loadProject,
    saveProgress,
    updateProject,
  };
};

export const useProjectTemplates = () => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await projectApi.fetchProjectTemplates();
      setTemplates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    refetch: loadTemplates,
  };
};
