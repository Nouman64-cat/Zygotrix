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
}) => {
  // Format large numbers (1K, 1M, 1B)
  const formatBigNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  return (
    <div
      className={`bg-gradient-to-br from-blue-50/40 to-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {icon && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 flex-shrink-0">
                <div className="w-4 h-4">{icon}</div>
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600 truncate">
              {title}
            </h3>
          </div>

          <div className="mb-1">
            {(() => {
              if (loading) {
                return (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                    <span className="text-gray-500 text-sm">Loading...</span>
                  </div>
                );
              }

              if (error) {
                return (
                  <div className="text-red-600 text-xs">
                    <span className="font-medium">Error:</span> {error}
                  </div>
                );
              }

              return (
                <div className="text-2xl font-bold text-gray-900">
                  {value !== null ? formatBigNumber(value) : "—"}
                </div>
              );
            })()}
          </div>

          {description && !loading && !error && (
            <p className="text-xs text-gray-500 leading-tight">{description}</p>
          )}
        </div>

        {actionButton && !loading && !error && (
          <div className="flex-shrink-0">
            <button
              onClick={actionButton.onClick}
              className={`px-3 py-1.5 text-xs font-medium rounded-md shadow-sm transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                ${
                  actionButton.variant === "secondary"
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }
              `}
            >
              {actionButton.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
