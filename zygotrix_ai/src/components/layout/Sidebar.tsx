import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiX, FiLogOut, FiSettings, FiMenu, FiSearch, FiEdit, FiMoreVertical, FiEdit2 } from 'react-icons/fi';
import { BsPinAngle } from 'react-icons/bs';
import { cn, truncateText } from '../../utils';
import { IconButton, Button, Logo } from '../common';
import { useAuth } from '../../contexts';
import type { LocalConversation } from '../../types';

interface SidebarProps {
  conversations: LocalConversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
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
      {activeMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuId(null);
          }}
        />
      )}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30',
          'flex flex-col transition-all duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-16' : 'w-72'
        )}
      >
        <div className={cn(
          "hidden md:flex items-center px-2 pt-4 pb-2 mb-1 min-h-[44px]",
          (isCollapsed && !isSearchOpen) ? "justify-center" : (isSearchOpen ? "bg-gray-50 dark:bg-gray-800/50 rounded-lg mx-2" : "justify-between")
        )}>
          {(!isCollapsed && isSearchOpen) ? (
            <div className="flex items-center w-full gap-2 px-2 py-1.5">
              <FiSearch className="text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm p-0 text-gray-900 dark:text-gray-100 placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <IconButton
                icon={<FiX />}
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                size="sm"
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 w-6 h-6 min-h-0"
              />
            </div>
          ) : (
            <>
              <IconButton
                icon={<FiMenu />}
                onClick={() => setIsCollapsed(!isCollapsed)}
                tooltip={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="cursor-pointer text-gray-500 hover:text-gray-900 hover:!bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:!bg-gray-800"
              />

              {!isCollapsed && (
                <IconButton
                  icon={<FiSearch />}
                  onClick={() => setIsSearchOpen(true)}
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
              className="w-full justify-start text-left hover:!bg-gray-50 dark:hover:!bg-gray-800 text-gray-700 dark:text-gray-200 shadow-none transition-colors cursor-pointer"
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
          {filteredConversations.length === 0 ? (
            !isCollapsed && (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                </p>
              </div>
            )
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer',
                  'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200',
                  currentConversationId === conversation.id && 'bg-gray-100 dark:bg-gray-800',
                  isCollapsed && 'hidden' // Hide conversations when collapsed
                )}
                onClick={() => {
                  onSelectConversation(conversation.id);
                  onClose();
                }}
              >
                <p className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {truncateText(conversation.title, 35)}
                </p>
                <IconButton
                  icon={<FiMoreVertical />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === conversation.id ? null : conversation.id);
                  }}
                  size="sm"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    activeMenuId === conversation.id && "opacity-100 bg-gray-200 dark:bg-gray-700"
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
                        // TODO: Implement Rename
                        console.log('Rename', conversation.id);
                        setActiveMenuId(null);
                      }}
                    >
                      <FiEdit2 size={14} /> Rename
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:!bg-gray-50 dark:hover:!bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement Pin
                        console.log('Pin', conversation.id);
                        setActiveMenuId(null);
                      }}
                    >
                      <BsPinAngle size={14} /> Pin
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:!bg-red-50 dark:hover:!bg-red-900/20 text-red-600 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                        setActiveMenuId(null);
                      }}
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottom Section: Settings, User Info & Logout */}
        <div className="border-t border-gray-200 dark:border-gray-800">
          {/* Settings */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            {isCollapsed ? (
              <IconButton
                icon={<FiSettings />}
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                tooltip="Settings"
                className="w-full hover:bg-gray-100 dark:hover:bg-gray-800"
              />
            ) : (
              <button
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <FiSettings size={18} />
                Settings
              </button>
            )}
          </div>

          {/* User Info & Logout */}
          <div className="p-3">
            {user && !isCollapsed && (
              <div className="mb-2 px-3 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            )}

            {isCollapsed ? (
              <IconButton
                icon={<FiLogOut />}
                onClick={handleLogout}
                tooltip="Sign out"
                className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              />
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
              >
                <FiLogOut size={16} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
