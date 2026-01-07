// src/contexts/VoiceControlShared.ts
// Re-export from package + custom dictation types
import { createContext, useContext } from "react";

// Re-export package utilities
export { useVoiceCommand, useVoiceContext } from "react-voice-action-router";

// Custom types for dictation mode (not in package)
export interface DictationContextType {
  setDictationCallback: (
    callback: ((text: string, isFinal: boolean) => void) | null
  ) => void;
  isDictating: boolean;
  isListening: boolean;
  isPaused: boolean;
  transcript: string;
  toggleListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
}

export const DictationContext = createContext<DictationContextType | undefined>(
  undefined
);

export const useDictation = () => {
  const context = useContext(DictationContext);
  if (!context)
    throw new Error("useDictation must be used within a DictationProvider");
  return context;
};

// Combined hook for backwards compatibility
export const useVoiceControl = () => {
  const dictation = useDictation();
  return dictation;
};
