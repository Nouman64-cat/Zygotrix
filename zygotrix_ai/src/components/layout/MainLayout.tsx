import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
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

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          onNewChat={onNewConversation}
        />

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
