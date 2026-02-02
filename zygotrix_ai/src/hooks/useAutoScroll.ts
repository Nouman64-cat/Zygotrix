import { useEffect, useRef, useCallback } from "react";

/**
 * Auto-scroll hook with support for continuous scrolling during streaming
 * @param dependencies - Dependencies to trigger scroll
 * @param continuous - Enable continuous scrolling (useful during streaming)
 */
export const useAutoScroll = <T extends HTMLElement>(
  dependencies: unknown[] = [],
  continuous = false,
) => {
  const ref = useRef<T>(null);
  const isAutoScrollEnabled = useRef(true);

  // External forcing function - always scrolls
  const scrollToBottom = useCallback(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
      isAutoScrollEnabled.current = true;
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Internal auto-scroll - respects user's scroll position
    const autoScrollToBottom = () => {
      if (isAutoScrollEnabled.current) {
        element.scrollTop = element.scrollHeight;
      }
    };

    // Detect if user manually scrolled up
    const handleScroll = () => {
      const threshold = 100; // pixels from bottom
      const isNearBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight <
        threshold;
      isAutoScrollEnabled.current = isNearBottom;
    };

    element.addEventListener("scroll", handleScroll);
    autoScrollToBottom();

    // For streaming: continuously scroll at intervals
    let intervalId: number | undefined;
    if (continuous) {
      intervalId = window.setInterval(autoScrollToBottom, 100); // Every 100ms
    }

    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (intervalId) clearInterval(intervalId);
    };
  }, [...dependencies, continuous]);

  return { scrollRef: ref, scrollToBottom };
};
