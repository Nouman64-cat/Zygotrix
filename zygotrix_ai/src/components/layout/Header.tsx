import React, { useState } from 'react';
import { FiMenu, FiPlus, FiLogOut } from 'react-icons/fi';
import { MdPsychology } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { Logo, IconButton, ThemeSwitcher, PreferencesModal } from '../common';

interface HeaderProps {
  onMenuClick?: () => void;
  onNewChat?: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onNewChat,
  showMenuButton = true,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2">
          {showMenuButton && (
            <IconButton
              icon={<FiMenu />}
              onClick={onMenuClick}
              tooltip="Toggle sidebar"
              className="md:hidden"
            />
          )}
          
          {/* Mobile-only logo and text */}
          <div className="flex items-center gap-2 md:hidden">
            <img 
              src="/zygotrix-ai.png" 
              alt="Zygotrix" 
              className="w-6 h-6 object-cover rounded-full"
            />
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Zygotrix AI
            </span>
          </div>
          
          {/* Desktop logo */}
          <div className="hidden md:block">
            <Logo size="md" showText={true} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher variant="icon" />

          <IconButton
            icon={<MdPsychology />}
            onClick={() => setShowPreferences(true)}
            tooltip="AI Behavior Preferences"
            variant="ghost"
          />

          <IconButton
            icon={<FiPlus />}
            onClick={onNewChat}
            tooltip="New chat"
            variant="ghost"
          />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.full_name || user?.email}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <FiLogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Behavior Preferences Modal */}
      <PreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </header>
  );
};
