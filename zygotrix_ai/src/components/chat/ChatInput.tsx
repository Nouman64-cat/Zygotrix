import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import {
  FiSend,
  FiPlus,
  FiX,
  FiFile,
  FiSliders,
  FiCheck,
  FiMic,
} from "react-icons/fi";
import { cn } from "../../utils";
import { useVoiceControl, useVoiceCommand, useAuth } from "../../contexts";
import type { MessageAttachment } from "../../types";

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
  confidence?: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

// Use global declarations from VoiceControlContext
// The Window interface is already augmented there

// Available AI tools
interface AiTool {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AVAILABLE_TOOLS: AiTool[] = [
  {
    id: "gwas_analysis",
    name: "GWAS Analysis",
    description: "",
    icon: "🧬",
  },
  {
    id: "deep_research",
    name: "Deep Research",
    description: "Multi-step research with AI clarification and source synthesis",
    icon: "🔬",
  },
];

const RECORDING_PROMPTS = [
  'Listening... Say "send message"',
  'Listening... Say "send it"',
  'Listening... Say "submit message"',
];

interface ChatInputProps {
  onSend: (
    message: string,
    attachments?: MessageAttachment[],
    enabledTools?: string[]
  ) => void;
  disabled?: boolean;
  placeholder?: string;
  // Optional controlled mode for enabled tools (for persistence)
  enabledTools?: string[];
  onEnabledToolsChange?: (tools: string[]) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = "Ask Zygotrix AI",
  enabledTools: controlledEnabledTools,
  onEnabledToolsChange,
}) => {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  // Use controlled mode if props are provided, otherwise internal state
  const [internalEnabledTools, setInternalEnabledTools] = useState<string[]>([]);
  const enabledTools = controlledEnabledTools ?? internalEnabledTools;

  // Wrapper function for setEnabledTools that works in both controlled and uncontrolled modes
  const setEnabledTools = useCallback((value: string[] | ((prev: string[]) => string[])) => {
    if (onEnabledToolsChange) {
      // Controlled mode - compute new value if function is passed
      if (typeof value === 'function') {
        const newValue = value(controlledEnabledTools ?? []);
        onEnabledToolsChange(newValue);
      } else {
        onEnabledToolsChange(value);
      }
    } else {
      // Uncontrolled mode - use internal setter directly
      setInternalEnabledTools(value);
    }
  }, [onEnabledToolsChange, controlledEnabledTools]);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPlaceholder, setRecordingPlaceholder] = useState(
    RECORDING_PROMPTS[0]
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { user } = useAuth();
  const isPro = user?.subscription_status === 'pro';

  // Deep Research usage tracking for PRO users
  const DEEP_RESEARCH_DAILY_LIMIT = 3;
  const deepResearchUsed = user?.deep_research_usage?.count ?? 0;
  const isDeepResearchLimitExhausted = isPro && deepResearchUsed >= DEEP_RESEARCH_DAILY_LIMIT;

  // Calculate reset time (24 hours from last_reset)
  const getDeepResearchResetTime = (): string | null => {
    const lastReset = user?.deep_research_usage?.last_reset;
    if (!lastReset) return null;

    const resetDate = new Date(lastReset);
    resetDate.setHours(resetDate.getHours() + 24);

    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();

    if (diffMs <= 0) return "soon";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const {
    setDictationCallback,
    isListening: isUniversalMicActive,
    toggleListening,
    isDictating,
  } = useVoiceControl();

  // Debounce to prevent double sends
  const lastSendTimeRef = useRef(0);

  // Track finalized text for real-time dictation display
  // baseTextRef holds text that has been finalized (user paused)
  // Interim text is displayed in addition to this
  const baseTextRef = useRef("");

  // Track universal mic state via ref to prevent useEffect re-runs
  const isUniversalMicActiveRef = useRef(isUniversalMicActive);
  useEffect(() => {
    isUniversalMicActiveRef.current = isUniversalMicActive;
  }, [isUniversalMicActive]);

  // Check if speech recognition is supported
  const isSpeechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      // Very compact on mobile (24px single line), taller on desktop (44px)
      const minHeight = window.innerWidth < 640 ? 24 : 44;
      const maxHeight = window.innerWidth < 640 ? 120 : 150;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight)
      );
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  // Close tools menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target as Node)
      ) {
        setShowToolsMenu(false);
      }
    };

    if (showToolsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

  // Failsafe: Ensure global dictation is active if we are in recording mode
  // This fixes the issue where the VoiceStatus pill reappears because dictation state was lost
  useEffect(() => {
    if (isRecording && !isDictating) {
      console.log("🎤 Failsafe: Restoring dictation callback");
      setDictationCallback((text, isFinal) =>
        handleDictationRef.current(text, isFinal)
      );
    }
  }, [isRecording, isDictating, setDictationCallback]);

  // Handle Dictation (used by both local mic and universal mic when focused)
  const handleDictation = useCallback(
    (speechTranscript: string, isFinal: boolean) => {
      // Real-time transcription:
      // - Interim results: show baseText + current interim text
      // - Final results: add to baseText and check for commands

      // Safe access to base text
      const safeBaseText = baseTextRef.current || "";

      if (!isFinal) {
        // Show interim results in real-time
        const displayText =
          safeBaseText + (safeBaseText ? " " : "") + (speechTranscript || "");
        // Schedule update to avoid "Cannot update while rendering" error
        setTimeout(() => setValue(displayText), 0);
        return;
      }

      // Final result - add to base text
      const finalText = (speechTranscript || "").trim();
      if (!finalText) return;

      const newBaseText = safeBaseText + (safeBaseText ? " " : "") + finalText;
      baseTextRef.current = newBaseText;
      // Schedule update to avoid "Cannot update while rendering" error
      setTimeout(() => setValue(newBaseText), 0);

      // Check for send commands
      const lowerTranscript = finalText.toLowerCase().trim();
      const sendCommands = [
        "send message",
        "please send",
        "send this",
        "send it",
        "submit message",
      ];

      // Check if the transcript ENDS with any of the commands
      const matchedCommand = sendCommands.find(
        (cmd) =>
          lowerTranscript.endsWith(cmd) ||
          lowerTranscript.endsWith(cmd + ".") ||
          lowerTranscript.endsWith(cmd + "!")
      );

      if (matchedCommand) {
        // Send command detected!
        // Check debounce to prevent double sends
        const now = Date.now();
        if (now - lastSendTimeRef.current < 2000) {
          console.log("🚫 Voice send blocked by debounce");
          return;
        }

        // IMMEDIATELY mark the send time BEFORE setTimeout to prevent race conditions
        lastSendTimeRef.current = now;

        // We need to trigger send
        setTimeout(() => {
          // Remove command from text
          const commandRegex = new RegExp(`\\s*${matchedCommand}[.!?]*$`, "i");
          const messageContent = newBaseText.replace(commandRegex, "").trim();
          if (messageContent) {
            onSend(messageContent, attachments, enabledTools);
            setValue("");
            setAttachments([]);
            baseTextRef.current = ""; // Reset base text after sending

            // End dictation mode - control returns to universal mic command mode
            // User can say "focus input" again to start dictating next message
            setDictationCallback(null);
            setIsRecording(false);
            console.log(
              "🎤 Dictation ended after voice send - returning to command mode"
            );
          }
        }, 0);
      }
    },
    [onSend, attachments, enabledTools, setDictationCallback]
  );

  // Register dictation only when focused AND universal mic is active (for universal mic dictation)
  const handleDictationRef = useRef(handleDictation);
  useEffect(() => {
    handleDictationRef.current = handleDictation;
  }, [handleDictation]);

  // NOTE: We no longer automatically manage dictation callback via useEffect.
  // Instead, it's explicitly controlled by:
  // - toggleRecording() function
  // - "focus input" command
  // - handleSend() function
  // This avoids conflicts where the useEffect would immediately reset the callback.

  // --- Independent ChatInput Speech Recognition ---
  // Track if local recognition is active
  const isLocalRecognitionActiveRef = useRef(false);
  // Track if we WANT to be recording (prevents premature onend from stopping us)
  const shouldBeRecordingRef = useRef(false);
  // Track current value to access in callbacks
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  // Store the value at the time recording started
  const initialValueOnStartRef = useRef("");

  // Initialize local speech recognition for ChatInput (independent from universal mic)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // Track the finalized text so we can append interim text to it (use ref to persist across restarts)
      const baseTextRef = { current: "" };
      // Track if this is the first start (not a restart)
      let isFirstStart = true;

      recognition.onstart = () => {
        console.log("🎤 Local recognition onstart fired");
        isLocalRecognitionActiveRef.current = true;
        setIsRecording(true);
        setRecordingPlaceholder(RECORDING_PROMPTS[0]);

        // On first start, capture any existing text in the input
        if (isFirstStart) {
          initialValueOnStartRef.current = valueRef.current;
          baseTextRef.current = valueRef.current;
          isFirstStart = false;
        }
        // On restart (not first start), baseTextRef.current is preserved to accumulate text
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex || 0; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // If we got final text, add it to the base and update the input
        if (finalTranscript) {
          baseTextRef.current =
            baseTextRef.current +
            (baseTextRef.current ? " " : "") +
            finalTranscript.trim();
          setValue(baseTextRef.current);

          // Check for send commands (inline, don't call handleDictation which duplicates text)
          const lowerTranscript = finalTranscript.toLowerCase().trim();
          const sendCommands = [
            "send message",
            "please send",
            "send this",
            "send it",
            "submit message",
          ];
          const matchedCommand = sendCommands.find(
            (cmd) =>
              lowerTranscript.endsWith(cmd) ||
              lowerTranscript.endsWith(cmd + ".") ||
              lowerTranscript.endsWith(cmd + "!")
          );

          if (matchedCommand) {
            // Remove command from text and send
            setTimeout(() => {
              const commandRegex = new RegExp(
                `\\s*${matchedCommand}[.!?]*$`,
                "i"
              );
              const messageContent = baseTextRef.current
                .replace(commandRegex, "")
                .trim();
              if (messageContent) {
                // Use the handleSendRef to send the message
                setValue(messageContent);
                handleSendRef.current();
              }
            }, 0);
          }
        }

        // Show interim text in real-time (appended to base text)
        if (interimTranscript) {
          const displayText =
            baseTextRef.current +
            (baseTextRef.current ? " " : "") +
            interimTranscript;
          setValue(displayText);
        }
      };

      recognition.onend = () => {
        console.log(
          "🎤 Local recognition onend fired, shouldBeRecording:",
          shouldBeRecordingRef.current
        );
        isLocalRecognitionActiveRef.current = false;

        // If we're supposed to be recording, restart (handles browser quirks)
        if (shouldBeRecordingRef.current && recognitionRef.current) {
          console.log("🎤 Restarting local recognition...");
          setTimeout(() => {
            if (
              shouldBeRecordingRef.current &&
              recognitionRef.current &&
              !isLocalRecognitionActiveRef.current
            ) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.warn("Failed to restart local recognition:", e);
                shouldBeRecordingRef.current = false;
                setIsRecording(false);
              }
            }
          }, 100);
        } else {
          setIsRecording(false);
          // Reset base text when stopping
          baseTextRef.current = "";
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("ChatInput speech recognition error:", event);
        isLocalRecognitionActiveRef.current = false;
        // Only stop if we're not supposed to be recording
        if (!shouldBeRecordingRef.current) {
          setIsRecording(false);
          baseTextRef.current = "";
        }
      };

      recognitionRef.current = recognition;
    }

    // Cleanup on unmount
    return () => {
      shouldBeRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          /* ignore */
        }
      }
    };
  }, []);

  // Toggle recording - uses universal mic's dictation mode to avoid conflicts
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      // Stop recording - clear dictation callback
      setDictationCallback(null);
      setIsRecording(false);
      baseTextRef.current = ""; // Reset base text when stopping
      console.log("🎤 Recording stopped via button");
    } else {
      // Start recording - initialize baseTextRef with current input value
      baseTextRef.current = valueRef.current;
      // Set dictation callback to write to input
      setDictationCallback((text, isFinal) =>
        handleDictationRef.current(text, isFinal)
      );
      setIsRecording(true);
      setRecordingPlaceholder(RECORDING_PROMPTS[0]);
      console.log("🎤 Recording started via button (using universal mic)");
    }
  }, [isRecording, setDictationCallback]);

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
            const base64Content = base64.split(",")[1] || base64;
            resolve(base64Content);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: `attach_${Date.now()}_${i}`,
          type: "file",
          name: file.name,
          content,
          mime_type: file.type || "application/octet-stream",
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
      fileInputRef.current.value = "";
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
    // Debounce: prevent double sends within 2 seconds
    const now = Date.now();
    if (now - lastSendTimeRef.current < 2000) {
      console.log("🚫 Send blocked by debounce (sent recently)");
      return;
    }

    if ((value.trim() || attachments.length > 0) && !disabled) {
      lastSendTimeRef.current = now; // Mark send time
      onSend(
        value.trim(),
        attachments.length > 0 ? attachments : undefined,
        enabledTools.length > 0 ? enabledTools : undefined
      );
      setValue("");
      setAttachments([]);
      // Don't reset enabled tools - keep them persistent for the session
      if (textareaRef.current) {
        textareaRef.current.style.height =
          window.innerWidth < 640 ? "24px" : "44px";
      }

      // After sending, clear dictation mode and reset recording indicator
      if (isRecording) {
        setDictationCallback(null); // Clear dictation callback
        setIsRecording(false);
        console.log("🎤 Dictation ended after send");
      }
    }
  };

  // Keep ref to handleSend to avoid re-registering commands on every specific state change
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  // Voice Commands using package's useVoiceCommand hook
  useVoiceCommand({
    id: "focus-input",
    description:
      "Focuses the chat input box and enables dictation via universal mic",
    action: () => {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          baseTextRef.current = valueRef.current || "";
          console.log("🎤 Focus input: Dictation enabled");
          setDictationCallback((text, isFinal) =>
            handleDictationRef.current(text, isFinal)
          );
          setIsRecording(true);
          setRecordingPlaceholder(RECORDING_PROMPTS[0]);
          console.log("🎤 Focus input: Using universal mic for dictation");
        }
      }, 0);
    },
  });

  useVoiceCommand({
    id: "clear-input",
    description: "Clears the text and attachments",
    action: () => {
      setValue("");
      setAttachments([]);
    },
  });

  useVoiceCommand({
    id: "send-message",
    description: "Sends the current message",
    action: () => handleSendRef.current(),
  });

  useVoiceCommand({
    id: "stop-listening",
    description:
      "Stops voice control when user says bye, bye bye, goodbye, quit, stop listening, see you",
    action: () => {
      console.log("🎤 Stop listening command received");
      if (isUniversalMicActiveRef.current) {
        toggleListening();
      }
    },
  });

  useVoiceCommand({
    id: "open-tools",
    description: "Opens the tools menu",
    action: () => {
      setShowToolsMenu(true);
      console.log("🔧 Opening tools");
    },
  });

  useVoiceCommand({
    id: "close-tools",
    description: "Closes the tools menu",
    action: () => {
      setShowToolsMenu(false);
      console.log("🔧 Closing tools");
    },
  });

  useVoiceCommand({
    id: "enable-tool",
    description: "Enables a specific tool (e.g. enable gwas)",
    action: () => {
      // Enable GWAS by default when this command is triggered
      const tool = AVAILABLE_TOOLS[0];
      if (tool) {
        setEnabledTools((prev) =>
          prev.includes(tool.id) ? prev : [...prev, tool.id]
        );
        console.log(`🔧 Enabled tool: ${tool.name}`);
      }
    },
  });

  useVoiceCommand({
    id: "disable-tool",
    description: "Disables a specific tool (e.g. disable gwas)",
    action: () => {
      const tool = AVAILABLE_TOOLS[0];
      if (tool) {
        setEnabledTools((prev) => prev.filter((id) => id !== tool.id));
        console.log(`🔧 Disabled tool: ${tool.name}`);
      }
    },
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
    <div className="p-0 pb-6 sm:pb-0 sm:px-4 sm:py-2 md:px-6 md:py-2 lg:py-1">
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
              onFocus={() => { }}
              onBlur={() => { }}
              placeholder={isRecording ? recordingPlaceholder : placeholder}
              disabled={disabled || isRecording}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500",
                "focus:outline-none disabled:cursor-not-allowed",
                "text-sm sm:text-base leading-snug sm:leading-relaxed",
                "min-h-[24px] sm:min-h-[44px] max-h-[120px] sm:max-h-[150px]"
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
                  <span className="hidden sm:inline text-sm font-medium">
                    Tools
                  </span>
                </button>

                {/* Tools Dropdown Menu */}
                {showToolsMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="p-1">
                      {AVAILABLE_TOOLS.map((tool) => {
                        const isEnabled = enabledTools.includes(tool.id);
                        const isDeepResearch = tool.id === 'deep_research';
                        const isLockedForFree = isDeepResearch && !isPro;
                        const isLockedForLimit = isDeepResearch && isDeepResearchLimitExhausted;
                        const isLocked = isLockedForFree || isLockedForLimit;

                        return (
                          <button
                            key={tool.id}
                            onClick={() => !isLocked && handleToggleTool(tool.id)}
                            disabled={isLocked}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                              isLocked
                                ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-700/30"
                                : "cursor-pointer",
                              isEnabled && !isLocked
                                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : !isLocked && "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                            )}
                            title={
                              isLockedForFree
                                ? "Upgrade to PRO to use Deep Research"
                                : isLockedForLimit
                                  ? `Daily limit reached. Resets in ${getDeepResearchResetTime() || "24h"}`
                                  : undefined
                            }
                          >
                            <span className="text-lg">{tool.icon}</span>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-medium">
                                {tool.name}
                              </p>
                              {isLockedForFree && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                  PRO Feature ★
                                </span>
                              )}
                              {/* Show usage count for Deep Research if user is PRO */}
                              {isDeepResearch && isPro && !isLockedForLimit && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {deepResearchUsed}/{DEEP_RESEARCH_DAILY_LIMIT} used today
                                </span>
                              )}
                              {/* Show limit reached message with reset time */}
                              {isLockedForLimit && (
                                <span className="text-[10px] text-red-500 dark:text-red-400 font-medium whitespace-nowrap">
                                  3/3 used • Resets: {getDeepResearchResetTime() || "~24h"}
                                </span>
                              )}
                            </div>
                            {isLockedForFree ? (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded font-bold">
                                PRO
                              </span>
                            ) : isLockedForLimit ? (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded font-bold">
                                3/3
                              </span>
                            ) : (
                              <div
                                className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                  isEnabled
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "border-gray-300 dark:border-gray-600"
                                )}
                              >
                                {isEnabled && (
                                  <FiCheck className="text-white text-xs" />
                                )}
                              </div>
                            )}
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

                // Check if this deep research is exhausted
                const isDeepResearchExhausted = toolId === 'deep_research' && isDeepResearchLimitExhausted;

                return (
                  <div
                    key={toolId}
                    className={cn(
                      "h-8 sm:h-9 flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-2 sm:px-2.5 text-xs sm:text-sm",
                      isDeepResearchExhausted
                        ? "bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30"
                        : "bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30"
                    )}
                  >
                    <span className="text-sm">{tool.icon}</span>
                    <span className={cn(
                      "font-medium hidden sm:inline",
                      isDeepResearchExhausted
                        ? "text-red-700 dark:text-red-300"
                        : "text-emerald-700 dark:text-emerald-300"
                    )}>
                      {tool.name}
                    </span>
                    {/* Show usage count in pill for Deep Research */}
                    {toolId === 'deep_research' && isPro && !isDeepResearchExhausted && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ({deepResearchUsed}/{DEEP_RESEARCH_DAILY_LIMIT})
                      </span>
                    )}
                    {/* Show limit exhausted message */}
                    {isDeepResearchExhausted && (
                      <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">
                        (Resets in {getDeepResearchResetTime() || "~24h"})
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleTool(toolId)}
                      className={cn(
                        "transition-colors cursor-pointer",
                        isDeepResearchExhausted
                          ? "text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                          : "text-emerald-600 dark:text-emerald-400 hover:text-red-500 dark:hover:text-red-400"
                      )}
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
                <FiSend
                  className={cn(
                    "text-base sm:text-lg",
                    canSend && "-rotate-45"
                  )}
                />
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
