import React, { useEffect, useMemo } from "react";
import { FaChartLine, FaDatabase, FaUsers } from "react-icons/fa";
import { MdTrendingUp } from "react-icons/md";
import { HiSparkles } from "react-icons/hi";
import { BiLoaderAlt } from "react-icons/bi";
import type { ChartData } from "chart.js";

import { useScholarModeStats } from "../../hooks/useScholarModeStats";
import StatsCard from "../../components/shared/StatsCard";
import HeroStatCard from "../../components/shared/HeroStatCard";
import UsageChart from "../../components/shared/UsageChart";
import UserUsageTable from "../../components/shared/UserUsageTable";
import { formatNumber } from "../../utils/formatters";

interface ScholarModeTabProps {
    chartDays: number;
    onChartDaysChange: (days: number) => void;
    refreshSignal: number;
}

const ScholarModeTab: React.FC<ScholarModeTabProps> = ({
    chartDays,
    onChartDaysChange,
    refreshSignal,
}) => {
    const { stats, dailyData, loading, refresh } =
        useScholarModeStats(chartDays);

    useEffect(() => {
        if (refreshSignal > 0) {
            refresh();
        }
    }, [refreshSignal, refresh]);

    // Chart Data Preparation
    const chartData: ChartData<"line"> = useMemo(() => {
        if (!dailyData) return { labels: [], datasets: [] };

        return {
            labels: dailyData.daily_usage.map((d) => {
                const date = new Date(d.date);
                return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });
            }),
            datasets: [
                {
                    label: "Queries",
                    data: dailyData.daily_usage.map((d) => d.queries),
                    borderColor: "rgb(168, 85, 247)",
                    backgroundColor: "rgba(168, 85, 247, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                },
                {
                    label: "Cost (cents)",
                    data: dailyData.daily_usage.map((d) => d.total_cost * 100),
                    borderColor: "rgb(16, 185, 129)",
                    backgroundColor: "rgba(16, 185, 129, 0.05)",
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                    yAxisID: "y1",
                },
            ],
        };
    }, [dailyData]);

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index" as const,
                intersect: false,
            },
            plugins: {
                legend: {
                    position: "top" as const,
                    labels: { usePointStyle: true, padding: 20 },
                },
                tooltip: {
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    titleColor: "#fff",
                    bodyColor: "#e2e8f0",
                    borderColor: "rgba(168, 85, 247, 0.3)",
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function (context: any) {
                            const label = context.dataset.label || "";
                            const value = context.parsed.y;
                            if (label === "Cost (cents)") {
                                return `${label}: ${value.toFixed(2)}¢`;
                            }
                            return `${label}: ${formatNumber(value)}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, minRotation: 45 },
                },
                y: {
                    type: "linear" as const,
                    display: true,
                    position: "left" as const,
                    title: { display: true, text: "Queries" },
                    grid: { color: "rgba(148, 163, 184, 0.1)" },
                },
                y1: {
                    type: "linear" as const,
                    display: true,
                    position: "right" as const,
                    title: { display: true, text: "Cost (cents)" },
                    grid: { drawOnChartArea: false },
                    ticks: {
                        callback: function (value: number | string) {
                            const num = typeof value === "string" ? parseFloat(value) : value;
                            return `${num.toFixed(1)}¢`;
                        },
                    },
                },
            },
        }),
        [],
    );

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center py-20">
                <BiLoaderAlt className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!stats) return null;

    const claudeCostAvg =
        stats.total_queries > 0
            ? (stats.total_token_cost / stats.total_queries).toFixed(4)
            : "0";
    const cohereCostAvg =
        stats.total_queries > 0
            ? (stats.total_source_cost / stats.total_queries).toFixed(4)
            : "0";
    const avgTokens =
        stats.total_queries > 0
            ? Math.round(
                (stats.total_input_tokens + stats.total_output_tokens) / stats.total_queries
            )
            : 0;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* HERO */}
            <HeroStatCard
                title="Average Cost Per Request"
                subtitle="Scholar Mode (including all token consumption)"
                value={`$${stats.avg_cost_per_query?.toFixed(4) || "0.0000"}`}
                valueSubtext="per scholar research session"
                icon={<span className="text-3xl">🎓</span>}
                gradient="from-purple-500 via-purple-600 to-violet-600"
                borderColor="border-purple-400/30"
                footerItems={[
                    { color: "bg-indigo-300", label: `Claude (Sonnet + Haiku) Tokens: $${claudeCostAvg}/avg` },
                    { color: "bg-purple-300", label: `Cohere (Rerank): $${cohereCostAvg}/avg` },
                    { color: "bg-emerald-300", label: `Avg ${formatNumber(avgTokens)} tok/req` },
                ]}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <StatsCard
                    title="Total Queries"
                    value={formatNumber(stats.total_queries)}
                    subtext="Scholar Mode sessions"
                    icon={<span className="text-lg">🎓</span>}
                    iconBgColor="bg-purple-100 dark:bg-purple-500/20"
                />
                <StatsCard
                    title="Total Tokens"
                    value={formatNumber(stats.total_input_tokens + stats.total_output_tokens)}
                    subtext={`${formatNumber(stats.total_input_tokens)} in / ${formatNumber(stats.total_output_tokens)} out`}
                    icon={<HiSparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" />}
                    iconBgColor="bg-indigo-100 dark:bg-indigo-500/20"
                />
                <StatsCard
                    title="Sources Used"
                    value={formatNumber(stats.total_deep_research_sources + stats.total_web_search_sources)}
                    subtext={`📚 ${formatNumber(stats.total_deep_research_sources)} KB / 🌐 ${formatNumber(stats.total_web_search_sources)} Web`}
                    icon={<FaDatabase className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 dark:text-cyan-400" />}
                    iconBgColor="bg-cyan-100 dark:bg-cyan-500/20"
                />
                <StatsCard
                    title="Total Cost"
                    value={`$${stats.total_cost?.toFixed(4) || "0.0000"}`}
                    subtext={`$${stats.avg_cost_per_query?.toFixed(4) || "0"}/query avg`}
                    icon={<FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400" />}
                    iconBgColor="bg-emerald-100 dark:bg-emerald-500/20"
                    valueColor="text-emerald-600 dark:text-emerald-400"
                />
            </div>

            {/* Chart */}
            <div>
                <UsageChart
                    title="Scholar Mode Usage Over Time"
                    data={chartData}
                    options={chartOptions}
                    days={chartDays}
                    onDaysChange={onChartDaysChange}
                    icon={<MdTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />}
                />
            </div>

            {/* Projected Costs Grid */}
            {dailyData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-3 sm:p-5 shadow-lg text-white">
                        <div className="text-xs sm:text-sm opacity-90 mb-1">Days with Data</div>
                        <div className="text-xl sm:text-2xl font-bold">{dailyData.days_with_data}</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-xl p-3 sm:p-5 shadow-lg text-white">
                        <div className="text-xs sm:text-sm opacity-90 mb-1">Avg Daily Cost</div>
                        <div className="text-xl sm:text-2xl font-bold">${dailyData.avg_daily_cost.toFixed(4)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-xl p-3 sm:p-5 shadow-lg text-white">
                        <div className="text-xs sm:text-sm opacity-90 mb-1">Projected/Month</div>
                        <div className="text-xl sm:text-2xl font-bold">${dailyData.projected_monthly_cost.toFixed(2)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl p-3 sm:p-5 shadow-lg text-white">
                        <div className="text-xs sm:text-sm opacity-90 mb-1">Total Users</div>
                        <div className="text-xl sm:text-2xl font-bold">{stats.user_count}</div>
                    </div>
                </div>
            )}

            {/* User Table */}
            <UserUsageTable
                title="Scholar Mode Usage by User"
                titleIcon={<FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />}
                users={stats.users}
                headers={[
                    { label: "User" },
                    { label: "Queries", className: "text-right" },
                    { label: "Tokens", className: "text-right hidden sm:table-cell" },
                    { label: "Sources", className: "text-right hidden lg:table-cell" },
                    { label: "Cost", className: "text-right" },
                ]}
                renderRow={(user: any) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{user.user_name || "Unknown"}</div>
                            <div className="text-[10px] text-gray-400 truncate max-w-[120px]">{user.user_id}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">{formatNumber(user.total_queries)}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <div className="text-sm text-indigo-600 dark:text-indigo-400">{formatNumber(user.input_tokens + user.output_tokens)}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <div className="text-sm text-cyan-600 dark:text-cyan-400">📚 {formatNumber(user.deep_research_sources)} / 🌐 {formatNumber(user.web_search_sources)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                ${user.total_cost?.toFixed(4) || "0.0000"}
                            </div>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};

export default ScholarModeTab;
