import React, { useEffect, useState } from "react";
import {
  HiOutlinePlus,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineTrendingUp,
} from "react-icons/hi";
import { FaDna, FaProjectDiagram, FaBookOpen } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { useUserStats } from "../hooks/useUserStats";
import StatsCard from "../components/universal/StatsCard";


const PortalPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectsCount, publicTraitsCount, loading, error } = useUserStats();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const quickActions = [
    {
      title: "New Project",
      description: "Start a new genetics project",
      href: "/studio/projects",
      icon: <HiOutlinePlus className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      title: "Simulation Studio",
      description: "Run genetic simulations",
      href: "/studio/simulation-studio",
      icon: <FaDna className="w-5 h-5" />,
      color: "from-emerald-500 to-emerald-600",
      hoverColor: "hover:from-emerald-600 hover:to-emerald-700",
    },
    {
      title: "Browse Traits",
      description: "Explore trait database",
      href: "/studio/browse-traits",
      icon: <FaBookOpen className="w-5 h-5" />,
      color: "from-indigo-500 to-indigo-600",
      hoverColor: "hover:from-indigo-600 hover:to-indigo-700",
    },
    {
      title: "Analytics",
      description: "View insights & reports",
      href: "/studio/analytics",
      icon: <HiOutlineChartBar className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
    },
  ];




  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                {getGreeting()}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-blue-100 max-w-2xl">
                Welcome to your genetics intelligence platform. Explore traits, run simulations, and unlock genetic insights.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
              <HiOutlineClock className="h-5 w-5 text-blue-200" />
              <span className="text-sm font-medium">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-all hover:border-transparent hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-100`}></div>
              <div className="relative z-10">
                <div className={`inline-flex rounded-lg bg-gradient-to-br ${action.color} p-3 text-white shadow-lg transition-transform group-hover:scale-110`}>
                  {action.icon}
                </div>
                <h3 className="mt-4 font-bold text-slate-900 dark:text-white transition-colors group-hover:text-white">
                  {action.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 transition-colors group-hover:text-white/90">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Your Projects"
            value={projectsCount}
            loading={loading}
            error={error}
            description="Active simulation projects"
            icon={<FaProjectDiagram className="w-6 h-6" />}
            actionButton={{
              label: "View All",
              onClick: () => navigate("/studio/projects"),
              variant: "secondary",
            }}
          />

          <StatsCard
            title="Public Traits"
            value={publicTraitsCount}
            loading={loading}
            error={error}
            description="Available reference traits"
            icon={<FaBookOpen className="w-6 h-6" />}
            actionButton={{
              label: "Browse",
              onClick: () => navigate("/studio/browse-traits"),
              variant: "secondary",
            }}
          />

          <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-purple-100 dark:bg-purple-900/50 p-2">
                    <HiOutlineTrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Platform Activity</h3>
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Active</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PortalPage;
