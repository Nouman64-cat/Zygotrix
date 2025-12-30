import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { FiSend, FiPlus, FiX, FiFile } from 'react-icons/fi';
import { cn } from '../../utils';
import { IconButton } from '../common';
import type { MessageAttachment } from '../../types';

interface ChatInputProps {
  onSend: (message: string, attachments?: MessageAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Message Zygotrix AI...',
}) => {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: MessageAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size (max 500MB as per documentation)
      if (file.size > 500 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 500 MB.`);
        continue;
      }

      try {
        // Read file and convert to base64
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove the data URL prefix (e.g., "data:text/plain;base64,")
            const base64Content = base64.split(',')[1] || base64;
            resolve(base64Content);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: `attach_${Date.now()}_${i}`,
          type: 'file',
          name: file.name,
          content,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
        });
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
        alert(`Failed to read file "${file.name}"`);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleSend = () => {
    if ((value.trim() || attachments.length > 0) && !disabled) {
      onSend(value.trim(), attachments.length > 0 ? attachments : undefined);
      setValue('');
      setAttachments([]);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="  p-4 md:p-4">
      <div className="max-w-6xl mx-auto px-2 lg:px-4">
        {/* File Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 text-sm"
              >
                <FiFile className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-gray-100 truncate font-medium">
                    {attachment.name}
                  </p>
                  {attachment.size_bytes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.size_bytes)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  disabled={disabled}
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:focus-within:ring-emerald-400/30 transition-all duration-200">
          {/* File Upload Button */}
          <div className="flex-shrink-0 p-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".vcf,.vcf.gz,.gz,.bed,.bim,.fam,.csv,.tsv,.json,application/gzip,application/x-gzip"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
            <IconButton
              icon={<FiPlus />}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              variant="ghost"
              size="md"
              tooltip="Attach genomic files (.vcf, .vcf.gz, .bed, .csv, .json)"
            />
          </div>

          {/* Text Input */}
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

          {/* Send Button */}
          <div className="flex-shrink-0 p-2">
            <IconButton
              icon={<FiSend />}
              onClick={handleSend}
              disabled={disabled || (!value.trim() && attachments.length === 0)}
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
