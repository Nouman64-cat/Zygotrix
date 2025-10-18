import { useState } from "react";
import { FiMenu, FiX, FiArrowUpRight } from "react-icons/fi";
import { Link, NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";
import AccentButton from "../common/AccentButton";
import Logo from "./Logo";

const navItems = [
  { label: "Programs", to: "/courses" },
  { label: "Learning Paths", to: "/paths" },
  { label: "Practice Studio", to: "/practice" },
  { label: "Community", to: "/community" },
  { label: "Resources", to: "/resources" },
  { label: "Dashboard", to: "/dashboard" },
];

const NavigationBar = () => {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-[#060914]/90 backdrop-blur border-b border-white/5">
      <nav className="mx-auto flex max-w-8xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium text-slate-200 transition hover:text-white",
                  isActive &&
                    "text-white underline underline-offset-8 decoration-indigo-400"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/simulation-studio"
            className="flex items-center gap-1 text-sm font-medium text-indigo-200 transition hover:text-white"
          >
            Simulation Studio <FiArrowUpRight />
          </Link>
          <AccentButton to="/dashboard" variant="primary">
            Go to Dashboard
          </AccentButton>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white md:hidden"
          onClick={toggle}
          aria-label="Toggle menu"
        >
          {open ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        {open && (
          <div className="absolute inset-x-0 top-full border-b border-white/10 bg-[#060914]/95 px-4 pb-6 pt-4 shadow-lg shadow-black/20 md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={close}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2 text-base font-medium text-slate-200 transition hover:bg-white/10 hover:text-white",
                      isActive && "bg-white/10 text-white"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <hr className="border-white/10" />
              <AccentButton to="/courses" onClick={close}>
                Explore Courses
              </AccentButton>
              <AccentButton to="/dashboard" onClick={close} variant="secondary">
                Go to Dashboard
              </AccentButton>
              <Link
                to="/simulation-studio"
                onClick={close}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-indigo-200 hover:bg-white/10 hover:text-white"
              >
                Simulation Studio <FiArrowUpRight />
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default NavigationBar;
