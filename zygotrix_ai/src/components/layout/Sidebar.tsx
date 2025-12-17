import React from 'react';
import { FiMessageSquare, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { cn, formatTimestamp, truncateText } from '../../utils';
import { IconButton, Button } from '../common';
import type { LocalConversation } from '../../types';

interface SidebarProps {
  conversations: LocalConversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-30',
          'flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Conversations</h2>
          <IconButton
            icon={<FiX />}
            onClick={onClose}
            className="md:hidden"
            tooltip="Close sidebar"
          />
        </div>

        <div className="p-3">
          <Button
            variant="primary"
            className="w-full"
            leftIcon={<FiPlus />}
            onClick={() => {
              onNewConversation();
              onClose();
            }}
          >
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FiMessageSquare className="mx-auto text-3xl text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer',
                  'hover:bg-gray-100 transition-colors duration-200',
                  currentConversationId === conversation.id && 'bg-gray-100'
                )}
                onClick={() => {
                  onSelectConversation(conversation.id);
                  onClose();
                }}
              >
                <FiMessageSquare className="flex-shrink-0 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {truncateText(conversation.title, 30)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(conversation.updatedAt)}
                  </p>
                </div>
                <IconButton
                  icon={<FiTrash2 />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:bg-red-50"
                  tooltip="Delete conversation"
                />
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};
