import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
  getTokenUsageStats,
  getDailyTokenUsage,
  type DailyUsageResponse,
} from "../services/chatbotService";
import { fetchChatbotSettings } from "../services/admin.api";
import type { ChatbotSettings } from "../types/auth";
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
import useDocumentTitle from "../hooks/useDocumentTitle";

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
  cache_creation_tokens: number;
  cache_read_tokens: number;
  request_count: number;
  cached_count: number;
  cache_hit_rate: string;
  cache_savings: number;
  last_request: string | null;
}

interface TokenUsageStats {
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_creation_tokens: number;
  total_cache_read_tokens: number;
  total_requests: number;
  cached_requests: number;
  cache_hit_rate: string;
  prompt_cache_hit_rate: string;
  total_cache_savings: number;
  user_count: number;
  users: TokenUsageUser[];
  error?: string;
}

const AdminTokenUsagePage: React.FC = () => {
  useDocumentTitle("AI Token Usage");

  const botName = import.meta.env.VITE_ZYGOTRIX_BOT_NAME || "Zigi";
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<TokenUsageStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyUsageResponse | null>(null);
  const [chatbotSettings, setChatbotSettings] = useState<ChatbotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartDays, setChartDays] = useState(30);

  const hasAdminAccess = currentUser?.user_role === "super_admin" || currentUser?.user_role === "admin";

  useEffect(() => {
    if (hasAdminAccess) {
      fetchStats();
      fetchSettings();
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    if (hasAdminAccess) {
      fetchDailyData();
    }
  }, [hasAdminAccess, chartDays]);

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

  const fetchSettings = async () => {
    try {
      const settings = await fetchChatbotSettings();
      setChatbotSettings(settings);
    } catch (err: unknown) {
      console.error("Failed to fetch chatbot settings:", err);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchDailyData();
    fetchSettings();
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

  // Claude API Pricing (updated 2025) - per million tokens
  const MODEL_PRICING: Record<string, { input: number; output: number; name: string }> = {
    "claude-3-haiku-20240307": { input: 0.25, output: 1.25, name: "Claude 3 Haiku" },
    "claude-3-sonnet-20240229": { input: 3, output: 15, name: "Claude 3 Sonnet" },
    "claude-3-opus-20240229": { input: 15, output: 75, name: "Claude 3 Opus" },
    "claude-3-5-sonnet-20241022": { input: 3, output: 15, name: "Claude 3.5 Sonnet" },
    "claude-3-5-haiku-20241022": { input: 0.80, output: 4, name: "Claude 3.5 Haiku" },
    "claude-sonnet-4-5-20250514": { input: 3, output: 15, name: "Claude Sonnet 4.5" },
    "claude-opus-4-5-20251101": { input: 5, output: 25, name: "Claude Opus 4.5" },
    "claude-haiku-4-5-20250514": { input: 1, output: 5, name: "Claude Haiku 4.5" },
  };

  const getModelInfo = (modelId: string) => {
    return MODEL_PRICING[modelId] || MODEL_PRICING["claude-3-haiku-20240307"];
  };

  const estimateCost = (
    inputTokens: number,
    outputTokens: number,
    model: string = "claude-3-haiku-20240307"
  ) => {
    const pricing = getModelInfo(model);
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return (inputCost + outputCost).toFixed(4);
  };

  // Prepare main usage chart data
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
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: "Input Tokens",
        data: dailyData?.daily_usage.map((d) => d.input_tokens) || [],
        borderColor: "rgb(6, 182, 212)",
        backgroundColor: "rgba(6, 182, 212, 0.05)",
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: "Output Tokens",
        data: dailyData?.daily_usage.map((d) => d.output_tokens) || [],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.05)",
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: "Requests",
        data: dailyData?.daily_usage.map((d) => d.request_count * 100) || [], // Scale up for visibility
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        yAxisID: "y1",
        borderWidth: 2,
      },
    ],
  };

  // Prepare cache savings chart data
  const cacheSavingsChartData = {
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
        label: "Prompt Cache Savings",
        data: dailyData?.daily_usage.map((d) => (d.prompt_cache_savings || 0) * 100) || [], // Convert to cents
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
        borderWidth: 2,
      },
      {
        label: "Response Cache Savings",
        data: dailyData?.daily_usage.map((d) => (d.response_cache_savings || 0) * 100) || [], // Convert to cents
        borderColor: "rgb(6, 182, 212)",
        backgroundColor: "rgba(6, 182, 212, 0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
        borderWidth: 2,
      },
      {
        label: "Total Cost",
        data: dailyData?.daily_usage.map((d) => (d.cost || 0) * 100) || [], // Convert to cents
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
        borderWidth: 2,
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
        ticks: {
          callback: function (value: number | string) {
            const num = typeof value === "string" ? parseFloat(value) : value;
            if (num >= 1000000) {
              return `${(num / 1000000).toFixed(1)}M`;
            } else if (num >= 1000) {
              return `${(num / 1000).toFixed(0)}K`;
            }
            return num.toString();
          },
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Requests",
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function (value: number | string) {
            // Scale back down from ×100 and format
            const num = typeof value === "string" ? parseFloat(value) : value;
            const actual = num / 100;
            if (actual >= 1000000) {
              return `${(actual / 1000000).toFixed(1)}M`;
            } else if (actual >= 1000) {
              return `${(actual / 1000).toFixed(0)}K`;
            }
            return actual.toString();
          },
        },
      },
    },
  };

  // Cache savings chart options
  const cacheSavingsChartOptions = {
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
        borderColor: "rgba(16, 185, 129, 0.5)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context: TooltipItem<"line">) {
            const label = context.dataset.label || "";
            const value = context.parsed.y / 100; // Convert back from cents to dollars
            return `${label}: $${value.toFixed(4)}`;
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
          text: "Cost (cents)",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          callback: function (value: number | string) {
            const num = typeof value === "string" ? parseFloat(value) : value;
            return `${num.toFixed(1)}¢`;
          },
        },
      },
    },
  };

  if (!hasAdminAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Only admins can access token usage statistics.
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
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  AI Token Usage
                </h1>
                {chatbotSettings && (
                  <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                    <FaRobot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                      {getModelInfo(chatbotSettings.model).name}
                    </span>
                    <span className="text-[10px] sm:text-xs text-indigo-600/70 dark:text-indigo-400/70">
                      (${getModelInfo(chatbotSettings.model).input} / ${getModelInfo(chatbotSettings.model).output} per MTok)
                    </span>
                  </div>
                )}
              </div>
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

              {/* Response Cache Rate */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/20">
                    <MdAutorenew className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 dark:text-cyan-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    Response Cache
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

            {/* Prompt Caching Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {/* Cache Read Tokens */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-500/20">
                    <HiSparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Cache Reads
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatNumber(stats.total_cache_read_tokens || 0)}
                </div>
                <div className="text-[10px] text-green-600/70 dark:text-green-400/70">
                  90% cost reduction
                </div>
              </div>

              {/* Total Cache Savings */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                    <FaChartLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Total Saved
                  </span>
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  ${(stats.total_cache_savings || 0).toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                  From prompt caching
                </div>
              </div>

              {/* Prompt Cache Hit Rate */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <MdAutorenew className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Cache Efficiency
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.prompt_cache_hit_rate || "0.0%"}
                </div>
                <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70">
                  Of input tokens cached
                </div>
              </div>

              {/* Projected Monthly Savings */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                    <MdTrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    Monthly Savings
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  $
                  {dailyData?.summary?.projected_monthly_savings
                    ? dailyData.summary.projected_monthly_savings.toFixed(2)
                    : "0.00"}
                </div>
                <div className="text-[10px] text-purple-600/70 dark:text-purple-400/70">
                  Projected cache savings
                </div>
              </div>
            </div>

            {/* Cache Savings Chart - Full Width */}
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    Cache Savings Over Time
                  </h2>
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  Prompt caching reduces costs by 90% on cached tokens
                </div>
              </div>

              {dailyData && dailyData.daily_usage.length > 0 ? (
                <div className="h-[200px] sm:h-[250px]">
                  <Line data={cacheSavingsChartData} options={cacheSavingsChartOptions} />
                </div>
              ) : (
                <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                  <p className="text-gray-400 dark:text-slate-500 text-sm">
                    No cache savings data available yet
                  </p>
                </div>
              )}

              <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      Prompt Cache Savings
                    </span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ${dailyData?.summary?.total_prompt_cache_savings?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    <span className="font-medium text-cyan-700 dark:text-cyan-300">
                      Response Cache Savings
                    </span>
                  </div>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                    ${dailyData?.summary?.total_response_cache_savings?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-300 dark:border-emerald-700">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="font-medium text-red-700 dark:text-red-300">
                        Total Cost (with caching)
                      </span>
                    </div>
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      ${dailyData?.summary?.total_cost?.toFixed(2) || "0.00"}
                    </span>
                  </div>
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
                        {((stats.total_input_tokens / 1000000) *
                          getModelInfo(chatbotSettings?.model || "claude-3-haiku-20240307").input
                        ).toFixed(4)}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">
                        @ ${getModelInfo(chatbotSettings?.model || "claude-3-haiku-20240307").input}/MTok
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
                        {((stats.total_output_tokens / 1000000) *
                          getModelInfo(chatbotSettings?.model || "claude-3-haiku-20240307").output
                        ).toFixed(4)}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">
                        @ ${getModelInfo(chatbotSettings?.model || "claude-3-haiku-20240307").output}/MTok
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prompt Cache Savings */}
                <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FaDatabase className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Cache Tokens
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-500 dark:text-purple-400">
                        {formatNumber(stats.total_cache_read_tokens || 0)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        {stats.prompt_cache_hit_rate || "0.0%"} cache hit rate
                      </div>
                    </div>
                    <div className="text-right pl-4 border-l border-gray-200 dark:border-slate-600">
                      <div className="text-xs text-gray-400 dark:text-slate-500 mb-1">
                        Saved
                      </div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ${(stats.total_cache_savings || 0).toFixed(4)}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">
                        90% cache discount
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

            {/* Info Card - Dual Cache System */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <HiSparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                    Dual Cache System
                  </h3>

                  {/* Response Cache */}
                  <div className="pl-3 border-l-2 border-cyan-400">
                    <h4 className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-1">
                      1. Response Cache (In-Memory)
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      Stores complete LLM responses for <strong>1 hour</strong>. When the same question is asked,
                      returns instantly with <strong className="text-emerald-600 dark:text-emerald-400">100% cost savings</strong> (zero API calls).
                      Controlled via admin settings.
                    </p>
                  </div>

                  {/* Prompt Cache */}
                  <div className="pl-3 border-l-2 border-green-400">
                    <h4 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                      2. Prompt Cache (Claude API)
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      Caches conversation history and system prompts for <strong>5 minutes</strong>.
                      Cache reads cost <strong className="text-emerald-600 dark:text-emerald-400">90% less</strong> than regular input tokens.
                      Always enabled on every request.
                    </p>
                  </div>

                  {/* Pricing Example */}
                  <div className="mt-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-gray-700 dark:text-slate-300">
                      <strong className="text-indigo-600 dark:text-indigo-300">Pricing (Haiku):</strong>{" "}
                      Input $0.25/MTok • Cache write $0.30/MTok •
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> Cache read $0.03/MTok (90% off!)</span> •
                      Output $1.25/MTok
                    </p>
                  </div>
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
