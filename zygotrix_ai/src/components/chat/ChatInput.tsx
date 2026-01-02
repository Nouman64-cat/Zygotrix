import React, { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { FiSend, FiPlus, FiX, FiFile, FiSliders, FiCheck, FiMic } from 'react-icons/fi';
import { cn } from '../../utils';
import { useVoiceControl } from '../../contexts';
import type { MessageAttachment } from '../../types';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Available AI tools
interface AiTool {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AVAILABLE_TOOLS: AiTool[] = [
  {
    id: 'gwas_analysis',
    name: 'GWAS Analysis',
    description: '',
    icon: '🧬',
  },
];

const RECORDING_PROMPTS = [
  'Listening... Say "send message"',
  'Listening... Say "send it"',
  'Listening... Say "submit message"'
];

interface ChatInputProps {
  onSend: (message: string, attachments?: MessageAttachment[], enabledTools?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Ask Zygotrix AI',
}) => {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [enabledTools, setEnabledTools] = useState<string[]>([]);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPlaceholder, setRecordingPlaceholder] = useState(RECORDING_PROMPTS[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if speech recognition is supported
  const isSpeechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Very compact on mobile (24px single line), taller on desktop (44px)
      const minHeight = window.innerWidth < 640 ? 24 : 44;
      const maxHeight = window.innerWidth < 640 ? 120 : 150;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  // Close tools menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    };

    if (showToolsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolsMenu]);

  // Rotate recording placeholder text
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      let index = 0;
      // Initial placeholder is set in startRecording/onstart to avoid
      // "setState synchronously within an effect" warning

      interval = setInterval(() => {
        index = (index + 1) % RECORDING_PROMPTS.length;
        setRecordingPlaceholder(RECORDING_PROMPTS[index]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Initialize speech recognition
  const startRecording = useCallback(() => {
    if (!isSpeechSupported) {
      alert('Voice input is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Store the current value before recording starts so we can append speech to it
    const initialValue = textareaRef.current?.value || '';

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingPlaceholder(RECORDING_PROMPTS[0]);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let speechTranscript = '';

      // Reconstruct the full transcript from the current session
      for (let i = 0; i < event.results.length; i++) {
        speechTranscript += event.results[i][0].transcript;
      }

      // Update input with (Initial Text + Current Speech)
      const newValue = initialValue + (initialValue && speechTranscript ? ' ' : '') + speechTranscript;
      setValue(newValue);

      // Check for send commands
      // Only check if we have a final result to avoid accidental sending on partial matches
      const isFinal = event.results[event.results.length - 1]?.isFinal;
      if (isFinal) {
        const lowerTranscript = speechTranscript.toLowerCase().trim();
        const sendCommands = ['send message', 'please send', 'send this', 'send it', 'submit message'];

        // Check if the transcript ENDS with any of the commands
        const matchedCommand = sendCommands.find(cmd =>
          lowerTranscript.endsWith(cmd) || lowerTranscript.endsWith(cmd + '.') || lowerTranscript.endsWith(cmd + '!')
        );

        if (matchedCommand) {
          // Remove the command from the text
          // We need to be careful to remove it from the end of newValue
          // Construct the final message content
          let messageContent = newValue;

          // Regex to match the command at the end, case insensitive, with optional punctuation
          const commandRegex = new RegExp(`\\s*${matchedCommand}[.!?]*$`, 'i');
          messageContent = messageContent.replace(commandRegex, '').trim();

          if (messageContent) {
            // Stop recording
            recognition.stop();
            setIsRecording(false);

            // Send the message
            setValue(''); // Clear input
            onSend(messageContent, attachments, enabledTools);
          }
        }
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSpeechSupported, onSend, attachments, enabledTools]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

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

  const handleToggleTool = (toolId: string) => {
    setEnabledTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleSend = () => {
    if ((value.trim() || attachments.length > 0) && !disabled) {
      onSend(
        value.trim(),
        attachments.length > 0 ? attachments : undefined,
        enabledTools.length > 0 ? enabledTools : undefined
      );
      setValue('');
      setAttachments([]);
      // Don't reset enabled tools - keep them persistent for the session
      if (textareaRef.current) {
        textareaRef.current.style.height = window.innerWidth < 640 ? '24px' : '44px';
      }
    }
  };

  const { registerCommand } = useVoiceControl();
  
  // Keep ref to handleSend to avoid re-registering commands on every specific state change
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  useEffect(() => {
    const unregisterFocus = registerCommand(
      'focus input',
      () => {
         // Focus the textarea
         if (textareaRef.current) {
            textareaRef.current.focus();
         }
      },
      'Focuses the chat input box'
    );

    const unregisterClear = registerCommand(
      'clear input',
      () => {
        setValue('');
        setAttachments([]);
      },
      'Clears the text and attachments'
    );

    const unregisterSend = registerCommand(
      'send message',
      () => handleSendRef.current(),
      'Sends the current message'
    );

    return () => {
      unregisterFocus();
      unregisterClear();
      unregisterSend();
    };
  }, [registerCommand]);

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

  const canSend = (value.trim() || attachments.length > 0) && !disabled;

  return (
    <div
      className="p-0 pb-6 sm:pb-0 sm:px-4 sm:py-2 md:px-6 md:py-2 lg:py-1"
    >
      <div className="max-w-5xl mx-auto">
        {/* File Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-2 sm:mb-3 mx-2 sm:mx-0 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-sm backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <FiFile className="text-emerald-600 dark:text-emerald-400 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-gray-100 truncate font-medium text-sm">
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
                  className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700/50 hover:bg-red-100 dark:hover:bg-red-500/30 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 cursor-pointer"
                  disabled={disabled}
                >
                  <FiX className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Gemini-style Input Card - attached to bottom on mobile */}
        <div
          className={cn(
            "relative bg-white dark:bg-gray-800 backdrop-blur-xl transition-all duration-300",
            // Mobile: no border, no shadow, rounded top corners only, attached to bottom
            "rounded-t-3xl sm:rounded-2xl md:rounded-3xl",
            "border-t border-x sm:border border-gray-200 dark:border-gray-700/50",
            "sm:hover:border-gray-300 dark:sm:hover:border-gray-600/70",
            "focus-within:border-emerald-500 dark:focus-within:border-emerald-500/50 sm:focus-within:ring-1 focus-within:ring-emerald-500/20",
            "shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.4)]"
          )}
        >
          {/* Text Input Area - Top */}
          <div className="px-3 pt-2.5 pb-0 sm:px-4 sm:pt-3 sm:pb-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? recordingPlaceholder : placeholder}
              disabled={disabled || isRecording}
              rows={1}
              className={cn(
                'w-full resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
                'focus:outline-none disabled:cursor-not-allowed',
                'text-sm sm:text-base leading-snug sm:leading-relaxed',
                'min-h-[24px] sm:min-h-[44px] max-h-[120px] sm:max-h-[150px]'
              )}
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-2 pb-2 sm:px-3 sm:pb-3 sm:pt-1">
            {/* Left Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".vcf,.vcf.gz,.gz,.bed,.bim,.fam,.csv,.tsv,.json,application/gzip,application/x-gzip"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200",
                  "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
                title="Attach genomic files"
              >
                <FiPlus className="text-base sm:text-lg" />
              </button>

              {/* Tools Button with Dropdown */}
              <div className="relative" ref={toolsMenuRef}>
                <button
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                  disabled={disabled}
                  className={cn(
                    "h-8 sm:h-9 px-2 sm:px-3 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all duration-200",
                    "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                  title="Analysis Tools"
                >
                  <FiSliders className="text-sm sm:text-base" />
                  <span className="hidden sm:inline text-sm font-medium">Tools</span>
                </button>

                {/* Tools Dropdown Menu */}
                {showToolsMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="p-1">
                      {AVAILABLE_TOOLS.map((tool) => {
                        const isEnabled = enabledTools.includes(tool.id);
                        return (
                          <button
                            key={tool.id}
                            onClick={() => handleToggleTool(tool.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                              isEnabled
                                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                            )}
                          >
                            <span className="text-lg">{tool.icon}</span>
                            <p className="flex-1 text-left text-xs font-medium">{tool.name}</p>
                            <div
                              className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                isEnabled
                                  ? "bg-emerald-500 border-emerald-500"
                                  : "border-gray-300 dark:border-gray-600"
                              )}
                            >
                              {isEnabled && <FiCheck className="text-white text-xs" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Enabled Tools - Inline Pills (Gemini style) */}
              {enabledTools.map((toolId) => {
                const tool = AVAILABLE_TOOLS.find((t) => t.id === toolId);
                if (!tool) return null;
                return (
                  <div
                    key={toolId}
                    className="h-8 sm:h-9 flex items-center gap-1 sm:gap-1.5 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-lg sm:rounded-xl px-2 sm:px-2.5 text-xs sm:text-sm"
                  >
                    <span className="text-sm">{tool.icon}</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium hidden sm:inline">{tool.name}</span>
                    <button
                      onClick={() => handleToggleTool(toolId)}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Disable tool"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5">

              {/* Voice Input Button */}
              {isSpeechSupported && (
                <button
                  onClick={toggleRecording}
                  disabled={disabled}
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200",
                    isRecording
                      ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                      : "bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50 cursor-pointer",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  <FiMic className="text-base sm:text-lg" />
                </button>
              )}

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200",
                  canSend
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 cursor-pointer"
                    : "bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                )}
                title="Send message (Enter)"
              >
                <FiSend className={cn("text-base sm:text-lg", canSend && "-rotate-45")} />
              </button>
            </div>
          </div>
          {/* Disclaimer - inside the card on mobile */}
          <p className="px-3 pb-2 sm:hidden text-[10px] text-gray-400 dark:text-gray-500 text-center">
            Zygotrix AI can make mistakes. Verify important info.
          </p>
        </div>

        {/* Disclaimer - outside card on desktop */}
        <p className="hidden sm:block mt-3 text-[11px] text-gray-400 dark:text-gray-500 text-center">
          Zygotrix AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
};
