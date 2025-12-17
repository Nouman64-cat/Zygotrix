/**
 * Conversation Sidebar
 * ====================
 * Left sidebar showing conversation history, folders, and search.
 * Similar to ChatGPT/Gemini sidebar design.
 */

import React, { useState, useEffect, useRef } from "react";
import { useZygotrixAI } from "../../context/ZygotrixAIContext";
import {
  HiPlus,
  HiSearch,
  HiFolder,
  HiFolderOpen,
  HiChat,
  HiDotsVertical,
  HiPencil,
  HiTrash,
  HiArchive,
  HiStar,
  HiOutlineStar,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineChat,
} from "react-icons/hi";
import { LuBiohazard } from "react-icons/lu";

interface ConversationSidebarProps {
  className?: string;
}

export default function ConversationSidebar({ className = "" }: ConversationSidebarProps) {
  const {
    state,
    loadConversations,
    loadFolders,
    selectConversation,
    createNewConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    selectFolder,
    toggleSidebar,
  } = useZygotrixAI();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  // Load data on mount
  useEffect(() => {
    loadConversations();
    loadFolders();
  }, [loadConversations, loadFolders]);

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations(state.currentFolderId, searchQuery || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, state.currentFolderId, loadConversations]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRename = async (id: string) => {
    if (editingTitle.trim()) {
      await updateConversation(id, { title: editingTitle.trim() });
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleToggleStar = async (id: string, currentlyStarred: boolean) => {
    await updateConversation(id, { is_starred: !currentlyStarred });
    setMenuOpenId(null);
  };

  const handleTogglePin = async (id: string, currentlyPinned: boolean) => {
    await updateConversation(id, { is_pinned: !currentlyPinned });
    setMenuOpenId(null);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Group conversations by date
  const groupedConversations = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const groups: { [key: string]: typeof state.conversations } = {
      pinned: [],
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };

    state.conversations.forEach((conv) => {
      const date = new Date(conv.updated_at);

      if (conv.is_pinned) {
        groups.pinned.push(conv);
      } else if (date >= today) {
        groups.today.push(conv);
      } else if (date >= yesterday) {
        groups.yesterday.push(conv);
      } else if (date >= weekAgo) {
        groups.thisWeek.push(conv);
      } else if (date >= monthAgo) {
        groups.thisMonth.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  }, [state.conversations]);

  if (state.sidebarCollapsed) {
    return (
      <div className={`w-16 bg-gray-50 dark:bg-[#0a0a0b] border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 ${className}`}>
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg mb-4"
          title="Expand sidebar"
        >
          <HiChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <button
          onClick={createNewConversation}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl mb-4"
          title="New chat"
        >
          <HiPlus className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto w-full px-2 space-y-1">
          {state.conversations.slice(0, 10).map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`w-full p-2 rounded-lg flex items-center justify-center ${
                state.currentConversation?.id === conv.id
                  ? "bg-indigo-100 dark:bg-indigo-900/30"
                  : "hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
              title={conv.title}
            >
              <HiOutlineChat className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-72 bg-gray-50 dark:bg-[#0a0a0b] border-r border-gray-200 dark:border-gray-800 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LuBiohazard className="w-6 h-6 text-indigo-600" />
            <span className="font-semibold text-gray-900 dark:text-white">Zygotrix AI</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
            title="Collapse sidebar"
          >
            <HiChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={createNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          <HiPlus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
      </div>

      {/* Folders */}
      {state.folders.length > 0 && (
        <div className="px-3 pb-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
            Folders
          </div>
          {state.folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                if (state.currentFolderId === folder.id) {
                  selectFolder(null);
                } else {
                  selectFolder(folder.id);
                }
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                state.currentFolderId === folder.id
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {state.currentFolderId === folder.id ? (
                <HiFolderOpen className="w-4 h-4" style={{ color: folder.color || undefined }} />
              ) : (
                <HiFolder className="w-4 h-4" style={{ color: folder.color || undefined }} />
              )}
              <span className="truncate flex-1 text-left">{folder.name}</span>
              <span className="text-xs text-gray-400">{folder.conversation_count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {state.isLoading && state.conversations.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : state.conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <HiChat className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {groupedConversations.pinned.length > 0 && (
              <ConversationGroup
                title="Pinned"
                conversations={groupedConversations.pinned}
                currentId={state.currentConversation?.id}
                onSelect={selectConversation}
                onRename={(id, title) => {
                  setEditingId(id);
                  setEditingTitle(title);
                }}
                editingId={editingId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onSaveRename={handleRename}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                menuRef={menuRef}
                onToggleStar={handleToggleStar}
                onTogglePin={handleTogglePin}
                onArchive={(id) => { archiveConversation(id); setMenuOpenId(null); }}
                onDelete={(id) => { deleteConversation(id); setMenuOpenId(null); }}
              />
            )}

            {/* Today */}
            {groupedConversations.today.length > 0 && (
              <ConversationGroup
                title="Today"
                conversations={groupedConversations.today}
                currentId={state.currentConversation?.id}
                onSelect={selectConversation}
                onRename={(id, title) => {
                  setEditingId(id);
                  setEditingTitle(title);
                }}
                editingId={editingId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onSaveRename={handleRename}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                menuRef={menuRef}
                onToggleStar={handleToggleStar}
                onTogglePin={handleTogglePin}
                onArchive={(id) => { archiveConversation(id); setMenuOpenId(null); }}
                onDelete={(id) => { deleteConversation(id); setMenuOpenId(null); }}
              />
            )}

            {/* Yesterday */}
            {groupedConversations.yesterday.length > 0 && (
              <ConversationGroup
                title="Yesterday"
                conversations={groupedConversations.yesterday}
                currentId={state.currentConversation?.id}
                onSelect={selectConversation}
                onRename={(id, title) => {
                  setEditingId(id);
                  setEditingTitle(title);
                }}
                editingId={editingId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onSaveRename={handleRename}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                menuRef={menuRef}
                onToggleStar={handleToggleStar}
                onTogglePin={handleTogglePin}
                onArchive={(id) => { archiveConversation(id); setMenuOpenId(null); }}
                onDelete={(id) => { deleteConversation(id); setMenuOpenId(null); }}
              />
            )}

            {/* This Week */}
            {groupedConversations.thisWeek.length > 0 && (
              <ConversationGroup
                title="Previous 7 Days"
                conversations={groupedConversations.thisWeek}
                currentId={state.currentConversation?.id}
                onSelect={selectConversation}
                onRename={(id, title) => {
                  setEditingId(id);
                  setEditingTitle(title);
                }}
                editingId={editingId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onSaveRename={handleRename}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                menuRef={menuRef}
                onToggleStar={handleToggleStar}
                onTogglePin={handleTogglePin}
                onArchive={(id) => { archiveConversation(id); setMenuOpenId(null); }}
                onDelete={(id) => { deleteConversation(id); setMenuOpenId(null); }}
              />
            )}

            {/* This Month */}
            {groupedConversations.thisMonth.length > 0 && (
              <ConversationGroup
                title="Previous 30 Days"
                conversations={groupedConversations.thisMonth}
                currentId={state.currentConversation?.id}
                onSelect={selectConversation}
                onRename={(id, title) => {
                  setEditingId(id);
                  setEditingTitle(title);
                }}
                editingId={editingId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onSaveRename={handleRename}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                menuRef={menuRef}
                onToggleStar={handleToggleStar}
                onTogglePin={handleTogglePin}
                onArchive={(id) => { archiveConversation(id); setMenuOpenId(null); }}
                onDelete={(id) => { deleteConversation(id); setMenuOpenId(null); }}
              />
            )}

            {/* Older */}
            {groupedConversations.older.length > 0 && (
              <ConversationGroup
                title="Older"
                conversations={groupedConversations.older}
                currentId={state.currentConversation?.id}
                onSelect={selectConversation}
                onRename={(id, title) => {
                  setEditingId(id);
                  setEditingTitle(title);
                }}
                editingId={editingId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onSaveRename={handleRename}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                menuRef={menuRef}
                onToggleStar={handleToggleStar}
                onTogglePin={handleTogglePin}
                onArchive={(id) => { archiveConversation(id); setMenuOpenId(null); }}
                onDelete={(id) => { deleteConversation(id); setMenuOpenId(null); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Conversation Group Component
interface ConversationGroupProps {
  title: string;
  conversations: typeof useZygotrixAI extends () => { state: { conversations: infer T } } ? T : never;
  currentId?: string;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  editingId: string | null;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  onSaveRename: (id: string) => void;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  onToggleStar: (id: string, current: boolean) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

function ConversationGroup({
  title,
  conversations,
  currentId,
  onSelect,
  onRename,
  editingId,
  editingTitle,
  setEditingTitle,
  onSaveRename,
  menuOpenId,
  setMenuOpenId,
  menuRef,
  onToggleStar,
  onTogglePin,
  onArchive,
  onDelete,
}: ConversationGroupProps) {
  return (
    <div className="mb-4">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 px-2">
        {title}
      </div>
      <div className="space-y-0.5">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group relative flex items-center rounded-lg ${
              currentId === conv.id
                ? "bg-indigo-100 dark:bg-indigo-900/30"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {editingId === conv.id ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => onSaveRename(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveRename(conv.id);
                  if (e.key === "Escape") {
                    setEditingTitle("");
                    onRename("", "");
                  }
                }}
                className="flex-1 px-2 py-1.5 mx-1 bg-white dark:bg-gray-900 border border-indigo-500 rounded text-sm focus:outline-none dark:text-white"
                autoFocus
              />
            ) : (
              <button
                onClick={() => onSelect(conv.id)}
                className="flex-1 flex items-center gap-2 px-2 py-1.5 min-w-0"
              >
                <HiChat className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                  {conv.title}
                </span>
                {conv.is_starred && (
                  <HiStar className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                )}
              </button>
            )}

            {/* Menu Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
              }}
              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1 transition-opacity"
            >
              <HiDotsVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {menuOpenId === conv.id && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
              >
                <button
                  onClick={() => {
                    onRename(conv.id, conv.title);
                    setMenuOpenId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <HiPencil className="w-4 h-4" />
                  Rename
                </button>
                <button
                  onClick={() => onToggleStar(conv.id, conv.is_starred)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {conv.is_starred ? (
                    <>
                      <HiOutlineStar className="w-4 h-4" />
                      Remove star
                    </>
                  ) : (
                    <>
                      <HiStar className="w-4 h-4 text-amber-500" />
                      Add star
                    </>
                  )}
                </button>
                <button
                  onClick={() => onTogglePin(conv.id, conv.is_pinned)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {conv.is_pinned ? "Unpin" : "Pin to top"}
                </button>
                <button
                  onClick={() => onArchive(conv.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <HiArchive className="w-4 h-4" />
                  Archive
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => onDelete(conv.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <HiTrash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
