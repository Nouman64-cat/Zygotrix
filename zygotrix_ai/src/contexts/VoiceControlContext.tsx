// src/contexts/VoiceControlContext.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceControlContext } from './VoiceControlShared';

// --- Web Speech API Types ---
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
  item(index: number): { transcript: string; confidence?: number };
  isFinal: boolean;
  [index: number]: { transcript: string; confidence?: number };
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const VoiceControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // True when paused for local mic
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Ref to track if we were listening before pause (to know if we should resume)
  const wasListeningBeforePauseRef = useRef(false);

  // The Registry of all active buttons/actions
  const [commands, setCommands] = useState<Record<string, { action: () => void; description: string }>>({});

  // The Dictation Receiver (e.g. ChatInput)
  const [dictationCallback, setDictationCallbackState] = useState<((text: string, isFinal: boolean) => void) | null>(null);

  // Ref for dictation callback to access in async onresult
  const dictationCallbackRef = useRef(dictationCallback);
  useEffect(() => {
    dictationCallbackRef.current = dictationCallback;
  }, [dictationCallback]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Use ref to track listening state for async callbacks (prevents stale closure)
  const isListeningRef = useRef(isListening);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Use ref to track paused state for async callbacks
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Track if recognition is currently active to prevent double-start
  const isRecognitionActiveRef = useRef(false);

  // We use a ref for commands to access the latest state inside the async API callback
  const commandsRef = useRef(commands);
  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  // --- The Brain: LLM Router ---
  const processVoiceCommand = async (userText: string) => {
    if (!userText.trim()) return;

    setIsProcessing(true); // Show "Processing..." in the UI
    console.log("🧠 Analyzing intent:", userText);

    try {
      // 1. Prepare the list of tools for the AI
      const toolsList = Object.entries(commandsRef.current).map(([id, cmd]) => ({
        id,
        description: cmd.description
      }));

      // 2. Call OpenAI (GPT-4o-mini)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a GUI Voice Controller. 
              The user will speak a command. 
              Match it to one of the available tools below. 
              Return ONLY the 'id' of the tool that best matches. 
              If no tool matches, return 'NO_MATCH'.
              
              Available Tools:
              ${JSON.stringify(toolsList)}`
            },
            { role: "user", content: userText }
          ],
          temperature: 0
        })
      });

      const data = await response.json();
      const matchedId = data.choices[0]?.message?.content?.trim();

      console.log("🤖 AI Decided:", matchedId);

      // 3. Execute the command
      if (matchedId && commandsRef.current[matchedId]) {
        commandsRef.current[matchedId].action();
        setTranscript(`Executed: ${matchedId}`); // visual feedback
      } else {
        console.warn("No matching command found.");
      }

    } catch (error) {
      console.error("Error processing voice command:", error);
    } finally {
      setIsProcessing(false);
      // Optional: Clear transcript after a delay so the UI looks clean
      setTimeout(() => setTranscript(''), 2000);
    }
  };

  // --- Initialize Speech Recognition (only once on mount) ---
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        let isFinal = false;

        for (let i = event.resultIndex || 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript;
            isFinal = true;
          } else {
            currentTranscript += event.results[i][0].transcript;
          }
        }

        setTranscript(currentTranscript);

        // 🧠 TRIGGER THE BRAIN or DICTATION

        // If we have a Dictation Receiver (like ChatInput is focused)
        if (dictationCallbackRef.current) {
          dictationCallbackRef.current(currentTranscript, isFinal);
          // We do NOT call processVoiceCommand here, because we are typing!
        }
        else if (isFinal) {
          // Only process if it's a "Final" result (user stopped speaking) AND no dictation is active
          processVoiceCommand(currentTranscript);
        }
      };

      recognition.onend = () => {
        isRecognitionActiveRef.current = false;
        // Use ref to get the current listening state (avoids stale closure)
        // Do NOT restart if paused (another mic is active)
        if (isListeningRef.current && !isPausedRef.current) {
          // User still wants to listen and we're not paused, restart recognition
          setTimeout(() => {
            if (isListeningRef.current && !isPausedRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
              try {
                recognitionRef.current.start();
                isRecognitionActiveRef.current = true;
              } catch (e) {
                console.warn('Failed to restart recognition:', e);
              }
            }
          }, 100); // Small delay to prevent rapid start/stop cycles
        } else {
          if (!isPausedRef.current) {
            setIsListening(false);
          }
        }
      };

      recognition.onerror = (event: Event) => {
        console.warn('Speech recognition error:', event);
        isRecognitionActiveRef.current = false;
        // On error, try to restart if still listening AND not paused
        if (isListeningRef.current && !isPausedRef.current) {
          setTimeout(() => {
            if (isListeningRef.current && !isPausedRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
              try {
                recognitionRef.current.start();
                isRecognitionActiveRef.current = true;
              } catch (e) {
                console.warn('Failed to restart after error:', e);
              }
            }
          }, 500);
        }
      };

      recognitionRef.current = recognition;
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) { /* ignore */ }
      }
    };
  }, []); // Initialize only once on mount

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      // Stop listening
      isRecognitionActiveRef.current = false;
      try {
        recognitionRef.current.abort(); // Use abort to immediately stop
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
      setIsListening(false);
      setTranscript(''); // Clear transcript for clean restart
    } else {
      // Start listening
      // First, make sure any previous instance is fully stopped
      try {
        recognitionRef.current.abort();
      } catch (e) { /* ignore */ }

      // Small delay to ensure clean state before starting
      setTimeout(() => {
        if (recognitionRef.current && !isRecognitionActiveRef.current) {
          try {
            recognitionRef.current.start();
            isRecognitionActiveRef.current = true;
            setIsListening(true);
          } catch (e) {
            console.error('Failed to start recognition:', e);
            setIsListening(false);
          }
        }
      }, 50);
    }
  }, [isListening]);

  const registerCommand = useCallback((trigger: string, action: () => void, description: string) => {
    const id = trigger.toLowerCase();
    setCommands(prev => ({
      ...prev,
      [id]: { action, description }
    }));
    return () => {
      setCommands(prev => {
        // Only remove if the current action is the one we registered
        // This prevents removing a command that was just overwritten by a new component
        if (prev[id]?.action === action) {
          const newCmds = { ...prev };
          delete newCmds[id];
          return newCmds;
        }
        return prev;
      });
    };
  }, []);

  const setDictationCallback = useCallback((callback: ((text: string, isFinal: boolean) => void) | null) => {
    // Update the ref immediately so onresult can use it right away (no waiting for useEffect)
    dictationCallbackRef.current = callback;
    // Also update state for React reactivity
    setDictationCallbackState(() => callback);
    console.log('🎤 Dictation callback set:', callback ? 'ACTIVE' : 'NULL');
  }, []);

  // Pause the universal mic (temporarily stop without turning off)
  const pauseListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Remember if we were listening so we can resume later
    wasListeningBeforePauseRef.current = isListeningRef.current;

    if (isListeningRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn('Error pausing recognition:', e);
      }
      isRecognitionActiveRef.current = false;
    }
    setIsPaused(true);
    setTranscript('');
  }, []);

  // Resume the universal mic after pause
  const resumeListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setIsPaused(false);

    // Only resume if we were listening before the pause
    if (wasListeningBeforePauseRef.current && !isRecognitionActiveRef.current) {
      setTimeout(() => {
        if (recognitionRef.current && !isRecognitionActiveRef.current && isListeningRef.current) {
          try {
            recognitionRef.current.start();
            isRecognitionActiveRef.current = true;
          } catch (e) {
            console.error('Failed to resume recognition:', e);
          }
        }
      }, 100);
    }
  }, []);

  return (
    <VoiceControlContext.Provider value={{
      isListening,
      isPaused,
      isProcessing,
      transcript,
      toggleListening,
      pauseListening,
      resumeListening,
      registerCommand,
      availableCommands: commands,
      setDictationCallback,
      isDictating: !!dictationCallback
    }}>
      {children}
    </VoiceControlContext.Provider>
  );
};
