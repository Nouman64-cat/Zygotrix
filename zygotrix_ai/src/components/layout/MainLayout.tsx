import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiSettings, FiExternalLink, FiLogOut } from "react-icons/fi";
import { Sidebar } from "./Sidebar";
import { IconButton, Logo } from "../common";
import {
  useAuth,
  useVoiceControl,
  useTheme,
  useVoiceCommand,
} from "../../contexts";
import { VoiceStatus } from "../common/VoiceStatus";

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
  const { toggleListening } = useVoiceControl();
  const { toggleTheme } = useTheme();

  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleNewConversation = () => {
    navigate("/chat");
  };

  // Voice Commands using package's useVoiceCommand hook
  useVoiceCommand({
    id: "open-settings",
    description: "Navigates to the settings page",
    action: () => {
      console.log("🎯 Opening settings");
      navigate("/settings");
    },
  });

  useVoiceCommand({
    id: "go-to-chat",
    description: "Navigates to the main chat interface",
    action: () => navigate("/chat"),
  });

  useVoiceCommand({
    id: "create-new-chat",
    description: "Starts a new empty conversation",
    action: () => {
      console.log("🎯 Creating new chat");
      handleNewConversation();
    },
  });

  useVoiceCommand({
    id: "change-theme",
    description: "Toggles between light and dark theme",
    action: () => {
      console.log("🎨 Changing theme");
      toggleTheme();
    },
  });

  useVoiceCommand({
    id: "show-usage",
    description: "Shows your AI token usage statistics",
    action: () => {
      console.log("📊 Showing usage statistics");
      navigate("/settings#usage");
    },
  });

  useVoiceCommand({
    id: "greeting",
    description: "Responds to greetings like hi, hello, hey",
    action: () => {
      const greetings = [
        "Hello! How can I help you analyze genetics today?",
        "Hi there! Ready to explore some DNA sequences?",
      ];
      console.log(
        "👋 Greeting:",
        greetings[Math.floor(Math.random() * greetings.length)]
      );
    },
  });

  useVoiceCommand({
    id: "goodbye",
    description:
      "Closes voice control. Examples: bye, bye bye, exit, quit, goodbye, see you later",
    action: () => {
      console.log("👋 Goodbye!");
      setTimeout(() => toggleListening(), 1000);
    },
  });

  useVoiceCommand({
    id: "open-sidebar",
    description: "Opens or expands the sidebar",
    action: () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsCollapsed(false);
      }
      console.log("📁 Opening sidebar");
    },
  });

  useVoiceCommand({
    id: "close-sidebar",
    description: "Closes or collapses the sidebar",
    action: () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsCollapsed(true);
        setIsSearchOpen(false);
      }
      console.log("📁 Closing sidebar");
    },
  });

  useVoiceCommand({
    id: "search-chat",
    description: "Searches conversations. Examples: search chat for hello",
    action: () => {
      setIsSidebarOpen(true);
      setIsCollapsed(false);
      setIsSearchOpen(true);
      console.log("🔍 Opening search");
    },
  });

  useVoiceCommand({
    id: "clear-search",
    description: "Clears the search input field",
    action: () => {
      setSearchQuery("");
      console.log("🔍 Search cleared");
    },
  });

  // Auto-clear search when closed
  useEffect(() => {
    if (!isSearchOpen) setSearchQuery("");
  }, [isSearchOpen]);

  // Mobile Avatar Menu State
  const [isMobileAvatarOpen, setIsMobileAvatarOpen] = useState(false);
  const mobileAvatarRef = useRef<HTMLDivElement>(null);

  // Desktop Avatar Menu State
  const [isDesktopAvatarOpen, setIsDesktopAvatarOpen] = useState(false);
  const desktopAvatarRef = useRef<HTMLDivElement>(null);

  // Get user initials
  const getUserInitials = () => {
    if (!user?.full_name) return "U";
    const names = user.full_name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileAvatarRef.current &&
        !mobileAvatarRef.current.contains(event.target as Node)
      ) {
        setIsMobileAvatarOpen(false);
      }
      if (
        desktopAvatarRef.current &&
        !desktopAvatarRef.current.contains(event.target as Node)
      ) {
        setIsDesktopAvatarOpen(false);
      }
    };

    if (isMobileAvatarOpen || isDesktopAvatarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileAvatarOpen, isDesktopAvatarOpen]);

  // Render Avatar Menu Content
  const renderAvatarMenu = (closeFn: () => void) => (
    <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px]">
      {user && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.full_name || "User"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
      )}

      <button
        onClick={() => {
          navigate("/settings");
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
        {/* Desktop Header */}
        <div className="absolute top-0 left-0 w-full z-20 hidden md:flex items-center justify-end px-6 py-3 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">


            <div className="relative" ref={desktopAvatarRef}>
              <button
                onClick={() => setIsDesktopAvatarOpen(!isDesktopAvatarOpen)}
                className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer transition-transform hover:scale-105"
              >
                {getUserInitials()}
              </button>
              {isDesktopAvatarOpen &&
                renderAvatarMenu(() => setIsDesktopAvatarOpen(false))}
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
            <Logo size="sm" showText={true} />
          </div>

          <div className="flex items-center gap-2">


            <div className="relative" ref={mobileAvatarRef}>
              <button
                onClick={() => setIsMobileAvatarOpen(!isMobileAvatarOpen)}
                className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer"
              >
                {getUserInitials()}
              </button>

              {isMobileAvatarOpen &&
                renderAvatarMenu(() => setIsMobileAvatarOpen(false))}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-hidden">{children}</main>
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
