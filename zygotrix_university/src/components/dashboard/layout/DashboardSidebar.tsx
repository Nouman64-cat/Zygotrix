import { NavLink, useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  FiBarChart2,
  FiBookOpen,
  FiCompass,
  FiHome,
  FiLayers,
  FiLogOut,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import Logo from "../../navigation/Logo";
import { cn } from "../../../utils/cn";
import { useAuth } from "../../../context/AuthContext";

interface SidebarNavItem {
  label: string;
  to: string;
  icon: IconType;
}

const navItems: SidebarNavItem[] = [
  { label: "Overview", icon: FiHome, to: "/university" },
  { label: "My Courses", icon: FiBookOpen, to: "/university/courses" },
  { label: "Browse Courses", icon: FiZap, to: "/university/browse-courses" },
  { label: "Learning Plan", icon: FiCompass, to: "/university/plan" },
  { label: "Practice", icon: FiLayers, to: "/university/practice" },
  { label: "Analytics", icon: FiBarChart2, to: "/university/analytics" },
  { label: "Community", icon: FiUsers, to: "/university/community" },
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
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const wrapperClasses = mobile
    ? "flex h-full w-full flex-col gap-6 overflow-y-auto rounded-[1.75rem] border border-border bg-surface-elevated p-6 transition-colors"
    : cn(
        "hidden rounded-[1.75rem] border border-border bg-surface p-6 transition-all duration-300 transition-colors lg:flex lg:flex-col lg:items-stretch lg:overflow-hidden",
        collapsed ? "lg:w-24" : "lg:w-72",
        "lg:h-screen lg:sticky lg:top-0"
      );

  return (
    <aside className={wrapperClasses}>
      <div
        className={cn(
          "flex items-center",
          showLabels ? "justify-between" : "justify-center"
        )}
      >
        <Logo variant="compact" />
        {showLabels && (
          <span className="rounded-full border border-secondary-button bg-secondary-button px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-secondary-button transition-colors">
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
              end={item.to === "/university"}
              aria-label={showLabels ? undefined : item.label}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-muted transition-colors",
                  "hover:bg-accent-soft hover:text-foreground",
                  isActive &&
                    "border-accent bg-accent-soft text-foreground shadow-theme-card",
                  !showLabels && "justify-center px-2"
                )
              }
            >
              <Icon className="text-lg flex-shrink-0 w-5 h-5" />
              {showLabels && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div
        className={cn(
          "rounded-2xl border border-border bg-background-subtle p-4 text-xs text-accent transition-colors",
          !showLabels && "flex flex-col items-center justify-center gap-3"
        )}
      >
        {showLabels ? (
          <>
            <p className="font-semibold uppercase tracking-[0.24em]">
              Simulation Studio
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Two new missions are available. Join before Jan 27 to keep your
              streak alive.
            </p>
          </>
        ) : (
          <>
            <FiZap className="text-xl text-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">
              Missions
            </span>
          </>
        )}
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={async () => {
          await signOut();
          navigate("/signin");
        }}
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-muted transition-colors cursor-pointer",
          "hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200",
          !showLabels && "justify-center px-2"
        )}
        aria-label={showLabels ? undefined : "Sign out"}
      >
        <FiLogOut className="text-lg flex-shrink-0 w-5 h-5" />
        {showLabels && <span>Sign Out</span>}
      </button>
    </aside>
  );
};

export default DashboardSidebar;
