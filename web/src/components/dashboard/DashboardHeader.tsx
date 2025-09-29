import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../public/zygotrix-logo.png";
import { useAuth } from "../../context/AuthContext";

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuToggle }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left section with menu toggle and logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6 text-slate-600"
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

          <Link to="/portal" className="flex items-center gap-3">
            <img src={logo} alt="Zygotrix" className="w-8 h-8" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-slate-900">
                Zygotrix Portal
              </h1>
              <p className="text-xs text-slate-500">
                Genetics Intelligence Dashboard
              </p>
            </div>
          </Link>
        </div>

        {/* Right section with user info and actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 rounded-md hover:bg-slate-100 transition-colors relative">
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5-5-5 5h5zm0 0v-5a6 6 0 00-12 0v5m12 0H3m12 0l3 3"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User dropdown */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">
                {user?.full_name || "User"}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-slate-500"
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
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link
                    to="/portal/profile"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/portal/preferences"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Preferences
                  </Link>
                  <hr className="my-1 border-slate-100" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
