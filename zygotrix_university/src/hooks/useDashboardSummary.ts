import { useCallback, useEffect, useMemo, useState } from "react";

import type { DashboardSummary } from "../types";
import { universityService } from "../services/useCases/universityService";

export const useDashboardSummary = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

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
  }, [refreshKey]);

  return useMemo(
    () => ({
      summary,
      loading,
      error,
      refetch,
    }),
    [summary, loading, error, refetch]
  );
};

export type UseDashboardSummaryResult = ReturnType<typeof useDashboardSummary>;
