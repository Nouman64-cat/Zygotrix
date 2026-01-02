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
  isFinal: boolean;
  [index: number]: { transcript: string };
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
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const VoiceControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // The Registry of all active buttons/actions
  const [commands, setCommands] = useState<Record<string, { action: () => void; description: string }>>({});

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
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

  // --- Initialize Speech Recognition ---
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

        // 🧠 TRIGGER THE BRAIN
        // Only process if it's a "Final" result (user stopped speaking)
        if (isFinal) {
          processVoiceCommand(currentTranscript);
        }
      };

      recognition.onend = () => {
        if (isListening) {
          try { recognition.start(); } catch (e) { /**/ }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [isListening]); // Re-bind if listening state changes drastically

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
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

  return (
    <VoiceControlContext.Provider value={{ 
      isListening, 
      isProcessing,
      transcript, 
      toggleListening,
      registerCommand,
      availableCommands: commands
    }}>
      {children}
    </VoiceControlContext.Provider>
  );
};
