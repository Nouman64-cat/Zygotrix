import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { useAuth } from "../context/AuthContext";
import { getChatbotStatus } from "../services/chatbotService";
import { AgentSidebar } from "../components/chatbot/AgentSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

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

  // Agent sidebar state - using new key to reset default to expanded
  const [agentSidebarCollapsed, setAgentSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboard-agent-sidebar-state");
      return saved !== null ? JSON.parse(saved) : false; // Default expanded
    } catch {
      return false;
    }
  });

  const [agentEnabled, setAgentEnabled] = useState(true);

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

  // Persist agent sidebar state with new key
  useEffect(() => {
    try {
      localStorage.setItem(
        "dashboard-agent-sidebar-state",
        JSON.stringify(agentSidebarCollapsed)
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [agentSidebarCollapsed]);

  // Check chatbot enabled status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getChatbotStatus();
        setAgentEnabled(status.enabled);
      } catch (error) {
        console.error('Error checking chatbot status:', error);
        // Default to enabled on error
        setAgentEnabled(true);
      }
    };
    checkStatus();
  }, []);

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
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative">{children}</div>
        </main>

        {/* Agent Sidebar */}
        <AgentSidebar
          isCollapsed={agentSidebarCollapsed}
          onToggleCollapse={() => setAgentSidebarCollapsed(!agentSidebarCollapsed)}
          currentPath={location.pathname}
          userName={user?.full_name || user?.email?.split('@')[0] || 'there'}
          userId={user?.id}
          isEnabled={agentEnabled}
        />
      </div>
    </div>
  );
};

export default DashboardLayout;
