import { useEffect, useMemo, useState } from "react";

import type { Course } from "../types";
import { universityService } from "../services/useCases/universityService";

interface UseCoursesOptions {
  includeDetails?: boolean;
}

export const useCourses = ({ includeDetails = false }: UseCoursesOptions = {}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    universityService
      .getCourses(includeDetails)
      .then((response) => {
        if (active) {
          setCourses(response);
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
  }, [includeDetails]);

  return useMemo(
    () => ({
      courses,
      loading,
      error,
    }),
    [courses, loading, error],
  );
};

export type UseCoursesResult = ReturnType<typeof useCourses>;
