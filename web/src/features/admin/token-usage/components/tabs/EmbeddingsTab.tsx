import React, { useEffect, useMemo } from "react";
import { MdTrendingUp } from "react-icons/md";
import { FaDatabase, FaChartLine, FaUsers } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { BiLoaderAlt } from "react-icons/bi";
import type { ChartData } from "chart.js";

import { useEmbeddingStats } from "../../hooks/useEmbeddingStats";
import StatsCard from "../../components/shared/StatsCard";
import UsageChart from "../../components/shared/UsageChart";
import UserUsageTable from "../../components/shared/UserUsageTable";
import { formatNumber } from "../../utils/formatters";

interface EmbeddingsTabProps {
    chartDays: number;
    onChartDaysChange: (days: number) => void;
    refreshSignal: number;
}

const EmbeddingsTab: React.FC<EmbeddingsTabProps> = ({
    chartDays,
    onChartDaysChange,
    refreshSignal,
}) => {
    const { stats, dailyData, loading, refresh } =
        useEmbeddingStats(chartDays);

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
                    label: "Tokens",
                    data: dailyData.daily_usage.map((d) => d.total_tokens),
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
                                return `${label}: ${value.toFixed(4)}¢`;
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
                    title: { display: true, text: "Tokens" },
                    grid: { color: "rgba(148, 163, 184, 0.1)" },
                    ticks: {
                        callback: function (value: any) {
                            return formatNumber(value);
                        },
                    },
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
                            return `${num.toFixed(2)}¢`;
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

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <StatsCard
                    title="Total Tokens"
                    value={formatNumber(stats.total_tokens)}
                    subtext="Embedding tokens used"
                    icon={<HiSparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 dark:text-purple-400" />}
                    iconBgColor="bg-purple-100 dark:bg-purple-500/20"
                />
                <StatsCard
                    title="Total Cost"
                    value={`$${stats.total_cost.toFixed(6)}`}
                    subtext="OpenAI embeddings"
                    icon={<FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400" />}
                    iconBgColor="bg-emerald-100 dark:bg-emerald-500/20"
                    valueColor="text-emerald-600 dark:text-emerald-400"
                />
                <StatsCard
                    title="Projected/Mo"
                    value={`$${dailyData?.summary ? dailyData.summary.projected_monthly_cost.toFixed(6) : "0.00"}`}
                    subtext={`${chartDays}-day avg`}
                    icon={<MdTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />}
                    iconBgColor="bg-amber-100 dark:bg-amber-500/20"
                    valueColor="text-amber-600 dark:text-amber-400"
                />
                <StatsCard
                    title="Requests"
                    value={formatNumber(stats.total_requests)}
                    subtext={`${stats.avg_tokens_per_request.toFixed(0)} tokens/req`}
                    icon={<FaDatabase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" />}
                    iconBgColor="bg-blue-100 dark:bg-blue-500/20"
                />
            </div>

            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 shadow-sm">
                <UsageChart
                    title="Embedding Usage Over Time"
                    data={chartData}
                    options={chartOptions}
                    days={chartDays}
                    onDaysChange={onChartDaysChange}
                    icon={<MdTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />}
                />

                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <HiSparkles className="w-4 h-4 text-purple-500" />
                        <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            Embedding Model: text-embedding-3-small
                        </h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                        Pricing: <strong className="text-purple-600 dark:text-purple-400">$0.02 per 1M tokens</strong> - Used for semantic search and context retrieval from Pinecone vector database
                    </p>
                </div>
            </div>

            <UserUsageTable
                title="Embedding Usage by User"
                titleIcon={<FaUsers className="w-5 h-5 text-purple-500" />}
                users={stats.users}
                headers={[
                    { label: "User" },
                    { label: "Tokens", className: "text-right" },
                    { label: "Requests", className: "text-right" },
                    { label: "Avg/Request", className: "text-right hidden sm:table-cell" },
                    { label: "Last Active", className: "text-right hidden lg:table-cell" },
                    { label: "Cost", className: "text-right" },
                ]}
                renderRow={(user: any) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                        {user.user_name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.user_name}</div>
                                    <div className="text-xs text-gray-400 dark:text-slate-500">{user.user_id}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(user.total_tokens)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm text-gray-600 dark:text-slate-400">{user.request_count}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <div className="text-sm text-gray-600 dark:text-slate-400">{user.avg_tokens_per_request.toFixed(0)}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <div className="text-xs text-gray-500 dark:text-slate-500">
                                {user.last_request ? new Date(user.last_request).toLocaleDateString() : "N/A"}
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                ${user.total_cost.toFixed(6)}
                            </div>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};

export default EmbeddingsTab;
