import React from "react";

import DashboardLayout from "./DashboardLayout";

interface WorkspaceLayoutProps {
  header: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  workAreaClassName?: string;
  wrapperStyle?: React.CSSProperties;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  header,
  leftSidebar,
  rightSidebar,
  children,
  className = "",
  workAreaClassName = "",
  wrapperStyle,
}) => {
  const combinedWrapperClassName = [
    "flex flex-col overflow-hidden -m-4 lg:-m-6",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const combinedWorkAreaClassName = [
    "flex-1 flex bg-gray-50 min-h-0 overflow-hidden max-w-full",
    workAreaClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DashboardLayout>
      <div
        className={combinedWrapperClassName}
        style={{ height: "calc(100vh - 5rem)", ...wrapperStyle }}
      >
        {header}
        <div className={combinedWorkAreaClassName}>
          {leftSidebar}
          {children}
          {rightSidebar}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WorkspaceLayout;
