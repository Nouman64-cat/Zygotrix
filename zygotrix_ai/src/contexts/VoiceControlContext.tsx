// src/contexts/VoiceControlContext.tsx
// Hybrid approach: Package for AI routing + Custom dictation mode using package's setPaused
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  VoiceControlProvider as PackageProvider,
  createOpenAIAdapter,
  useVoiceContext,
} from "react-voice-action-router";
import { DictationContext } from "./VoiceControlShared";

// --- Web Speech API Types ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
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
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Create the OpenAI adapter for the package
const aiAdapter = createOpenAIAdapter({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  model: "gpt-4o-mini",
});

// Inner component that uses the package's context
const DictationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the package's setPaused to control global router pausing (new in v1.2.0)
  const { processTranscript, setPaused, isPaused } = useVoiceContext();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Dictation mode
  const [dictationCallback, setDictationCallbackState] = useState<
    ((text: string, isFinal: boolean) => void) | null
  >(null);
  const dictationCallbackRef = useRef(dictationCallback);

  useEffect(() => {
    dictationCallbackRef.current = dictationCallback;
  }, [dictationCallback]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(isListening);
  const wasListeningBeforePauseRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Keep isPausedRef in sync with isPaused state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Initialize Speech Recognition
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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = "";
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

        // HYBRID LOGIC: Dictation mode bypasses package's AI router
        if (dictationCallbackRef.current) {
          dictationCallbackRef.current(currentTranscript, isFinal);
        } else if (isFinal) {
          // Use package's processTranscript for AI command routing
          // The package's setPaused will handle whether to process or ignore
          setTimeout(() => processTranscript(currentTranscript), 0);
        }
      };

      recognition.onend = () => {
        isRecognitionActiveRef.current = false;
        const isDictating = !!dictationCallbackRef.current;
        console.log(
          "🎤 Recognition onend, isListening:",
          isListeningRef.current,
          "isPaused:",
          isPausedRef.current,
          "isDictating:",
          isDictating
        );
        // Restart recognition if:
        // 1. isListening is true (universal mic is on), AND
        // 2. Either: not paused (command mode) OR in dictation mode (text goes to callback)
        const shouldRestart =
          isListeningRef.current && (!isPausedRef.current || isDictating);
        if (shouldRestart) {
          setTimeout(() => {
            if (
              isListeningRef.current &&
              (!isPausedRef.current || !!dictationCallbackRef.current) &&
              recognitionRef.current &&
              !isRecognitionActiveRef.current
            ) {
              try {
                console.log("🎤 Restarting recognition after onend");
                recognitionRef.current.start();
                isRecognitionActiveRef.current = true;
              } catch (err) {
                console.warn("Failed to restart recognition:", err);
              }
            }
          }, 100);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "aborted" || event.error === "no-speech") return;
        console.warn("Speech recognition error:", event.error);
        isRecognitionActiveRef.current = false;
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
    };
  }, [processTranscript, isPaused]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      isRecognitionActiveRef.current = false;
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      setIsListening(false);
      setTranscript("");
    } else {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        if (recognitionRef.current && !isRecognitionActiveRef.current) {
          try {
            recognitionRef.current.start();
            isRecognitionActiveRef.current = true;
            setIsListening(true);
          } catch (err) {
            console.error("Failed to start recognition:", err);
            setIsListening(false);
          }
        }
      }, 50);
    }
  }, [isListening]);

  const setDictationCallback = useCallback(
    (callback: ((text: string, isFinal: boolean) => void) | null) => {
      dictationCallbackRef.current = callback;
      setDictationCallbackState(() => callback);

      // Use package's setPaused to pause/resume global router during dictation
      // When callback is set (dictation mode active), pause the router
      // When callback is null (dictation mode ended), resume the router
      setPaused(callback !== null);

      if (callback === null) {
        setTranscript("");
      }
      console.log(
        "🎤 setDictationCallback called. Active:",
        !!callback,
        "| Router paused:",
        callback !== null
      );
    },
    [setPaused]
  );

  // Pause listening - now uses package's setPaused for the router
  const pauseListening = useCallback(() => {
    if (!recognitionRef.current) return;
    wasListeningBeforePauseRef.current = isListeningRef.current;
    if (isListeningRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      isRecognitionActiveRef.current = false;
    }
    // Use package's setPaused to pause the global router
    setPaused(true);
    setTranscript("");
    console.log("🎤 Listening paused (using package setPaused)");
  }, [setPaused]);

  // Resume listening - now uses package's setPaused for the router
  const resumeListening = useCallback(() => {
    if (!recognitionRef.current) return;
    // Use package's setPaused to resume the global router
    setPaused(false);
    if (wasListeningBeforePauseRef.current && !isRecognitionActiveRef.current) {
      setTimeout(() => {
        if (
          recognitionRef.current &&
          !isRecognitionActiveRef.current &&
          isListeningRef.current
        ) {
          try {
            recognitionRef.current.start();
            isRecognitionActiveRef.current = true;
          } catch (err) {
            console.error("Failed to resume recognition:", err);
          }
        }
      }, 300);
    }
    console.log("🎤 Listening resumed (using package setPaused)");
  }, [setPaused]);

  return (
    <DictationContext.Provider
      value={{
        setDictationCallback,
        isDictating: !!dictationCallback,
        isListening,
        isPaused, // Now comes from the package's context
        transcript,
        toggleListening,
        pauseListening,
        resumeListening,
      }}
    >
      {children}
    </DictationContext.Provider>
  );
};

// Main provider that wraps package + custom dictation
export const VoiceControlProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <PackageProvider adapter={aiAdapter}>
      <DictationProvider>{children}</DictationProvider>
    </PackageProvider>
  );
};
