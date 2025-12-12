import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatBot } from './ChatBot';
import { LuBiohazard } from "react-icons/lu";
import { useAuth } from '../../context/AuthContext';
import { getChatbotStatus } from '../../services/chatbotService';

export const FloatingChatButton: React.FC = () => {
  const botName = import.meta.env.VITE_ZYGOTRIX_BOT_NAME || 'Zigi';
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true); // Default to true, check on mount
  const location = useLocation();
  const { user } = useAuth();

  // Check if chatbot is enabled on mount
  useEffect(() => {
    const checkStatus = async () => {
      const status = await getChatbotStatus();
      setIsEnabled(status.enabled);
    };
    checkStatus();
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setShowPulse(false);
  };

  return (
    <>
      <ChatBot
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentPath={location.pathname}
        userName={user?.full_name || user?.email?.split('@')[0] || 'there'}
        userId={user?.id}
        isEnabled={isEnabled}
      />


      {/* Hide button when chat is open on mobile (since chat is fullscreen) */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 z-50 flex items-center justify-center group cursor-pointer ${
          isOpen ? 'sm:rotate-180 sm:scale-90 hidden sm:flex' : 'hover:scale-110'
        }`}
        aria-label="Toggle chat"
      >
        {/* Pulse animation */}
        {showPulse && !isOpen && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
        )}

        {/* Icon */}
        <div className="relative">
          {isOpen ? (
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          ) : (
            <LuBiohazard className="w-6 h-6 sm:w-7 sm:h-7 transition-transform" />
          )}
        </div>

        {/* Tooltip - hidden on mobile/touch devices */}
        <div
          className={`absolute right-20 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-opacity hidden sm:block ${
            isOpen ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {`Chat with ${botName}!`}
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900"></div>
        </div>
      </button>
    </>
  );
};
