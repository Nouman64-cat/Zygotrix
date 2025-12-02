import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import logo from "../../../public/zygotrix-logo.png";

import { PiDna } from "react-icons/pi";
import { IoSchoolOutline } from "react-icons/io5";

const ZYGOTRIX_UNIVERSITY_URL = import.meta.env.VITE_ZYGOTRIX_UNIVERSITY_APP;

const baseNavItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Blogs", to: "/blogs" },
  { label: "Community", to: "/community" },
  // { label: "Playground", to: "/playground" },
  // { label: "Joint Analysis", to: "/joint-phenotype" },
];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navItems = useMemo(() => {
    return baseNavItems;
  }, [user]);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-white dark:bg-slate-700 text-[#1E3A8A] dark:text-white shadow"
        : "text-gray/80 dark:text-slate-300 hover:opacity-80"
    }`;

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-white/10 dark:border-slate-700/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2">
          <div>
            <img src={logo} alt="Zygotrix" className="w-[3rem]" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gray dark:text-slate-200">
              Zygotrix
            </p>
            <p className="text-xs font-medium text-gray/70 dark:text-slate-400">
              Genetics intelligence engine
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 dark:border-slate-700 bg-white/5 dark:bg-slate-800/50 px-2 py-1 backdrop-blur-lg lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={ZYGOTRIX_UNIVERSITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/40 px-5 py-2 text-sm font-semibold text-[#1E3A8A] dark:text-blue-300 shadow-lg shadow-black/10 dark:shadow-black/30 transition hover:shadow-black/30 dark:hover:shadow-black/50 hover:bg-blue-200 dark:hover:bg-blue-900/60"
          >
            <IoSchoolOutline className="h-5 w-5" />
          </a>
          {user ? (
            <>
              <Link
                to="/studio"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-700 px-5 py-2 text-sm font-semibold text-[#1E3A8A] dark:text-white shadow-lg shadow-black/20 dark:shadow-black/40 transition hover:shadow-black/40 dark:hover:shadow-black/60"
              >
                <PiDna className="h-5 w-5" />

              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center cursor-pointer bg-white dark:bg-slate-700 rounded-full justify-center gap-2 px-5 py-2 text-sm font-semibold text-gray dark:text-slate-300 transition hover:text-red-500 dark:hover:text-red-400"
              >
                <FiLogOut className="h-5 w-5" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                state={{ from: { pathname: location.pathname } }}
                className="inline-flex items-center justify-center rounded-full border border-gray/20 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-gray dark:text-slate-300 transition hover:bg-white dark:hover:bg-slate-700 hover:border-white dark:hover:border-slate-600 hover:text-[#1E3A8A] dark:hover:text-white"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 dark:border-slate-600 text-gray dark:text-slate-300 lg:hidden"
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
          <div className="mx-4 mb-4 space-y-2 rounded-3xl border border-white/10 dark:border-slate-700 bg-slate-900/95 dark:bg-slate-800/95 p-4 shadow-2xl backdrop-blur">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-base font-semibold transition ${
                    isActive ? "bg-white dark:bg-slate-700 text-[#1E3A8A] dark:text-white" : "text-gray dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-slate-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="block w-full rounded-2xl border border-white/20 dark:border-slate-600 px-4 py-3 text-center text-base font-semibold text-white dark:text-slate-300"
              >
                Sign out
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/signin"
                  state={{ from: { pathname: location.pathname } }}
                  className="block rounded-2xl border border-white/20 dark:border-slate-600 px-4 py-3 text-center text-base font-semibold text-white dark:text-slate-300"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  state={{ from: { pathname: location.pathname } }}
                  className="block rounded-2xl bg-white dark:bg-slate-700 px-4 py-3 text-center text-base font-semibold text-[#1E3A8A] dark:text-white shadow-lg shadow-black/30 dark:shadow-black/50"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
