import React, { useState, useEffect, useContext } from 'react';
import { RiRobot2Fill } from "react-icons/ri";
import { HiChevronLeft } from "react-icons/hi";
import { ChatBot } from './ChatBot';
import { SimulationToolContext } from '../../context/SimulationToolContext';

interface AgentSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentPath: string;
  userName: string;
  userId?: string;
  isEnabled?: boolean;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  currentPath,
  userName,
  userId,
  isEnabled = true,
}) => {
  const botName = import.meta.env.VITE_ZYGOTRIX_BOT_NAME || 'Zigi';
  const [hasBeenOpened, setHasBeenOpened] = useState(!isCollapsed);

  // Always call useContext (hooks must be called unconditionally)
  // This safely returns undefined if not within the provider
  const simulationContext = useContext(SimulationToolContext);

  // Only pass context to ChatBot when on the simulation studio page
  const simulationToolContext = currentPath.includes('/simulation-studio') ? simulationContext : null;

  useEffect(() => {
    if (!isCollapsed) {
      setHasBeenOpened(true);
    }
  }, [isCollapsed]);

  return (
    <div
      className={`
        ${isCollapsed ? 'w-12' : 'w-[320px] md:w-[350px] lg:w-[380px]'}
        bg-white dark:bg-slate-900
        border-l border-gray-200 dark:border-slate-700
        flex-shrink-0
        transition-all duration-300 ease-in-out
        h-full
      `}
    >
      {isCollapsed ? (
        // Collapsed State
        <div className="h-full flex flex-col items-center gap-4 p-3">
          {/* Expand Button with Pulsing Animation */}
          <div className="relative group">
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 animate-ping opacity-30"></div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse opacity-20"></div>

            <button
              onClick={onToggleCollapse}
              className="relative w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-110 transition-all duration-300 cursor-pointer"
              aria-label="Expand AI Assistant"
            >
              <RiRobot2Fill className="w-5 h-5" />
            </button>

            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
              💬 Chat with {botName}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
            </div>
          </div>

          {/* Expand Arrow Button */}
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 cursor-pointer group"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <HiChevronLeft className="w-5 h-5 group-hover:animate-pulse" />
          </button>
        </div>
      ) : (
        // Expanded State
        hasBeenOpened && (
          <ChatBot
            variant="sidebar"
            isOpen={true}
            onClose={onToggleCollapse} // Use collapse function for sidebar mode
            currentPath={currentPath}
            userName={userName}
            userId={userId}
            isEnabled={isEnabled}
            simulationToolContext={simulationToolContext}
          />
        )
      )}
    </div>
  );
};
