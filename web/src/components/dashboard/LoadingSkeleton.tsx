import React from "react";

const LoadingSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
    </div>
  </div>
);

export default LoadingSkeleton;
