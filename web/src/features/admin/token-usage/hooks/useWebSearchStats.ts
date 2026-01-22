import { useState, useEffect, useCallback } from "react";
import {
    getWebSearchStats,
    getDailyWebSearchUsage,
    type WebSearchStats,
    type WebSearchDailyResponse,
} from "../../../../services/chatbotService";

export const useWebSearchStats = (chartDays: number) => {
    const [stats, setStats] = useState<WebSearchStats | null>(null);
    const [dailyData, setDailyData] = useState<WebSearchDailyResponse | null>(
        null,
    );
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getWebSearchStats();
            if (data) {
                setStats(data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch web search stats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDaily = useCallback(async () => {
        try {
            const data = await getDailyWebSearchUsage(chartDays);
            if (data) {
                setDailyData(data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch web search daily data:", err);
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
