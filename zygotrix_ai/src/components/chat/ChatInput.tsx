import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
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
    <div className="border-t border-gray-200 bg-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent px-4 py-3 text-gray-900 placeholder-gray-400',
              'focus:outline-none disabled:cursor-not-allowed min-h-[48px] max-h-[200px]'
            )}
          />
          <div className="flex-shrink-0 p-2">
            <IconButton
              icon={<FiSend />}
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              variant="filled"
              size="md"
              className={cn(
                'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
                'disabled:bg-gray-300 disabled:text-gray-500'
              )}
              tooltip="Send message (Enter)"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};
