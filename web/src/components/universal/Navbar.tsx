import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FiLogOut, FiSun, FiMoon } from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import logo from "../../../public/zygotrix-logo.png";

import { PiDna } from "react-icons/pi";
import { IoSchoolOutline } from "react-icons/io5";

const ZYGOTRIX_UNIVERSITY_URL = import.meta.env.VITE_ZYGOTRIX_UNIVERSITY_APP;

const baseNavItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Zygotrix AI", to: "/zygoai" },
  { label: "Blogs", to: "/blogs" },
  { label: "Community", to: "/community" },
];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navItems = useMemo(() => {
    return baseNavItems;
  }, [user]);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${isActive
      ? "text-[#1E3A8A] dark:text-[#3B82F6] bg-blue-50 dark:bg-blue-500/10"
      : "text-slate-600 dark:text-slate-300 hover:text-[#1E3A8A] dark:hover:text-[#3B82F6] hover:bg-slate-50 dark:hover:bg-slate-800/50"
    }`;

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl" />

      {/* Subtle gradient border at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1E3A8A]/20 dark:via-[#3B82F6]/30 to-transparent" />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#10B981] rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
            <img src={logo} alt="Zygotrix" className="relative w-10 h-10 object-contain" />
          </div>
          <div className="hidden sm:block">
            <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Zygotrix
            </p>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Genetics Intelligence
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#1E3A8A] dark:hover:text-[#3B82F6] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <FiSun className="w-5 h-5" />
            ) : (
              <FiMoon className="w-5 h-5" />
            )}
          </button>

          {/* University Link */}
          <a
            href={ZYGOTRIX_UNIVERSITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl text-[#10B981] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all duration-200"
            title="Zygotrix University"
          >
            <IoSchoolOutline className="h-5 w-5" />
          </a>

          {user ? (
            <>
              {/* Studio Button */}
              <Link
                to="/studio"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] dark:from-[#3B82F6] dark:to-[#10B981] text-white font-medium text-sm shadow-lg shadow-[#1E3A8A]/25 dark:shadow-[#3B82F6]/25 hover:shadow-[#1E3A8A]/40 dark:hover:shadow-[#3B82F6]/40 hover:scale-[1.02] transition-all duration-200"
              >
                <PiDna className="h-4 w-4" />
                <span>Studio</span>
              </Link>

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
              >
                <FiLogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </>
          ) : (
            <>
              {/* Sign In */}
              <Link
                to="/signin"
                state={{ from: { pathname: location.pathname } }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#1E3A8A] dark:hover:text-[#3B82F6] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 lg:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="relative lg:hidden">
          <div className="absolute inset-x-0 top-0 mx-4 mt-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-4 space-y-2">
            {/* Theme Toggle Row */}
            <div className="flex justify-end mb-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-400 hover:text-[#1E3A8A] dark:hover:text-[#3B82F6] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <FiSun className="w-5 h-5" />
                ) : (
                  <FiMoon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Nav Links */}
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-base font-medium transition-all ${isActive
                    ? "bg-blue-50 dark:bg-blue-500/10 text-[#1E3A8A] dark:text-[#3B82F6]"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1E3A8A]/20 dark:via-[#3B82F6]/30 to-transparent my-3" />

            {/* Auth Actions */}
            {user ? (
              <div className="space-y-2">
                <Link
                  to="/studio"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] dark:from-[#3B82F6] dark:to-[#10B981] text-white font-medium shadow-lg shadow-[#1E3A8A]/25 dark:shadow-[#3B82F6]/25"
                >
                  <PiDna className="h-5 w-5" />
                  <span>Open Studio</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-all"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/signin"
                state={{ from: { pathname: location.pathname } }}
                className="block rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-300 hover:border-[#1E3A8A]/30 dark:hover:border-[#3B82F6]/50 hover:text-[#1E3A8A] dark:hover:text-[#3B82F6] transition-all"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
