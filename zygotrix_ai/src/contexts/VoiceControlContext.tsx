// src/contexts/VoiceControlContext.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceControlContext, type VoiceSettings } from './VoiceControlShared';

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

  // Voice Settings (persisted to localStorage)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved) : {
      rate: 1.2,      // Speed: 0.5 to 2.0 (default 1.2 for natural flow)
      pitch: 1.0,     // Pitch: 0.5 to 2.0
      voiceIndex: 0,  // Index of selected voice
    };
  });

  // Save voice settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  // Ref to track if we were listening before pause (to know if we should resume)
  const wasListeningBeforePauseRef = useRef(false);
  const isPausedForSpeakingRef = useRef(false);

  // The Registry of all active buttons/actions
  const [commands, setCommands] = useState<Record<string, { action: (text: string) => void; description: string }>>({});


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

  // Ref for speak function to use in async callbacks defined before speak
  const speakRef = useRef<(text: string) => void>(() => { });

  // --- AI Response Generator ---
  const generateAIResponse = async (prompt: string, context: string = ''): Promise<string> => {
    try {
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
              content: `You are a friendly AI voice assistant for Zygotrix, a genetics and DNA analysis application. 
              Keep responses brief (1-2 sentences max), warm, and professional. 
              Speak naturally as if having a conversation.
              ${context}`
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 100
        })
      });

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error("Error generating AI response:", error);
      return '';
    }
  };

  // --- Welcome Message when mic activates ---
  const speakWelcome = async () => {
    const welcomePrompt = "The user just activated voice control. Generate a brief, friendly welcome greeting introducing yourself as their voice assistant for Zygotrix. Ask how you can help.";
    const message = await generateAIResponse(welcomePrompt);
    if (message) {
      speakRef.current(message);
    }
  };

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
      const rawId = data.choices[0]?.message?.content?.trim();
      const matchedId = rawId?.replace(/^['"\`]+|['"\`]+$/g, ''); // Strip quotes

      console.log("🤖 AI Decided:", matchedId);

      // 3. Execute the command or provide fallback
      if (matchedId && matchedId !== 'NO_MATCH' && commandsRef.current[matchedId]) {
        commandsRef.current[matchedId].action(userText);
        setTranscript(`Executed: ${matchedId}`); // visual feedback
      } else {
        // No matching command - generate a helpful fallback response
        console.warn("No matching command found, generating fallback response.");
        const fallbackPrompt = `The user said: "${userText}". You don't have a command that matches this request. Politely explain that you don't have this ability yet and offer to help with something else you can do (like navigation, voice control, settings, etc).`;
        const fallbackMessage = await generateAIResponse(fallbackPrompt,
          `Available commands include: ${toolsList.map(t => t.description).join(', ')}`
        );
        if (fallbackMessage) {
          speakRef.current(fallbackMessage);
        } else {
          speakRef.current("I'm not sure how to help with that. Would you like me to do something else?");
        }
      }

    } catch (error) {
      console.error("Error processing voice command:", error);
      speakRef.current("I encountered an error processing your request. Please try again.");
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
          // Defer processing to avoid blocking the event loop or causing synchronous update errors
          setTimeout(() => processVoiceCommand(currentTranscript), 0);
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

      recognition.onerror = (event: any) => {
        // Ignore 'aborted' error which happens during pause/resume or speech synthesis
        if (event.error === 'aborted' || event.error === 'no-speech') return;

        console.warn('Speech recognition error:', event.error, event);
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
            // Greet the user with an AI-generated welcome message
            speakWelcome();
          } catch (e) {
            console.error('Failed to start recognition:', e);
            setIsListening(false);
          }
        }
      }, 50);
    }
  }, [isListening]);

  const registerCommand = useCallback((trigger: string, action: (text: string) => void, description: string) => {
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

    // When dictation ends (callback becomes null), clear the transcript
    // This prevents the VoiceStatus from showing stale text like "send it"
    if (callback === null) {
      setTranscript('');
    }

    console.log('🎤 VoiceControlContext: setDictationCallback called. Active:', !!callback);
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
    isPausedRef.current = true; // Update ref immediately to prevent race conditions
    setTranscript('');
  }, []);

  // Resume the universal mic after pause
  const resumeListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setIsPaused(false);
    isPausedRef.current = false;

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
      }, 300);
    }
  }, []);

  // --- Text to Speech (Moved here to access pauseListening/resumeListening) ---
  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      // Pause mic to prevent self-hearing and OS errors
      if (isListeningRef.current && !isPausedRef.current) {
        pauseListening();
        isPausedForSpeakingRef.current = true;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply voice settings
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;

      // Set selected voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && voiceSettings.voiceIndex < voices.length) {
        utterance.voice = voices[voiceSettings.voiceIndex];
      }

      const resume = () => {
        if (isPausedForSpeakingRef.current) {
          resumeListening();
          isPausedForSpeakingRef.current = false;
        }
      };

      utterance.onend = resume;
      utterance.onerror = resume;

      window.speechSynthesis.speak(utterance);
    }
  }, [pauseListening, resumeListening, voiceSettings]);

  // Keep speakRef updated so async functions can use it
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

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
      setDictationCallback: setDictationCallback, // Use the WRAPPER, not the raw state setter
      isDictating: !!dictationCallback,
      speak,
      voiceSettings,
      setVoiceSettings,
    }}>
      {children}
    </VoiceControlContext.Provider>
  );
};
