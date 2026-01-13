import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTrash2,
  FiMenu,
  FiX,
  FiSearch,
  FiEdit,
  FiMoreVertical,
  FiEdit2,
  FiLogOut,
  FiSettings,
  FiExternalLink,
  FiChevronUp,
} from "react-icons/fi";
import { BsPinAngle, BsPinFill } from "react-icons/bs";
import { cn, truncateText } from "../../utils";
import { IconButton, Button, Logo } from "../common";
import { useAuth, useConversations } from "../../contexts";
import type { UserProfile } from "../../types";

// User Avatar Dropdown Component
interface UserAvatarDropdownProps {
  user: UserProfile | null;
  isCollapsed: boolean;
  onSettings: () => void;
  onLogout: () => void;
}

const UserAvatarDropdown: React.FC<UserAvatarDropdownProps> = ({
  user,
  isCollapsed,
  onSettings,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initials
  const getUserInitials = () => {
    if (!user?.full_name) return "U";
    const names = user.full_name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 w-full rounded-lg transition-colors duration-200 cursor-pointer",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          isCollapsed ? "justify-center p-2" : "px-3 py-2"
        )}
      >
        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {getUserInitials()}
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.full_name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || ""}
              </p>
            </div>
            <FiChevronUp
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0",
                isOpen ? "rotate-0" : "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px]",
            isCollapsed
              ? "left-full ml-2 bottom-0"
              : "bottom-full mb-2 left-0 right-0"
          )}
        >
          {/* User info header (if collapsed) */}
          {isCollapsed && user && (
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user.full_name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          )}

          {/* Settings */}
          <button
            onClick={() => {
              onSettings();
              setIsOpen(false);
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
            onClick={() => setIsOpen(false)}
          >
            <FiExternalLink size={16} />
            Documentation
          </a>

          {/* Divider */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          {/* Logout */}
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
          >
            <FiLogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isSearchOpen: boolean;
  onToggleSearch: (isOpen: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  isSearchOpen,
  onToggleSearch,
  searchQuery,
  onSearchQueryChange,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    conversations,
    loading,
    deleteConversation: onDeleteConversation,
    renameConversation: onRenameConversation,
    pinConversation: onPinConversation,
  } = useConversations();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // searchQuery and isSearchOpen state moved to props

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Renaming state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleRenameSubmit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const filteredConversations = React.useMemo(
    () =>
      conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery]
  );

  // Memoized item component to prevent unnecessary re-renders
  const ConversationItem = React.memo(
    ({
      conversation,
    }: {
      conversation: import("../../types").ConversationSummary;
    }) => {
      // Log conversation state for debugging
      console.log(
        "[Sidebar] Rendering conversation:",
        conversation.id.slice(0, 8),
        "is_generating_title:",
        conversation.is_generating_title,
        "title:",
        conversation.title?.slice(0, 30)
      );
      return (
        <div
          key={conversation.id}
          className={cn(
            "group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer",
            "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200",
            currentConversationId === conversation.id &&
              "bg-gray-100 dark:bg-gray-800",
            isCollapsed && "hidden"
          )}
          onClick={() => {
            onSelectConversation(conversation.id);
            onClose();
          }}
        >
          {editingId === conversation.id ? (
            <input
              autoFocus
              type="text"
              className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 text-sm font-medium border-none outline-none focus:ring-0 p-0 m-0 w-full truncate"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setEditingId(null);
                  setEditTitle("");
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex-1 flex items-center min-w-0">
              {conversation.is_pinned && (
                <BsPinFill className="w-3 h-3 text-blue-500 mr-1.5 shrink-0" />
              )}

              {/* Skeleton Loading State: Show when title is being generated */}
              {conversation.is_generating_title ? (
                <div className="flex-1 flex items-center min-w-0 gap-2">
                  {/* Skeleton shimmer animation */}
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-3.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%]"
                      style={{ width: "85%" }}
                    />
                    <div
                      className="h-2.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%]"
                      style={{ width: "60%", animationDelay: "0.15s" }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {editingId === conversation.id
                    ? editTitle
                    : truncateText(conversation.title, 35)}
                </p>
              )}
            </div>
          )}
          <IconButton
            icon={<FiMoreVertical />}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(
                activeMenuId === conversation.id ? null : conversation.id
              );
            }}
            size="sm"
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              activeMenuId === conversation.id &&
                "opacity-100 bg-gray-200 dark:bg-gray-700"
            )}
            tooltip="Options"
          />

          {/* Options Menu */}
          {activeMenuId === conversation.id && (
            <div className="absolute right-2 top-10 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden py-1">
              <button
                className="w-full text-left px-3 py-2 text-sm hover:!bg-gray-50 dark:hover:!bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(conversation.id);
                  setEditTitle(conversation.title);
                  setActiveMenuId(null);
                }}
              >
                <FiEdit2 size={14} /> Rename
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:!bg-gray-50 dark:hover:!bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onPinConversation(conversation.id, !conversation.is_pinned);
                  setActiveMenuId(null);
                }}
              >
                <BsPinAngle size={14} />
                {conversation.is_pinned ? "Unpin" : "Pin"}
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
              <button
                className="w-full text-left px-3 py-2 text-sm hover:!bg-red-50 dark:hover:!bg-red-900/20 text-red-600 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  // Prevent infinite loops/API errors by navigating away first
                  // if deleting the currently active conversation
                  if (currentConversationId === conversation.id) {
                    navigate("/chat");
                  }
                  onDeleteConversation(conversation.id);
                  setActiveMenuId(null);
                }}
              >
                <FiTrash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      );
    }
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Click outside to close menu */}

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30",
          "flex flex-col transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-16" : "w-72"
        )}
      >
        {/* Click outside to close menu */}
        {activeMenuId && (
          <div
            className="fixed inset-0 z-40 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(null);
            }}
          />
        )}
        <div
          className={cn(
            "hidden md:flex items-center px-2 pt-4 pb-2 mb-1 min-h-[44px]",
            isCollapsed && !isSearchOpen
              ? "justify-center"
              : isSearchOpen
              ? "bg-gray-50 dark:bg-gray-800/50 rounded-lg mx-2"
              : "justify-between"
          )}
        >
          {!isCollapsed && isSearchOpen ? (
            <div className="flex items-center w-full gap-2 px-2 py-1.5">
              <FiSearch className="text-gray-400 w-4 h-4" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm p-0 text-gray-900 dark:text-gray-100 placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
              <IconButton
                icon={<FiX />}
                onClick={() => onToggleSearch(false)}
                size="sm"
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 w-6 h-6 min-h-0"
              />
            </div>
          ) : (
            <>
              <IconButton
                icon={<FiMenu />}
                onClick={onToggleCollapse}
                tooltip={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="cursor-pointer text-gray-500 hover:text-gray-900 hover:!bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:!bg-gray-800"
              />

              {!isCollapsed && (
                <IconButton
                  icon={<FiSearch />}
                  onClick={() => onToggleSearch(true)}
                  tooltip="Search conversations"
                  className="cursor-pointer text-gray-500 hover:text-gray-900 hover:!bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:!bg-gray-800"
                />
              )}
            </>
          )}
        </div>

        {/* Mobile Header: Logo & Title (Mobile Only) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 md:hidden">
          <Logo size="md" showText={true} />
          {/* Mobile close button handled below if needed, or by parent overlay */}

          {/* Mobile close button */}
          <IconButton
            icon={<FiX />}
            onClick={onClose}
            className="md:hidden"
            tooltip="Close"
          />
        </div>

        {/* New Chat Button (Desktop only) */}
        <div className="hidden md:block p-2 border-b border-gray-200 dark:border-gray-800">
          {isCollapsed ? (
            <div className="flex justify-center">
              <IconButton
                icon={<FiEdit />}
                onClick={() => {
                  onNewConversation();
                  onClose();
                }}
                tooltip="New chat"
                className="cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                size="sm"
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-left hover:!bg-gray-100 dark:hover:!bg-gray-700/50 text-gray-700 dark:text-gray-200 shadow-none transition-colors cursor-pointer"
              leftIcon={<FiEdit className="text-gray-500" />}
              onClick={() => {
                onNewConversation();
                onClose();
              }}
              size="sm"
            >
              New Chat
            </Button>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 pt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Chats
            </div>
          )}
          {filteredConversations.length === 0
            ? !isCollapsed && (
                <div className="text-center py-8 px-4">
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading conversations...
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {searchQuery
                        ? "No matching conversations"
                        : "No conversations yet"}
                    </p>
                  )}
                </div>
              )
            : filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                />
              ))}
        </div>

        {/* Bottom Section: User Avatar with Dropdown */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <UserAvatarDropdown
            user={user}
            isCollapsed={isCollapsed}
            onSettings={() => {
              navigate("/settings");
              onClose();
            }}
            onLogout={handleLogout}
          />
        </div>
      </aside>
    </>
  );
};
