import React, { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { Sidebar } from './Sidebar';
import { IconButton, ThemeSwitcher, SettingsModal } from '../common';
import { LOGO_URL } from '../../config';
import type { LocalConversation } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  conversations: LocalConversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Desktop: Theme Switcher - Top Left */}
        <div className="hidden md:block absolute top-4 left-4 z-10">
          <ThemeSwitcher variant="icon" />
        </div>

        {/* Mobile: Header with menu button, logo, and theme switcher */}
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
          <ThemeSwitcher variant="icon" />
        </div>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
