import {
  FiBell,
  FiChevronsLeft,
  FiChevronsRight,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiSearch,
  FiSun,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../hooks/useTheme";
import { useNavigate } from "react-router-dom";

interface DashboardTopBarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}

const DashboardTopBar = ({
  collapsed,
  onToggleSidebar,
  onOpenMobileNav,
}: DashboardTopBarProps) => {
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
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-surface px-6 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-11 w-11 items-center justify-center rounded-full border border-secondary-button bg-secondary-button text-foreground transition-colors hover:bg-secondary-button-hover lg:inline-flex cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
        </button>
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-secondary-button bg-secondary-button text-foreground transition-colors hover:bg-secondary-button-hover lg:hidden cursor-pointer"
          aria-label="Open navigation"
        >
          <FiMenu />
        </button>
        <form className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search lessons, resources, mentors…"
            className="w-full rounded-full border border-border bg-background-subtle py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ring-offset-theme"
          />
        </form>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-secondary-button bg-secondary-button text-foreground transition-colors hover:bg-secondary-button-hover cursor-pointer"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <FiSun /> : <FiMoon />}
        </button>
        <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-secondary-button bg-secondary-button text-foreground transition-colors hover:bg-secondary-button-hover cursor-pointer">
          <FiBell />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-pink-400" />
        </button>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate("/signin");
          }}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-secondary-button bg-secondary-button text-foreground transition-colors hover:bg-secondary-button-hover hover:text-rose-500 cursor-pointer"
          aria-label="Sign out"
          title="Sign out"
        >
          <FiLogOut />
        </button>
        <div className="flex items-center gap-3 rounded-full border border-border bg-background-subtle px-3 py-2 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 text-sm font-semibold text-accent-contrast">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {user?.fullName ?? user?.email}
            </p>
            <p className="text-[11px] uppercase tracking-[0.24em] text-accent">
              Member
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTopBar;
