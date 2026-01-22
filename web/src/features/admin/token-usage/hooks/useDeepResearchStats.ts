import { useState, useEffect, useCallback } from "react";
import {
    getDeepResearchStats,
    getDailyDeepResearchUsage,
    type DeepResearchStats,
    type DeepResearchDailyResponse,
} from "../../../../services/chatbotService";

export const useDeepResearchStats = (chartDays: number) => {
    const [stats, setStats] = useState<DeepResearchStats | null>(null);
    const [dailyData, setDailyData] = useState<DeepResearchDailyResponse | null>(
        null,
    );
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getDeepResearchStats();
            if (data) {
                setStats(data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch deep research stats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDaily = useCallback(async () => {
        try {
            const data = await getDailyDeepResearchUsage(chartDays);
            if (data) {
                setDailyData(data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch deep research daily data:", err);
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
