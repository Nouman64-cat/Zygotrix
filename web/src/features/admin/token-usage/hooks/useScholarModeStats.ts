import { useState, useEffect, useCallback } from "react";
import {
    getScholarModeStats,
    getDailyScholarModeUsage,
    type ScholarModeStats,
    type ScholarModeDailyResponse,
} from "../../../../services/chatbotService";

export const useScholarModeStats = (chartDays: number) => {
    const [stats, setStats] = useState<ScholarModeStats | null>(null);
    const [dailyData, setDailyData] = useState<ScholarModeDailyResponse | null>(
        null,
    );
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getScholarModeStats();
            if (data) {
                setStats(data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch scholar mode stats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDaily = useCallback(async () => {
        try {
            const data = await getDailyScholarModeUsage(chartDays);
            if (data) {
                setDailyData(data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch scholar mode daily data:", err);
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
