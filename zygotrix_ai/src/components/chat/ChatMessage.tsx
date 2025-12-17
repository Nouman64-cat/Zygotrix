import React from 'react';
import { FaUser } from 'react-icons/fa';
import { cn, formatMessageTime } from '../../utils';
import type { Message } from '../../types';
import Logo from '../../../public/zygotrix-ai.png';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 px-4 py-6 md:px-6', isUser ? 'bg-transparent' : 'bg-gray-50 dark:bg-gray-800/50')}>
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white">
            <FaUser className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-12 h-12 flex items-center justify-center">
            <img src={Logo} alt="Zygotrix AI" className="w-12 h-12 object-cover rounded-full" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {isUser ? 'You' : 'Zygotrix AI'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
};
