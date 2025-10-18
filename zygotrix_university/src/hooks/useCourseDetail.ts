import { useEffect, useMemo, useState } from "react";

import type { Course } from "../types";
import { universityService } from "../services/useCases/universityService";

export const useCourseDetail = (slug: string | undefined) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setCourse(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    universityService
      .getCourseBySlug(slug)
      .then((response) => {
        if (active) {
          setCourse(response);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return useMemo(
    () => ({
      course,
      loading,
      error,
    }),
    [course, loading, error],
  );
};

export type UseCourseDetailResult = ReturnType<typeof useCourseDetail>;
