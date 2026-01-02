import { createContext, useContext } from 'react';

// Types for the Context
export interface VoiceControlContextType {
    isListening: boolean;
    isProcessing: boolean; // New state for "Thinking"
    transcript: string; // The live words being spoken
    toggleListening: () => void;
    registerCommand: (trigger: string, action: () => void, description: string) => () => void;
    availableCommands: Record<string, { action: () => void; description: string }>;
}

export const VoiceControlContext = createContext<VoiceControlContextType | undefined>(undefined);

export const useVoiceControl = () => {
    const context = useContext(VoiceControlContext);
    if (!context) throw new Error('useVoiceControl must be used within a VoiceControlProvider');
    return context;
};
