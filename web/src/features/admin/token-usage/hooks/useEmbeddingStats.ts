import { useState, useEffect, useCallback } from "react";
import {
    getEmbeddingUsageStats,
    getDailyEmbeddingUsage,
    type EmbeddingUsageStats as EmbeddingStats,
    type EmbeddingDailyUsageResponse,
} from "../../../../services/chatbotService";

export const useEmbeddingStats = (chartDays: number) => {
    const [stats, setStats] = useState<EmbeddingStats | null>(null);
    const [dailyData, setDailyData] =
        useState<EmbeddingDailyUsageResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getEmbeddingUsageStats();
            if (data) {
                setStats(data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch embedding stats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDaily = useCallback(async () => {
        try {
            const data = await getDailyEmbeddingUsage(chartDays);
            if (data) {
                setDailyData(data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch embedding daily data:", err);
        }
    }, [chartDays]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchDaily();
    }, [fetchDaily]);

    const refresh = () => {
        fetchStats();
        fetchDaily();
    };

    return {
        stats,
        dailyData,
        loading,
        refresh,
    };
};
