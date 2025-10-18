import { NavLink } from "react-router-dom";
import { FiBarChart2, FiBookOpen, FiCompass, FiHome, FiLayers, FiUsers } from "react-icons/fi";
import Logo from "../../navigation/Logo";
import { cn } from "../../../utils/cn";

const navItems = [
  { label: "Overview", icon: <FiHome />, to: "/dashboard" },
  { label: "My Courses", icon: <FiBookOpen />, to: "/dashboard/courses" },
  { label: "Learning Plan", icon: <FiCompass />, to: "/dashboard/plan" },
  { label: "Practice", icon: <FiLayers />, to: "/dashboard/practice" },
  { label: "Analytics", icon: <FiBarChart2 />, to: "/dashboard/analytics" },
  { label: "Community", icon: <FiUsers />, to: "/dashboard/community" },
];

interface DashboardSidebarProps {
  mobile?: boolean;
}

const DashboardSidebar = ({ mobile = false }: DashboardSidebarProps) => {
  const wrapperClasses = mobile
    ? "flex w-full flex-col gap-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
    : "hidden h-full w-72 flex-col rounded-[1.75rem] border border-white/10 bg-white/5 p-6 lg:flex";

  return (
    <aside className={wrapperClasses}>
      <div className="flex items-center justify-between">
        <Logo variant="compact" />
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-200">
          Learner
        </span>
      </div>
      <nav className="mt-10 flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition",
                "hover:bg-white/8 hover:text-white",
                isActive && "bg-white/12 text-white shadow shadow-indigo-500/15",
              )
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-2xl border border-white/10 bg-white/8 p-4 text-xs text-indigo-100">
        <p className="font-semibold uppercase tracking-[0.24em]">Simulation Studio</p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-200">
          Two new missions are available. Join before Jan 27 to keep your streak alive.
        </p>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
