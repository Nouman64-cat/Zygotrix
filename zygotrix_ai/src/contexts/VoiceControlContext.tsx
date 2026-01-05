// src/contexts/VoiceControlContext.tsx
// Hybrid approach: Package for AI routing + Custom for dictation mode
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceControlProvider as PackageProvider, createOpenAIAdapter, useVoiceContext } from 'react-voice-action-router';
import { DictationContext } from './VoiceControlShared';

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

// Create the OpenAI adapter for the package
const aiAdapter = createOpenAIAdapter({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  model: "gpt-4o-mini"
});

// Inner component that uses the package's context
const DictationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { processTranscript, isProcessing } = useVoiceContext();

  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Dictation mode
  const [dictationCallback, setDictationCallbackState] = useState<((text: string, isFinal: boolean) => void) | null>(null);
  const dictationCallbackRef = useRef(dictationCallback);

  useEffect(() => {
    dictationCallbackRef.current = dictationCallback;
  }, [dictationCallback]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(isListening);
  const isPausedRef = useRef(isPaused);
  const wasListeningBeforePauseRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Initialize Speech Recognition
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

        // HYBRID LOGIC: Dictation mode bypasses package's AI router
        if (dictationCallbackRef.current) {
          dictationCallbackRef.current(currentTranscript, isFinal);
        } else if (isFinal) {
          // Use package's processTranscript for AI command routing
          setTimeout(() => processTranscript(currentTranscript), 0);
        }
      };

      recognition.onend = () => {
        isRecognitionActiveRef.current = false;
        if (isListeningRef.current && !isPausedRef.current) {
          setTimeout(() => {
            if (isListeningRef.current && !isPausedRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
              try {
                recognitionRef.current.start();
                isRecognitionActiveRef.current = true;
              } catch (e) {
                console.warn('Failed to restart recognition:', e);
              }
            }
          }, 100);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'aborted' || event.error === 'no-speech') return;
        console.warn('Speech recognition error:', event.error);
        isRecognitionActiveRef.current = false;
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      }
    };
  }, [processTranscript]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      isRecognitionActiveRef.current = false;
      try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      setIsListening(false);
      setTranscript('');
    } else {
      try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
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

  const setDictationCallback = useCallback((callback: ((text: string, isFinal: boolean) => void) | null) => {
    dictationCallbackRef.current = callback;
    setDictationCallbackState(() => callback);
    if (callback === null) {
      setTranscript('');
    }
    console.log('🎤 setDictationCallback called. Active:', !!callback);
  }, []);

  const pauseListening = useCallback(() => {
    if (!recognitionRef.current) return;
    wasListeningBeforePauseRef.current = isListeningRef.current;
    if (isListeningRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      isRecognitionActiveRef.current = false;
    }
    setIsPaused(true);
    isPausedRef.current = true;
    setTranscript('');
  }, []);

  const resumeListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setIsPaused(false);
    isPausedRef.current = false;
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

  return (
    <DictationContext.Provider value={{
      setDictationCallback,
      isDictating: !!dictationCallback,
      isListening,
      isPaused,
      transcript,
      toggleListening,
      pauseListening,
      resumeListening,
    }}>
      {children}
    </DictationContext.Provider>
  );
};

// Main provider that wraps package + custom dictation
export const VoiceControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PackageProvider adapter={aiAdapter}>
      <DictationProvider>
        {children}
      </DictationProvider>
    </PackageProvider>
  );
};
