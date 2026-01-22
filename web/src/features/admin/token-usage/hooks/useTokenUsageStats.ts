import { useState, useEffect, useCallback } from "react";
import {
    getTokenUsageStats,
    getDailyTokenUsage,
    type DailyUsageResponse,
} from "../../../../services/chatbotService";
import { fetchChatbotSettings } from "../../../../services/admin.api";
import type { TokenUsageStats } from "../types";
import type { ChatbotSettings } from "../../../../types/auth";

export const useTokenUsageStats = (chartDays: number) => {
    const [stats, setStats] = useState<TokenUsageStats | null>(null);
    const [dailyData, setDailyData] = useState<DailyUsageResponse | null>(null);
    const [chatbotSettings, setChatbotSettings] = useState<ChatbotSettings | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [statsData, settingsData] = await Promise.all([
                getTokenUsageStats(),
                fetchChatbotSettings(),
            ]);

            if (statsData) {
                setStats(statsData as TokenUsageStats);
            } else {
                throw new Error("Failed to fetch token usage statistics");
            }

            setChatbotSettings(settingsData);
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to fetch statistics";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDaily = useCallback(async () => {
        try {
            const data = await getDailyTokenUsage(chartDays);
            if (data) {
                setDailyData(data);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch daily data:", err);
        }
    }, [chartDays]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchDaily();
    }, [fetchDaily]);

    const refresh = () => {
        fetchData();
        fetchDaily();
    };

    return {
        stats,
        dailyData,
        chatbotSettings,
        loading,
        error,
        refresh,
    };
};
