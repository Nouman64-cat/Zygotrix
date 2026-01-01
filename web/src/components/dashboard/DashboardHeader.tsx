import React from "react";
import { Link } from "react-router-dom";
import { LOGO_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuToggle }) => {
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleSignOut = () => {
    signOut();
  };

  const cycleTheme = () => {
    // Cycle through: light -> dark -> auto -> light
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("auto");
    } else {
      setTheme("light");
    }
  };

  const getThemeIcon = () => {
    if (theme === "auto") {
      // Auto/System icon
      return (
        <svg
          className="w-5 h-5 text-slate-600 dark:text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    } else if (resolvedTheme === "dark") {
      // Moon icon for dark mode
      return (
        <svg
          className="w-5 h-5 text-slate-600 dark:text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      );
    } else {
      // Sun icon for light mode
      return (
        <svg
          className="w-5 h-5 text-slate-600 dark:text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    }
  };

  const getThemeLabel = () => {
    if (theme === "auto") return "System";
    if (theme === "dark") return "Dark";
    return "Light";
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 2xl:px-4 py-2 2xl:py-3 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between">
        {/* Left section with menu toggle and logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6 text-slate-600 dark:text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <Link to="/studio" className="flex items-center gap-2 2xl:gap-3">
            <img src={LOGO_URL} alt="Zygotrix" className="w-7 h-7 2xl:w-8 2xl:h-8" />
            <div className="hidden sm:block">
              <h1 className="text-sm 2xl:text-lg font-semibold text-slate-900 dark:text-white">
                Zygotrix Studio
              </h1>
              <p className="text-[10px] 2xl:text-xs text-slate-500 dark:text-slate-400 hidden xl:block">
                Genetics Intelligence Dashboard
              </p>
            </div>
          </Link>
        </div>

        {/* Right section with user info and actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <div className="relative group">
            <button
              onClick={cycleTheme}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={`Current theme: ${getThemeLabel()}. Click to change.`}
            >
              {getThemeIcon()}
            </button>
            {/* Tooltip */}
            <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Theme: {getThemeLabel()}
              <br />
              <span className="text-gray-400">Click to change</span>
            </div>
          </div>

          {/* Notifications */}
          <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
            <svg
              className="w-5 h-5 text-slate-600 dark:text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User dropdown */}
          <div className="flex items-center gap-2 2xl:gap-3">
            <div className="hidden lg:block text-right">
              <p className="text-xs 2xl:text-sm font-medium text-slate-900 dark:text-white truncate max-w-24 2xl:max-w-none">
                {user?.full_name || "User"}
              </p>
              <p className="text-[10px] 2xl:text-xs text-slate-500 dark:text-slate-400 truncate max-w-24 2xl:max-w-none">
                {user?.email}
              </p>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1 2xl:gap-2 p-1.5 2xl:p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div className="w-7 h-7 2xl:w-8 2xl:h-8 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs 2xl:text-sm font-semibold">
                    {user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-slate-500 dark:text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link
                    to="/studio/profile"
                    className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/studio/preferences"
                    className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Preferences
                  </Link>
                  <hr className="my-1 border-slate-100 dark:border-slate-700" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
