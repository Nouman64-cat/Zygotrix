import React, { useState, useEffect } from "react";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Initialize sidebar state from localStorage with fallbacks
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboard-sidebar-open");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboard-sidebar-collapsed");
      return saved !== null ? JSON.parse(saved) : true; // Default to collapsed
    } catch {
      return true; // Default to collapsed
    }
  });

  // Persist sidebar state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "dashboard-sidebar-open",
        JSON.stringify(sidebarOpen)
      );
    } catch {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }, [sidebarOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "dashboard-sidebar-collapsed",
        JSON.stringify(sidebarCollapsed)
      );
    } catch {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }, [sidebarCollapsed]);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-200">
      {/* Dashboard Header */}
      <DashboardHeader onMenuToggle={handleMenuToggle} />

      <div className="flex flex-1 overflow-hidden">
        {/* Dashboard Sidebar */}
        <DashboardSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={handleSidebarClose}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
