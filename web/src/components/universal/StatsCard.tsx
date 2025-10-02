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
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {icon && <div className="text-blue-600">{icon}</div>}
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {title}
            </h3>
          </div>

          <div className="mb-2">
            {(() => {
              if (loading) {
                return (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-gray-500">Loading...</span>
                  </div>
                );
              }

              if (error) {
                return (
                  <div className="text-red-600 text-sm">
                    <span className="font-medium">Error:</span> {error}
                  </div>
                );
              }

              return (
                <div className="text-3xl font-bold text-gray-900">
                  {value !== null ? value.toLocaleString() : "—"}
                </div>
              );
            })()}
          </div>

          {description && !loading && !error && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>

        {actionButton && !loading && !error && (
          <div className="ml-4">
            <button
              onClick={actionButton.onClick}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                actionButton.variant === "secondary"
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
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
