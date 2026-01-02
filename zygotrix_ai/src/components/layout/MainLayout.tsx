import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiSettings, FiExternalLink, FiLogOut } from 'react-icons/fi';
import { Sidebar } from './Sidebar';
import { IconButton, Logo } from '../common';
import { useAuth } from '../../contexts';
import { LOGO_URL } from '../../config';
import type { LocalConversation } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  conversations: LocalConversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onPinConversation: (id: string, isPinned: boolean) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onPinConversation,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Get user initials
  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    const names = user.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    if (isAvatarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAvatarMenuOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
        onRenameConversation={onRenameConversation}
        onPinConversation={onPinConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Desktop: Logo & Name - Top Left */}
        <div className="hidden md:block absolute top-4 left-4 z-10">
          <Logo size="sm" showText={true} />
        </div>

        {/* Mobile: Header with menu button, logo, and user avatar */}
        <div className="md:hidden flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <IconButton
              icon={<FiMenu />}
              onClick={() => setIsSidebarOpen(true)}
              tooltip="Open menu"
            />
            <img
              src={LOGO_URL}
              alt="Zygotrix"
              className="w-8 h-8 object-cover rounded-full"
            />
            <span className="text-md font-semibold text-gray-900 dark:text-gray-100">
              Zygotrix AI
            </span>
          </div>
          
          {/* User Avatar with Dropdown */}
          <div className="relative" ref={avatarMenuRef}>
            <button
              onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
              className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer"
            >
              {getUserInitials()}
            </button>

            {/* Dropdown Menu */}
            {isAvatarMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px]">
                {/* User info */}
                {user && (
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                )}

                {/* Settings */}
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsAvatarMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <FiSettings size={16} />
                  Settings
                </button>

                {/* Docs */}
                <a
                  href="https://docs.zygotrix.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setIsAvatarMenuOpen(false)}
                >
                  <FiExternalLink size={16} />
                  Documentation
                </a>

                {/* Divider */}
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

                {/* Logout */}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsAvatarMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                >
                  <FiLogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
