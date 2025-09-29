import React from "react";

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon, children }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="mb-4">{icon}</div>}
    <div className="text-lg font-semibold text-gray-500 mb-2">{message}</div>
    {children}
  </div>
);

export default EmptyState;
