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
  FiMoon,
  FiSun,
  FiBell,
} from "react-icons/fi";
import Logo from "../../navigation/Logo";
import { cn } from "../../../utils/cn";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../hooks/useTheme";

interface NavItem {
  label: string;
  to: string;
  icon: IconType;
}

const navItems: NavItem[] = [
  { label: "Overview", icon: FiHome, to: "/university" },
  { label: "My Courses", icon: FiBookOpen, to: "/university/courses" },
  { label: "Browse Courses", icon: FiZap, to: "/university/browse-courses" },
  //   { label: "Learning Plan", icon: FiCompass, to: "/university/plan" },
  { label: "Practice", icon: FiLayers, to: "/university/practice" },
  { label: "Analytics", icon: FiBarChart2, to: "/university/analytics" },
  //   { label: "Community", icon: FiUsers, to: "/university/community" },
];

const DashboardTopNav = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2)?.toUpperCase() ?? "ZU";

  return (
    <div className="border-b border-border bg-surface transition-colors">
      <div className="mx-auto max-w-8xl px-4 sm:px-8">
        <div className="flex items-center justify-between py-4 gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo variant="compact" />
          </div>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center gap-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/university"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted transition-colors",
                      "hover:bg-accent-soft hover:text-foreground",
                      isActive &&
                        "bg-accent-soft text-foreground border border-accent"
                    )
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary-button bg-secondary-button text-foreground transition-colors hover:bg-secondary-button-hover cursor-pointer"
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? (
                <FiSun className="w-4 h-4" />
              ) : (
                <FiMoon className="w-4 h-4" />
              )}
            </button>

            {/* Notifications */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-secondary-button bg-secondary-button text-foreground transition-colors hover:bg-secondary-button-hover cursor-pointer">
              <FiBell className="w-4 h-4" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-pink-400" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 rounded-full border border-border bg-background-subtle px-3 py-2 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground">
                  {user?.fullName ?? user?.email}
                </p>
              </div>
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/signin");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary-button bg-secondary-button text-foreground transition-colors hover:bg-secondary-button-hover hover:text-rose-500 cursor-pointer"
              aria-label="Sign out"
              title="Sign out"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="lg:hidden flex overflow-x-auto gap-2 pb-4 -mx-4 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/university"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted transition-colors whitespace-nowrap",
                    "hover:bg-accent-soft hover:text-foreground",
                    isActive &&
                      "bg-accent-soft text-foreground border border-accent"
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardTopNav;
