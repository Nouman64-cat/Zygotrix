import { useCallback, useEffect, useState } from "react";

import { fetchPolygenicScore } from "../services/mendelian.api";

type PolygenicHook = {
  score: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export const usePolygenicScore = (): PolygenicHook => {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    fetchPolygenicScore(signal)
      .then((payload) => {
        if (!signal?.aborted) {
          setScore(payload.expected_score);
        }
      })
      .catch((err) => {
        if (!signal?.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load polygenic score.");
        }
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { score, loading, error, refresh };
};