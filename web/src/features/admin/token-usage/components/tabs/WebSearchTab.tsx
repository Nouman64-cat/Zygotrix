import React, { useEffect } from "react";
import { FaChartLine, FaUsers } from "react-icons/fa";
import { MdTrendingUp } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";

import { useWebSearchStats } from "../../hooks/useWebSearchStats";
import StatsCard from "../../components/shared/StatsCard";
import HeroStatCard from "../../components/shared/HeroStatCard";
import UserUsageTable from "../../components/shared/UserUsageTable";
import { formatNumber } from "../../utils/formatters";

interface WebSearchTabProps {
    chartDays: number;
    refreshSignal: number;
}

const WebSearchTab: React.FC<WebSearchTabProps> = ({
    chartDays,
    refreshSignal,
}) => {
    const { stats, dailyData, loading, refresh } =
        useWebSearchStats(chartDays);

    useEffect(() => {
        if (refreshSignal > 0) {
            refresh();
        }
    }, [refreshSignal, refresh]);

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center py-20">
                <BiLoaderAlt className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!stats) return null;

    const avgCostPerReq =
        stats.total_requests > 0
            ? (stats.total_cost / stats.total_requests).toFixed(4)
            : "0.0000";

    const avgTokens =
        stats.total_requests > 0
            ? Math.round(
                (stats.total_input_tokens + stats.total_output_tokens) /
                stats.total_requests
            )
            : 0;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* HERO */}
            <HeroStatCard
                title="Average Cost Per Request"
                subtitle="Web Search (including all token consumption)"
                value={`$${avgCostPerReq}`}
                valueSubtext="per web search request"
                icon={<span className="text-3xl">🌐</span>}
                gradient="from-blue-500 via-blue-600 to-cyan-600"
                borderColor="border-blue-400/30"
                footerItems={[
                    { color: "bg-cyan-300", label: "Search API: $0.01/search" },
                    { color: "bg-indigo-300", label: "+ Claude 3.5 Sonnet tokens" },
                    { color: "bg-orange-300", label: `Avg ${formatNumber(avgTokens)} tok/req` },
                ]}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                <StatsCard
                    title="Total Searches"
                    value={stats.total_searches.toString()}
                    subtext={`${stats.total_requests} requests`}
                    icon={<span className="text-lg">🌐</span>}
                    iconBgColor="bg-blue-100 dark:bg-blue-500/20"
                />
                <StatsCard
                    title="Search Cost"
                    value={`$${stats.total_search_cost.toFixed(4)}`}
                    subtext="$10/1k searches"
                    icon={<span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">API</span>}
                    iconBgColor="bg-cyan-100 dark:bg-cyan-500/20"
                    valueColor="text-cyan-600 dark:text-cyan-400"
                />
                <StatsCard
                    title="Token Cost"
                    value={`$${stats.total_token_cost.toFixed(4)}`}
                    subtext={`${formatNumber(stats.total_input_tokens)} in / ${formatNumber(stats.total_output_tokens)} out`}
                    icon={<span className="text-xs font-bold text-orange-600 dark:text-orange-400">CL</span>}
                    iconBgColor="bg-orange-100 dark:bg-orange-500/20"
                    valueColor="text-orange-600 dark:text-orange-400"
                />
                <StatsCard
                    title="Total Cost"
                    value={`$${stats.total_cost.toFixed(4)}`}
                    subtext="All web searches"
                    icon={<FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400" />}
                    iconBgColor="bg-red-100 dark:bg-red-500/20"
                    valueColor="text-red-600 dark:text-red-400"
                />
                <StatsCard
                    title="Avg/Search"
                    value={`$${stats.avg_cost_per_search.toFixed(4)}`}
                    subtext={`${stats.avg_searches_per_request.toFixed(1)} searches/req`}
                    icon={<MdTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 dark:text-purple-400" />}
                    iconBgColor="bg-purple-100 dark:bg-purple-500/20"
                    valueColor="text-purple-600 dark:text-purple-400"
                />
                <StatsCard
                    title="Users"
                    value={stats.user_count.toString()}
                    subtext="PRO users only"
                    icon={<FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400" />}
                    iconBgColor="bg-green-100 dark:bg-green-500/20"
                />
            </div>

            {/* Monthly Projection */}
            {dailyData && (
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-4 sm:p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">Web Search Cost Projection</h3>
                            <p className="text-blue-100 text-sm">Based on last {dailyData.period_days} days</p>
                        </div>
                        <div className="flex gap-6">
                            <div>
                                <p className="text-blue-100 text-xs">Avg Daily Cost</p>
                                <p className="text-2xl font-bold">${dailyData.avg_daily_cost?.toFixed(4) || "0.00"}</p>
                            </div>
                            <div>
                                <p className="text-blue-100 text-xs">Projected Monthly</p>
                                <p className="text-2xl font-bold">${dailyData.projected_monthly_cost?.toFixed(2) || "0.00"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <UserUsageTable
                title="Web Search Usage by User"
                titleIcon={<span className="text-lg">🌐</span>}
                users={stats.users}
                headers={[
                    { label: "User" },
                    { label: "Searches", className: "text-right" },
                    { label: "Requests", className: "text-right hidden sm:table-cell" },
                    { label: "Tokens", className: "text-right hidden sm:table-cell" },
                    { label: "Search Cost", className: "text-right hidden lg:table-cell" },
                    { label: "Total Cost", className: "text-right" },
                ]}
                renderRow={(user: any) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs">
                                    {user.user_name?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.user_name || "Unknown"}</div>
                                    <div className="text-xs text-gray-500 dark:text-slate-500">
                                        {user.last_search ? `Last: ${new Date(user.last_search).toLocaleDateString()}` : "No recent activity"}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.total_searches}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <div className="text-sm text-blue-600 dark:text-blue-400">{user.request_count}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <div className="text-sm text-orange-600 dark:text-orange-400">{formatNumber((user.input_tokens || 0) + (user.output_tokens || 0))}</div>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <div className="text-sm text-cyan-600 dark:text-cyan-400">${user.search_cost?.toFixed(4) || "0.0000"}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                                ${user.total_cost?.toFixed(4) || "0.0000"}
                            </div>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};

export default WebSearchTab;
