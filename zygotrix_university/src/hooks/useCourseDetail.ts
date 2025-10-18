import { useCallback, useEffect, useMemo, useState } from "react";

import type { Course } from "../types";
import { universityService } from "../services/useCases/universityService";

export const useCourseDetail = (slug: string | undefined) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState<Error | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!slug) {
      setCourse(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await universityService.getCourseBySlug(slug);
      setCourse(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unable to load course");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    fetchCourse().catch(() => {
      if (!active) {
        return;
      }
    });
    return () => {
      active = false;
    };
  }, [fetchCourse]);

  return useMemo(
    () => ({
      course,
      loading,
      error,
      refetch: fetchCourse,
    }),
    [course, loading, error, fetchCourse],
  );
};

export type UseCourseDetailResult = ReturnType<typeof useCourseDetail>;
