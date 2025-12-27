import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { FiSend } from 'react-icons/fi';
import { cn } from '../../utils';
import { IconButton } from '../common';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Message Zygotrix AI...',
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="  p-4 md:p-4">
      <div className="max-w-6xl mx-auto px-2 lg:px-4">
        <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:focus-within:ring-emerald-400/30 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
              'focus:outline-none disabled:cursor-not-allowed min-h-[48px] max-h-[200px]'
            )}
          />
          <div className="flex-shrink-0 p-2">
            <IconButton
              icon={<FiSend />}
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              variant="primary"
              size="md"
              tooltip="Send message (Enter)"
            />
          </div>
        </div>
        <p className="mt-2 md:text-xs text-[10px] text-gray-500 dark:text-gray-400 text-center">
          Zygotrix AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
};
