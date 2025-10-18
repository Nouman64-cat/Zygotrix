import {
  FiBell,
  FiChevronsLeft,
  FiChevronsRight,
  FiMenu,
  FiSearch,
} from "react-icons/fi";
import { learnerProfile } from "../../../data/dashboardData";

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
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-indigo-400 hover:bg-indigo-500/10 lg:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
        </button>
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-indigo-400 hover:bg-indigo-500/10 lg:hidden"
          aria-label="Open navigation"
        >
          <FiMenu />
        </button>
        <form className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search lessons, resources, mentors…"
            className="w-full rounded-full border border-white/10 bg-white/[0.08] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
        </form>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-indigo-400 hover:bg-indigo-500/10">
          <FiBell />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-pink-400" />
        </button>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/8 px-3 py-2">
          <img
            src={learnerProfile.avatar}
            alt={learnerProfile.name}
            className="h-10 w-10 rounded-full border border-white/10 object-cover"
            loading="lazy"
          />
          <div>
            <p className="text-sm font-semibold text-white">{learnerProfile.name}</p>
            <p className="text-[11px] uppercase tracking-[0.24em] text-indigo-200">Cohort 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTopBar;
