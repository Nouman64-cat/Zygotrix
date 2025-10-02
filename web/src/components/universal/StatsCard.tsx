import React from "react";

interface StatsCardProps {
  title: string;
  value: number | null;
  loading?: boolean;
  error?: string | null;
  icon?: React.ReactNode;
  description?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: "blue" | "emerald" | "purple" | "orange" | "rose" | "indigo";
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  loading = false,
  error = null,
  icon,
  description,
  actionButton,
  className = "",
  trend,
  color = "blue",
}) => {
  // Format large numbers with better styling (1K, 1M, 1B)
  const formatBigNumber = (num: number): { main: string; suffix: string } => {
    if (num >= 1000000000) {
      const main = (num / 1000000000).toFixed(1).replace(/\.0$/, "");
      return { main, suffix: "B" };
    }
    if (num >= 1000000) {
      const main = (num / 1000000).toFixed(1).replace(/\.0$/, "");
      return { main, suffix: "M" };
    }
    if (num >= 1000) {
      const main = (num / 1000).toFixed(1).replace(/\.0$/, "");
      return { main, suffix: "K" };
    }
    return { main: num.toString(), suffix: "" };
  };

  // Color theme configurations
  const colorThemes = {
    blue: {
      gradient: "from-blue-50 via-blue-50/50 to-white",
      border: "border-blue-100/60",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconText: "text-white",
      numberText: "text-blue-900",
      shadow: "shadow-blue-100/50",
      hover: "hover:shadow-blue-200/60 hover:border-blue-200/80",
    },
    emerald: {
      gradient: "from-emerald-50 via-emerald-50/50 to-white",
      border: "border-emerald-100/60",
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      iconText: "text-white",
      numberText: "text-emerald-900",
      shadow: "shadow-emerald-100/50",
      hover: "hover:shadow-emerald-200/60 hover:border-emerald-200/80",
    },
    purple: {
      gradient: "from-purple-50 via-purple-50/50 to-white",
      border: "border-purple-100/60",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
      iconText: "text-white",
      numberText: "text-purple-900",
      shadow: "shadow-purple-100/50",
      hover: "hover:shadow-purple-200/60 hover:border-purple-200/80",
    },
    orange: {
      gradient: "from-orange-50 via-orange-50/50 to-white",
      border: "border-orange-100/60",
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
      iconText: "text-white",
      numberText: "text-orange-900",
      shadow: "shadow-orange-100/50",
      hover: "hover:shadow-orange-200/60 hover:border-orange-200/80",
    },
    rose: {
      gradient: "from-rose-50 via-rose-50/50 to-white",
      border: "border-rose-100/60",
      iconBg: "bg-gradient-to-br from-rose-500 to-rose-600",
      iconText: "text-white",
      numberText: "text-rose-900",
      shadow: "shadow-rose-100/50",
      hover: "hover:shadow-rose-200/60 hover:border-rose-200/80",
    },
    indigo: {
      gradient: "from-indigo-50 via-indigo-50/50 to-white",
      border: "border-indigo-100/60",
      iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      iconText: "text-white",
      numberText: "text-indigo-900",
      shadow: "shadow-indigo-100/50",
      hover: "hover:shadow-indigo-200/60 hover:border-indigo-200/80",
    },
  };

  const theme = colorThemes[color];

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${theme.gradient}
        rounded-2xl border ${theme.border}
        shadow-lg ${theme.shadow} ${theme.hover}
        backdrop-blur-sm
        transition-all duration-300 ease-out
        group cursor-pointer
        ${className}
      `}
      style={{ fontFamily: "Axiforma, sans-serif" }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header with icon and title */}
            <div className="flex items-center gap-3 mb-4">
              {icon && (
                <div
                  className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${theme.iconBg} ${theme.iconText}
                  shadow-lg transform group-hover:scale-110 transition-transform duration-200
                `}
                >
                  <div className="w-6 h-6">{icon}</div>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {title}
                </h3>
                {trend && (
                  <div
                    className={`flex items-center gap-1 mt-1 text-xs ${
                      trend.isPositive ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    <span className={trend.isPositive ? "↗" : "↘"}></span>
                    <span className="font-medium">
                      {Math.abs(trend.value)}%
                    </span>
                    {trend.label && (
                      <span className="text-gray-500">{trend.label}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="mb-3">
              {(() => {
                if (loading) {
                  return (
                    <div className="flex items-center gap-3">
                      <div
                        className={`animate-spin h-8 w-8 border-3 border-current border-t-transparent rounded-full ${theme.numberText} opacity-60`}
                      ></div>
                      <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                  );
                }

                if (error) {
                  return (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <div className="flex items-center gap-2 text-red-600">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <div className="font-semibold text-sm">
                            Error occurred
                          </div>
                          <div className="text-xs text-red-500">{error}</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                const formatted =
                  value !== null
                    ? formatBigNumber(value)
                    : { main: "—", suffix: "" };

                return (
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-5xl font-black ${theme.numberText} tracking-tight leading-none`}
                    >
                      {formatted.main}
                    </span>
                    {formatted.suffix && (
                      <span
                        className={`text-xl font-bold ${theme.numberText} opacity-70 ml-1`}
                      >
                        {formatted.suffix}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Description */}
            {description && !loading && !error && (
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {description}
              </p>
            )}
          </div>

          {/* Action button */}
          {actionButton && !loading && !error && (
            <div className="flex-shrink-0">
              <button
                onClick={actionButton.onClick}
                className={`
                  px-4 py-2.5 text-sm font-semibold rounded-xl
                  transition-all duration-200 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  transform hover:scale-105 active:scale-95
                  shadow-md hover:shadow-lg
                  ${
                    actionButton.variant === "secondary"
                      ? "bg-white/80 text-gray-700 hover:bg-white border border-gray-200 focus:ring-gray-300"
                      : `${theme.iconBg} text-white hover:opacity-90 focus:ring-opacity-50`
                  }
                `}
              >
                {actionButton.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
