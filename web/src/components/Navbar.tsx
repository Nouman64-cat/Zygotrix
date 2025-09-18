import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Playground", to: "/playground" },
  { label: "Contact", to: "/contact" },
];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-white text-[#1E3A8A] shadow"
        : "text-gray/80 hover:opacity-80"
    }`;

  return (
    <header className="sticky top-0 z-50 from-slate-900/95 via-slate-900/80 to-transparent backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#10B981] shadow-lg shadow-[#1E3A8A]/30 transition group-hover:shadow-[#1E3A8A]/50">
            <span className="text-lg font-black tracking-tight text-white">
              ZY
            </span>
          </span>
          <div className="leading-tight">
            <p className="text-base font-semibold uppercase tracking-[0.35em] text-gray">
              Zygotrix
            </p>
            <p className="text-xs font-medium text-gray/70">
              Genetics intelligence engine
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 backdrop-blur-lg lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            to="/playground"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#1E3A8A] shadow-lg shadow-black/20 transition hover:shadow-black/40"
          >
            Start exploring
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white lg:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Toggle navigation</span>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden">
          <div className="mx-4 mb-4 space-y-2 rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-base font-semibold transition ${
                    isActive
                      ? "bg-white text-[#1E3A8A]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/playground"
              className="block rounded-2xl bg-white px-4 py-3 text-center text-base font-semibold text-[#1E3A8A] shadow-lg shadow-black/30"
            >
              Start exploring
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
