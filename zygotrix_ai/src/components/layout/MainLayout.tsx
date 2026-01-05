import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiSettings, FiExternalLink, FiLogOut } from 'react-icons/fi';
import { Sidebar } from './Sidebar';
import { IconButton, Logo } from '../common';
import { useAuth, useVoiceControl, useTheme, useVoiceCommand } from '../../contexts';
import { LOGO_URL } from '../../config';
import { VoiceStatus } from '../common/VoiceStatus';

interface MainLayoutProps {
  children: React.ReactNode;
  currentConversationId?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentConversationId,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleListening, isListening, isDictating } = useVoiceControl();
  const { toggleTheme } = useTheme();

  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleNewConversation = () => {
    navigate('/chat');
  };

  // Voice Commands using package's useVoiceCommand hook
  useVoiceCommand({
    id: 'open-settings',
    description: 'Navigates to the settings page',
    action: () => {
      console.log('🎯 Opening settings');
      navigate('/settings');
    }
  });

  useVoiceCommand({
    id: 'go-to-chat',
    description: 'Navigates to the main chat interface',
    action: () => navigate('/chat')
  });

  useVoiceCommand({
    id: 'create-new-chat',
    description: 'Starts a new empty conversation',
    action: () => {
      console.log('🎯 Creating new chat');
      handleNewConversation();
    }
  });

  useVoiceCommand({
    id: 'change-theme',
    description: 'Toggles between light and dark theme',
    action: () => {
      console.log('🎨 Changing theme');
      toggleTheme();
    }
  });

  useVoiceCommand({
    id: 'show-usage',
    description: 'Shows your AI token usage statistics',
    action: () => {
      console.log('📊 Showing usage statistics');
      navigate('/settings#usage');
    }
  });

  useVoiceCommand({
    id: 'greeting',
    description: 'Responds to greetings like hi, hello, hey',
    action: () => {
      const greetings = [
        'Hello! How can I help you analyze genetics today?',
        'Hi there! Ready to explore some DNA sequences?',
      ];
      console.log('👋 Greeting:', greetings[Math.floor(Math.random() * greetings.length)]);
    }
  });

  useVoiceCommand({
    id: 'goodbye',
    description: 'Closes voice control. Examples: bye, exit, quit, goodbye',
    action: () => {
      console.log('👋 Goodbye!');
      setTimeout(() => toggleListening(), 1000);
    }
  });

  useVoiceCommand({
    id: 'open-sidebar',
    description: 'Opens or expands the sidebar',
    action: () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsCollapsed(false);
      }
      console.log('📁 Opening sidebar');
    }
  });

  useVoiceCommand({
    id: 'close-sidebar',
    description: 'Closes or collapses the sidebar',
    action: () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsCollapsed(true);
        setIsSearchOpen(false);
      }
      console.log('📁 Closing sidebar');
    }
  });

  useVoiceCommand({
    id: 'search-chat',
    description: 'Searches conversations. Examples: search chat for hello',
    action: () => {
      setIsSidebarOpen(true);
      setIsCollapsed(false);
      setIsSearchOpen(true);
      console.log('🔍 Opening search');
    }
  });

  useVoiceCommand({
    id: 'clear-search',
    description: 'Clears the search input field',
    action: () => {
      setSearchQuery('');
      console.log('🔍 Search cleared');
    }
  });

  // Auto-clear search when closed
  useEffect(() => {
    if (!isSearchOpen) setSearchQuery('');
  }, [isSearchOpen]);

  // Mobile Avatar Menu State
  const [isMobileAvatarOpen, setIsMobileAvatarOpen] = useState(false);
  const mobileAvatarRef = useRef<HTMLDivElement>(null);

  // Desktop Avatar Menu State
  const [isDesktopAvatarOpen, setIsDesktopAvatarOpen] = useState(false);
  const desktopAvatarRef = useRef<HTMLDivElement>(null);

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileAvatarRef.current && !mobileAvatarRef.current.contains(event.target as Node)) {
        setIsMobileAvatarOpen(false);
      }
      if (desktopAvatarRef.current && !desktopAvatarRef.current.contains(event.target as Node)) {
        setIsDesktopAvatarOpen(false);
      }
    };

    if (isMobileAvatarOpen || isDesktopAvatarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileAvatarOpen, isDesktopAvatarOpen]);

  // Render Avatar Menu Content
  const renderAvatarMenu = (closeFn: () => void) => (
    <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px]">
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

      <button
        onClick={() => {
          navigate('/settings');
          closeFn();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
      >
        <FiSettings size={16} />
        Settings
      </button>

      <a
        href="https://docs.zygotrix.com"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        onClick={() => closeFn()}
      >
        <FiExternalLink size={16} />
        Documentation
      </a>

      <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

      <button
        onClick={() => {
          handleLogout();
          closeFn();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
      >
        <FiLogOut size={16} />
        Sign Out
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <Sidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isSearchOpen={isSearchOpen}
        onToggleSearch={setIsSearchOpen}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <Logo size="sm" showText={true} />

          <div className="flex items-center gap-2">
            {/* Magic Wand Voice Control Button */}
            <button
              onClick={toggleListening}
              title={isDictating ? "Dictating to input..." : (isListening ? "Stop Listening" : "Start Voice Control")}
              className="relative cursor-pointer group"
            >
              {isListening && !isDictating && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-75" />
              )}

              <div className={`
                relative w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 group-hover:scale-105
                ${isListening && !isDictating
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}>

                <svg
                  className={`w-5 h-5 transition-all duration-300 ${isListening && !isDictating
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                    }`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.996.996 0 00-1.41 0L1.29 18.96a.996.996 0 000 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 000-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z" />
                </svg>
              </div>
            </button>


            <div className="relative" ref={desktopAvatarRef}>
              <button
                onClick={() => setIsDesktopAvatarOpen(!isDesktopAvatarOpen)}
                className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer transition-transform hover:scale-105"
              >
                {getUserInitials()}
              </button>
              {isDesktopAvatarOpen && renderAvatarMenu(() => setIsDesktopAvatarOpen(false))}
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
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

          <div className="flex items-center gap-2">
            <button
              onClick={toggleListening}
              title={isListening ? "Stop Listening" : "Start Voice Control"}
              className="relative cursor-pointer group"
            >
              {isListening && !isDictating && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping opacity-75" />
              )}

              <div className={`
                relative w-9 h-9 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isListening && !isDictating
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-gray-100 dark:bg-gray-800'
                }
              `}>
                <svg
                  className={`w-4 h-4 transition-colors duration-300 ${isListening && !isDictating ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.996.996 0 00-1.41 0L1.29 18.96a.996.996 0 000 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 000-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z" />
                </svg>
              </div>
            </button>

            <div className="relative" ref={mobileAvatarRef}>
              <button
                onClick={() => setIsMobileAvatarOpen(!isMobileAvatarOpen)}
                className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer"
              >
                {getUserInitials()}
              </button>

              {isMobileAvatarOpen && renderAvatarMenu(() => setIsMobileAvatarOpen(false))}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
        <VoiceStatus />

        <style>{`
          @keyframes aiDots {
            0%, 100% { transform: translateY(0); opacity: 0.5; }
            50% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};
