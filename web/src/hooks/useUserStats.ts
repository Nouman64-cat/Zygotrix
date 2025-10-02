import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchUserTraitsCount,
  fetchPublicTraitsCount,
} from "../services/traits.api";
import { fetchUserProjects } from "../services/project.api";

export interface UserStats {
  traitsCount: number | null;
  projectsCount: number | null;
  publicTraitsCount: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching user statistics
 * Provides trait count, project count, loading state, and error handling
 * Automatically refetches when authentication state changes
 */
export const useUserStats = (): UserStats => {
  const { token } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    traitsCount: null,
    projectsCount: null,
    publicTraitsCount: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!token) {
      setStats({
        traitsCount: null,
        projectsCount: null,
        publicTraitsCount: null,
        loading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchStats = async () => {
      if (!isMounted) return;

      setStats((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Fetch all stats in parallel
        const [traitsCount, projectsResponse, publicTraitsCount] =
          await Promise.all([
            fetchUserTraitsCount(controller.signal),
            fetchUserProjects(token, 1, 1), // Fetch minimal data just for count
            fetchPublicTraitsCount(controller.signal),
          ]);

        if (!isMounted) return;

        const projectsCount =
          typeof projectsResponse.total === "number"
            ? projectsResponse.total
            : Number(projectsResponse.total) || 0;

        setStats({
          traitsCount,
          projectsCount,
          publicTraitsCount,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!isMounted) return;

        // Don't treat abort as an error
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setStats((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch user statistics",
        }));
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token]);

  return stats;
};

/**
 * Custom hook for fetching only trait count
 * Lightweight version when only trait statistics are needed
 */
export const useUserTraitsCount = (): Pick<
  UserStats,
  "traitsCount" | "loading" | "error"
> => {
  const { token } = useAuth();
  const [state, setState] = useState<{
    traitsCount: number | null;
    loading: boolean;
    error: string | null;
  }>({
    traitsCount: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!token) {
      setState({
        traitsCount: null,
        loading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchTraitsCount = async () => {
      if (!isMounted) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const count = await fetchUserTraitsCount(controller.signal);

        if (!isMounted) return;

        setState({
          traitsCount: count,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!isMounted) return;

        // Don't treat abort as an error
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch traits count",
        }));
      }
    };

    fetchTraitsCount();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token]);

  return state;
};
