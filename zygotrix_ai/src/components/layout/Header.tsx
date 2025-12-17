import React from 'react';
import { FiMenu, FiPlus, FiMoreVertical } from 'react-icons/fi';
import { Logo, IconButton } from '../common';
import { cn } from '../../utils';

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
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          {showMenuButton && (
            <IconButton
              icon={<FiMenu />}
              onClick={onMenuClick}
              tooltip="Toggle sidebar"
              className="md:hidden"
            />
          )}
          <Logo size="md" showText={true} />
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            icon={<FiPlus />}
            onClick={onNewChat}
            tooltip="New chat"
            variant="ghost"
          />
          <IconButton
            icon={<FiMoreVertical />}
            tooltip="More options"
            variant="ghost"
          />
        </div>
      </div>
    </header>
  );
};
