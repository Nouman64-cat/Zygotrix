import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiMessageSquare,
  FiUser,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiX,
  FiPlus,
} from "react-icons/fi";
import AskQuestionModal from "../components/community/AskQuestionModal";
import { useAuth } from "../context/AuthContext";
import CommunitySidebar from "../components/community/CommunitySidebar";
import { PiDna } from "react-icons/pi";

const CommunityLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950">
      {/* DNA Pattern Background */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.015]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <pattern
            id="community-layout-dna"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M25,10 Q50,30 75,10 M25,90 Q50,70 75,90 M25,10 L25,90 M75,10 L75,90"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <circle cx="25" cy="30" r="2" fill="currentColor" />
            <circle cx="75" cy="30" r="2" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#community-layout-dna)" />
        </svg>
      </div>

      {/* Compact Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/80 backdrop-blur-lg shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-md group-hover:shadow-lg transition-shadow">
                  <FiHome className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    ZYGOTRIX
                  </div>
                  <div className="text-xs text-slate-400">Community</div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/community"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive("/community")
                      ? "bg-blue-900/30 text-blue-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <FiMessageSquare className="h-4 w-4" />
                  Questions
                </Link>
              </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Post Question Button - Desktop */}
              {user && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                >
                  <FiPlus className="h-4 w-4" />
                  Post Question
                </button>
              )}

              {/* User Menu - Desktop */}
              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <>
                    <Link
                      to="/studio"
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      <PiDna className="h-4 w-4" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="max-w-[120px] truncate">
                        {user.full_name || user.email.split("@")[0]}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 transition"
                    >
                      <FiLogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      state={{ from: { pathname: location.pathname } }}
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:border-blue-500 hover:text-blue-400 transition"
                    >
                      <FiLogIn className="h-4 w-4" />
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      state={{ from: { pathname: location.pathname } }}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-slate-300 hover:bg-slate-800 transition"
              >
                {mobileMenuOpen ? (
                  <FiX className="h-5 w-5" />
                ) : (
                  <FiMenu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700 py-4 space-y-2">
              <Link
                to="/community"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive("/community")
                    ? "bg-blue-900/30 text-blue-400"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <FiMessageSquare className="h-4 w-4" />
                Questions
              </Link>

              {user ? (
                <>
                  <Link
                    to="/studio"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg"
                  >
                    <FiUser className="h-4 w-4" />
                    Zygotrix Studio
                  </Link>
                  <div className="px-3 py-2 text-sm text-slate-300">
                    Welcome, {user.full_name || user.email.split("@")[0]}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 transition"
                  >
                    <FiLogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/signin"
                    state={{ from: { pathname: location.pathname } }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg border-2 border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                  >
                    <FiLogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    state={{ from: { pathname: location.pathname } }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-8">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <Outlet />
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
                <CommunitySidebar />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default CommunityLayout;
