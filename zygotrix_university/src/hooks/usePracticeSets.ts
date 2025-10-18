import { useEffect, useMemo, useState } from "react";

import type { PracticeSet } from "../types";
import { universityService } from "../services/useCases/universityService";

export const usePracticeSets = () => {
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    universityService
      .getPracticeSets()
      .then((response) => {
        if (active) {
          setPracticeSets(response);
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
  }, []);

  return useMemo(
    () => ({
      practiceSets,
      loading,
      error,
    }),
    [practiceSets, loading, error],
  );
};

export type UsePracticeSetsResult = ReturnType<typeof usePracticeSets>;
