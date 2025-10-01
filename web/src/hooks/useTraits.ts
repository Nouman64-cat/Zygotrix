import { useCallback, useEffect, useState } from "react";

import { fetchTraits } from "../services/traits.api";
import type { TraitInfo, TraitFilters } from "../types/api";

type TraitsHook = {
  traits: TraitInfo[];
  loading: boolean;
  error: string | null;
  reload: (filters?: TraitFilters) => void;
  applyFilters: (filters: TraitFilters) => void;
};

export const useTraits = (): TraitsHook => {
  const [traits, setTraits] = useState<TraitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<TraitFilters>({});

  const load = useCallback(
    (signal?: AbortSignal, filters?: TraitFilters) => {
      setLoading(true);
      setError(null);

      const filtersToUse = filters || currentFilters;

      fetchTraits(signal, filtersToUse)
        .then((data) => {
          if (!signal?.aborted) {
            setTraits(data);
          }
        })
        .catch((err) => {
          if (!signal?.aborted) {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to load trait catalogue."
            );
          }
        })
        .finally(() => {
          if (!signal?.aborted) {
            setLoading(false);
          }
        });
    },
    [currentFilters]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(
    (filters?: TraitFilters) => {
      load(undefined, filters);
    },
    [load]
  );

  const applyFilters = useCallback(
    (filters: TraitFilters) => {
      setCurrentFilters(filters);
      const controller = new AbortController();
      load(controller.signal, filters);
    },
    [load]
  );

  return { traits, loading, error, reload, applyFilters };
};
