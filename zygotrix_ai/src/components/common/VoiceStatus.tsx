// src/components/common/VoiceStatus.tsx
import React from 'react';
import { FiMic, FiActivity } from 'react-icons/fi';
import { useVoiceControl } from '../../contexts';
import { cn } from '../../utils';

export const VoiceStatus: React.FC = () => {
  const { isListening, transcript, isDictating, isPaused } = useVoiceControl();

  // Hide if:
  // - Dictating (universal mic is being used for text input)
  // - Paused (local input mic is active)
  // - Not listening and no transcript
  if (isDictating || isPaused || (!isListening && !transcript)) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">

      {/* The Dynamic Island Container */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300",
        "bg-gray-900/90 text-white border border-white/10",
        isListening ? "scale-100 opacity-100" : "scale-95 opacity-0"
      )}>

        {/* Pulsing Icon */}
        <div className="relative flex items-center justify-center w-8 h-8">
          {isListening && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
          )}
          <div className={cn(
            "relative w-8 h-8 rounded-full flex items-center justify-center",
            isListening ? "bg-red-500" : "bg-gray-600"
          )}>
            <FiMic className="text-white text-sm" />
          </div>
        </div>

        {/* Live Transcript / Status Text */}
        <div className="flex flex-col min-w-[120px] max-w-[300px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <FiActivity className={isListening ? "animate-pulse" : ""} />
            {isListening ? 'Listening...' : 'Processing'}
          </span>
          <span className="text-sm font-medium truncate">
            {transcript || "Say a command..."}
          </span>
        </div>
      </div>
    </div>
  );
};