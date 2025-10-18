import { NavLink } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  FiBarChart2,
  FiBookOpen,
  FiCompass,
  FiHome,
  FiLayers,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import Logo from "../../navigation/Logo";
import { cn } from "../../../utils/cn";

interface SidebarNavItem {
  label: string;
  to: string;
  icon: IconType;
}

const navItems: SidebarNavItem[] = [
  { label: "Overview", icon: FiHome, to: "/dashboard" },
  { label: "My Courses", icon: FiBookOpen, to: "/dashboard/courses" },
  { label: "Learning Plan", icon: FiCompass, to: "/dashboard/plan" },
  { label: "Practice", icon: FiLayers, to: "/dashboard/practice" },
  { label: "Analytics", icon: FiBarChart2, to: "/dashboard/analytics" },
  { label: "Community", icon: FiUsers, to: "/dashboard/community" },
];

interface DashboardSidebarProps {
  mobile?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

const DashboardSidebar = ({
  mobile = false,
  collapsed = false,
  onNavigate,
}: DashboardSidebarProps) => {
  const showLabels = mobile || !collapsed;

  const wrapperClasses = mobile
    ? "flex h-full w-full flex-col gap-6 overflow-y-auto rounded-[1.75rem] border border-white/10 bg-[#070b18] p-6"
    : cn(
        "hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition-all duration-300 lg:flex lg:flex-col lg:items-stretch lg:overflow-hidden",
        collapsed ? "lg:w-24" : "lg:w-72",
        "lg:h-screen lg:sticky lg:top-0",
      );

  return (
    <aside className={wrapperClasses}>
      <div
        className={cn(
          "flex items-center",
          showLabels ? "justify-between" : "justify-center",
        )}
      >
        <Logo variant="compact" />
        {showLabels && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-200">
            Learner
          </span>
        )}
      </div>

      <nav className="mt-10 flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={showLabels ? undefined : item.label}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition",
                  "hover:bg-white/8 hover:text-white",
                  isActive && "bg-white/12 text-white shadow shadow-indigo-500/15",
                  !showLabels && "justify-center px-2",
                )
              }
            >
              <Icon className="text-lg" />
              {showLabels && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div
        className={cn(
          "rounded-2xl border border-white/10 bg-white/8 p-4 text-xs text-indigo-100",
          !showLabels && "flex flex-col items-center justify-center gap-3",
        )}
      >
        {showLabels ? (
          <>
            <p className="font-semibold uppercase tracking-[0.24em]">
              Simulation Studio
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-200">
              Two new missions are available. Join before Jan 27 to keep your streak alive.
            </p>
          </>
        ) : (
          <>
            <FiZap className="text-xl text-indigo-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-200">
              Missions
            </span>
          </>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;
