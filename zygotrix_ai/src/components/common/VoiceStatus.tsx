// src/components/common/VoiceStatus.tsx
import React from 'react';
import { FiMic } from 'react-icons/fi';
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
    <>
      {/* Premium Floating Voice Indicator */}
      <div
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50",
          "transition-all duration-500 ease-out",
          isListening ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
        )}
      >
        {/* Outer glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 to-teal-500/30 rounded-full blur-xl animate-pulse" />

        {/* Main container with gradient border */}
        <div className="relative">
          {/* Gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-400 to-teal-500 rounded-full p-[1.5px] animate-gradient-x" />

          {/* Inner content */}
          <div
            className={cn(
              "relative flex items-center gap-3 px-5 py-3 rounded-full",
              "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
              "shadow-xl shadow-emerald-500/10"
            )}
          >
            {/* Animated Mic Container */}
            <div className="relative">
              {/* Outer ring animation */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 animate-ping opacity-40" />
              {/* Middle ring */}
              <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500/50 to-cyan-500/50 animate-pulse" />
              {/* Mic icon container */}
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <FiMic className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Status Text */}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Listening
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 max-w-[350px]">
                {transcript || "Say a command..."}
              </span>
            </div>

            {/* Sound Wave Visualizer */}
            <div className="flex items-end gap-[3px] h-6 ml-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full"
                  style={{
                    animation: 'soundWave 0.5s ease-in-out infinite alternate',
                    animationDelay: `${i * 0.1}s`,
                    height: '100%',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes soundWave {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </>
  );
};