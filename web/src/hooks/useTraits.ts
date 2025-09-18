import { useCallback, useEffect, useState } from "react";

import { fetchTraits } from "../services/zygotrixApi";
import type { TraitInfo } from "../types/api";

type TraitsHook = {
  traits: TraitInfo[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export const useTraits = (): TraitsHook => {
  const [traits, setTraits] = useState<TraitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    fetchTraits(signal)
      .then((data) => {
        if (!signal?.aborted) {
          setTraits(data);
        }
      })
      .catch((err) => {
        if (!signal?.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load trait catalogue.");
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

  const reload = useCallback(() => {
    load();
  }, [load]);

  return { traits, loading, error, reload };
};
