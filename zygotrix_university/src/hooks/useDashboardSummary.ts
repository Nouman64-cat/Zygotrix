import { useEffect, useMemo, useState } from "react";

import type { DashboardSummary } from "../types";
import { universityService } from "../services/useCases/universityService";

export const useDashboardSummary = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    universityService
      .getDashboardSummary()
      .then((response) => {
        if (active) {
          setSummary(response);
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
      summary,
      loading,
      error,
    }),
    [summary, loading, error],
  );
};

export type UseDashboardSummaryResult = ReturnType<typeof useDashboardSummary>;
