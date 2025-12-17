import React from 'react';
import { FaUser, FaRobot } from 'react-icons/fa';
import { cn, formatMessageTime } from '../../utils';
import type { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 px-4 py-6 md:px-6', isUser ? 'bg-transparent' : 'bg-gray-50')}>
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-white',
            isUser ? 'bg-blue-600' : 'bg-gray-700'
          )}
        >
          {isUser ? <FaUser className="text-sm" /> : <FaRobot className="text-sm" />}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">
            {isUser ? 'You' : 'Zygotrix AI'}
          </span>
          <span className="text-xs text-gray-500">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
};
