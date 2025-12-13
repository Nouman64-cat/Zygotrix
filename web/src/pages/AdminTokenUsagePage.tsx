import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
  getTokenUsageStats,
  getDailyTokenUsage,
  type DailyUsageResponse,
} from "../services/chatbotService";
import {
  MdError,
  MdRefresh,
  MdPerson,
  MdAutorenew,
  MdTrendingUp,
} from "react-icons/md";
import { FaRobot, FaDatabase, FaChartLine, FaUsers } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { HiSparkles } from "react-icons/hi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import Button from "../components/common/Button";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TokenUsageUser {
  user_id: string;
  user_name: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  request_count: number;
  cached_count: number;
  cache_hit_rate: string;
  last_request: string | null;
}

interface TokenUsageStats {
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_requests: number;
  cached_requests: number;
  cache_hit_rate: string;
  user_count: number;
  users: TokenUsageUser[];
  error?: string;
}

const AdminTokenUsagePage: React.FC = () => {
  const botName = import.meta.env.VITE_ZYGOTRIX_BOT_NAME || "Zigi";
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<TokenUsageStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartDays, setChartDays] = useState(30);

  const isSuperAdmin = currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchDailyData();
    }
  }, [isSuperAdmin, chartDays]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTokenUsageStats();
      if (data) {
        setStats(data as TokenUsageStats);
      } else {
        setError("Failed to fetch token usage statistics");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch statistics";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyData = async () => {
    try {
      const data = await getDailyTokenUsage(chartDays);
      if (data) {
        setDailyData(data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch daily data:", err);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchDailyData();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Claude 3 Haiku Pricing (as of Dec 2024):
  // Input: $0.25 / MTok, Output: $1.25 / MTok
  // Prompt Caching - Write: $0.30 / MTok, Read: $0.03 / MTok
  const estimateCost = (inputTokens: number, outputTokens: number) => {
    const inputCost = (inputTokens / 1000000) * 0.25;
    const outputCost = (outputTokens / 1000000) * 1.25;
    return (inputCost + outputCost).toFixed(4);
  };

  // Prepare chart data
  const chartData = {
    labels:
      dailyData?.daily_usage.map((d) => {
        const date = new Date(d.date);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }) || [],
    datasets: [
      {
        label: "Total Tokens",
        data: dailyData?.daily_usage.map((d) => d.total_tokens) || [],
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: "Requests",
        data: dailyData?.daily_usage.map((d) => d.request_count * 100) || [], // Scale up for visibility
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#e2e8f0",
        borderColor: "rgba(99, 102, 241, 0.3)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context: TooltipItem<"line">) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (label === "Requests") {
              return `${label}: ${value / 100}`; // Scale back down
            }
            return `${label}: ${formatNumber(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Tokens",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Requests (×100)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Only super admins can access token usage statistics.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <FaRobot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                AI Token Usage
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                Monitor Claude API consumption
              </p>
            </div>
          </div>
          <Button
            isLoading={loading}
            icon={<MdRefresh />}
            loadingIcon={<BiLoaderAlt className="w-4 h-4 animate-spin" />}
            disabled={loading}
            onClick={handleRefresh}
            text="Refresh"
            classNames="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-white text-xs sm:text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <MdError className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <BiLoaderAlt className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4">
              {/* Total Tokens */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
                    <HiSparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    Total Tokens
                  </span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(stats.total_tokens)}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">
                  {formatNumber(stats.total_input_tokens)} in /{" "}
                  {formatNumber(stats.total_output_tokens)} out
                </div>
              </div>

              {/* Current Cost */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                    <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    Current Cost
                  </span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  $
                  {estimateCost(
                    stats.total_input_tokens,
                    stats.total_output_tokens
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">
                  Total API cost
                </div>
              </div>

              {/* Projected Monthly Cost */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                    <MdTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    Projected/Mo
                  </span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                  $
                  {dailyData?.summary
                    ? dailyData.summary.projected_monthly_cost.toFixed(2)
                    : "0.00"}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">
                  {chartDays}-day avg
                </div>
              </div>

              {/* Total Requests */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <FaDatabase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    Requests
                  </span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(stats.total_requests)}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">
                  API calls
                </div>
              </div>

              {/* Cache Hit Rate */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/20">
                    <MdAutorenew className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 dark:text-cyan-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    Cache Rate
                  </span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.cache_hit_rate}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">
                  {stats.cached_requests} / {stats.total_requests}
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                    <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 dark:text-purple-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    Users
                  </span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.user_count}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">
                  Active chatters
                </div>
              </div>
            </div>

            {/* Chart and Token Info Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Usage Chart - Left (2/3) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <MdTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Usage Trends
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={chartDays}
                      onChange={(e) => setChartDays(Number(e.target.value))}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-xs sm:text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </div>
                </div>

                {dailyData && dailyData.daily_usage.length > 0 ? (
                  <div className="h-[200px] sm:h-[300px]">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-[200px] sm:h-[300px] flex items-center justify-center">
                    <p className="text-gray-400 dark:text-slate-500 text-sm">
                      No usage data available
                    </p>
                  </div>
                )}
              </div>

              {/* Token Breakdown - Right (1/3) Stacked */}
              <div className="flex flex-col gap-4">
                {/* Input Tokens */}
                <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FaDatabase className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Input Tokens
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">
                        {formatNumber(stats.total_input_tokens)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        Prompts + context sent
                      </div>
                    </div>
                    <div className="text-right pl-4 border-l border-gray-200 dark:border-slate-600">
                      <div className="text-xs text-gray-400 dark:text-slate-500 mb-1">
                        Cost
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
                        $
                        {((stats.total_input_tokens / 1000000) * 0.25).toFixed(
                          4
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">
                        @ $0.25/MTok
                      </div>
                    </div>
                  </div>
                </div>

                {/* Output Tokens */}
                <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FaDatabase className="w-4 h-4 text-green-500 dark:text-green-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Output Tokens
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-500 dark:text-green-400">
                        {formatNumber(stats.total_output_tokens)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        Responses generated
                      </div>
                    </div>
                    <div className="text-right pl-4 border-l border-gray-200 dark:border-slate-600">
                      <div className="text-xs text-gray-400 dark:text-slate-500 mb-1">
                        Cost
                      </div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-300">
                        $
                        {((stats.total_output_tokens / 1000000) * 1.25).toFixed(
                          4
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">
                        @ $1.25/MTok
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Saved */}
                <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FaDatabase className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Tokens Saved
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-500 dark:text-purple-400">
                        ~{formatNumber(stats.cached_requests * 150)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        {stats.cached_requests} cached requests
                      </div>
                    </div>
                    <div className="text-right pl-4 border-l border-gray-200 dark:border-slate-600">
                      <div className="text-xs text-gray-400 dark:text-slate-500 mb-1">
                        Saved
                      </div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        $
                        {(
                          ((stats.cached_requests * 150) / 1000000) *
                          0.25
                        ).toFixed(4)}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">
                        @ $0.25/MTok avg
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Table */}
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Usage by User
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Token consumption breakdown per user
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Tokens
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                        Input
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                        Output
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Requests
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                        Cache Rate
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                        Last Active
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Est. Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                    {stats.users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-gray-400 dark:text-slate-500"
                        >
                          No usage data yet. Users will appear here after
                          chatting with {botName}.
                        </td>
                      </tr>
                    ) : (
                      stats.users.map((user) => (
                        <tr
                          key={user.user_id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <MdPerson className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                                  {user.user_name}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-[150px]">
                                  {user.user_id === "anonymous"
                                    ? "Guest"
                                    : user.user_id.slice(0, 8) + "..."}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatNumber(user.total_tokens)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <span className="text-sm text-blue-500 dark:text-blue-400">
                              {formatNumber(user.input_tokens)}{" "}
                              <span className="text-gray-400 dark:text-slate-500">
                                ($
                                {((user.input_tokens / 1000000) * 0.25).toFixed(
                                  4
                                )}
                                )
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <span className="text-sm text-green-500 dark:text-green-400">
                              {formatNumber(user.output_tokens)}{" "}
                              <span className="text-gray-400 dark:text-slate-500">
                                ($
                                {(
                                  (user.output_tokens / 1000000) *
                                  1.25
                                ).toFixed(4)}
                                )
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-600 dark:text-slate-300">
                              {user.request_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            <span
                              className={`text-sm ${parseFloat(user.cache_hit_rate) > 50
                                ? "text-emerald-500 dark:text-emerald-400"
                                : parseFloat(user.cache_hit_rate) > 20
                                  ? "text-amber-500 dark:text-amber-400"
                                  : "text-gray-400 dark:text-slate-400"
                                }`}
                            >
                              {user.cache_hit_rate}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <span className="text-sm text-gray-500 dark:text-slate-400">
                              {formatDate(user.last_request)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-amber-500 dark:text-amber-400">
                              $
                              {estimateCost(
                                user.input_tokens,
                                user.output_tokens
                              )}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <HiSparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                    Token Usage Insights
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400">
                    Tokens are the building blocks of AI text processing. Input
                    tokens include your prompts and context, while output tokens
                    are the AI's responses. The cache system helps reduce costs
                    by serving repeated questions from memory instead of calling
                    the API.{" "}
                    <strong className="text-indigo-600 dark:text-indigo-300">
                      Claude 3 Haiku pricing:
                    </strong>{" "}
                    Input $0.25/MTok, Output $1.25/MTok. Prompt caching: Write
                    $0.30/MTok, Read $0.03/MTok.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default AdminTokenUsagePage;
