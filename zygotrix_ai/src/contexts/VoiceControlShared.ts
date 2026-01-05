import { createContext, useContext } from "react";

// Types for the Context
export interface VoiceControlContextType {
  isListening: boolean;
  isPaused: boolean; // True when universal mic is paused (e.g., local input mic is active)
  isProcessing: boolean; // New state for "Thinking"
  transcript: string; // The live words being spoken
  toggleListening: () => void;
  pauseListening: () => void; // Temporarily pause the universal mic
  resumeListening: () => void; // Resume the universal mic after pause
  registerCommand: (
    trigger: string,
    action: (text: string) => void,
    description: string
  ) => () => void;
  availableCommands: Record<
    string,
    { action: (text: string) => void; description: string }
  >;
  setDictationCallback: (
    callback: ((text: string, isFinal: boolean) => void) | null
  ) => void;
  isDictating: boolean;
}

export const VoiceControlContext = createContext<
  VoiceControlContextType | undefined
>(undefined);

export const useVoiceControl = () => {
  const context = useContext(VoiceControlContext);
  if (!context)
    throw new Error(
      "useVoiceControl must be used within a VoiceControlProvider"
    );
  return context;
};
