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
import useDocumentTitle from "../hooks/useDocumentTitle";


const PortalPage: React.FC = () => {
  useDocumentTitle("Studio");

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
      color: "from-emerald-500 to-teal-600",
      hoverColor: "hover:from-emerald-600 hover:to-teal-700",
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
      color: "from-teal-500 to-cyan-600",
      hoverColor: "hover:from-teal-600 hover:to-cyan-700",
    },
    {
      title: "Analytics",
      description: "View insights & reports",
      href: "/studio/analytics",
      icon: <HiOutlineChartBar className="w-5 h-5" />,
      color: "from-green-500 to-emerald-600",
      hoverColor: "hover:from-green-600 hover:to-emerald-700",
    },
  ];




  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {getGreeting()}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base max-w-2xl">
                Welcome to your genetics intelligence platform. Explore traits, run simulations, and unlock genetic insights.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-sm shrink-0">
              <HiOutlineClock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-200" />
              <span className="text-xs sm:text-sm font-medium">
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
        <div className="grid gap-3 sm:gap-4 grid-cols-2 2xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 lg:p-6 shadow-sm transition-all hover:border-transparent hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-100`}></div>
              <div className="relative z-10">
                <div className={`inline-flex rounded-lg bg-gradient-to-br ${action.color} p-2 sm:p-3 text-white shadow-lg transition-transform group-hover:scale-110`}>
                  {action.icon}
                </div>
                <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-bold text-slate-900 dark:text-white transition-colors group-hover:text-white">
                  {action.title}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 transition-colors group-hover:text-white/90 line-clamp-2">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3">
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

          <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 sm:p-5 lg:p-6 shadow-sm sm:col-span-2 2xl:col-span-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-1.5 sm:p-2">
                    <HiOutlineTrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Platform Activity</h3>
                </div>
                <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Active</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PortalPage;
