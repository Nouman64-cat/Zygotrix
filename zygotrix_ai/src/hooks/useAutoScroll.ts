import { useEffect, useRef } from 'react';

/**
 * Auto-scroll hook with support for continuous scrolling during streaming
 * @param dependencies - Dependencies to trigger scroll
 * @param continuous - Enable continuous scrolling (useful during streaming)
 */
export const useAutoScroll = <T extends HTMLElement>(
  dependencies: unknown[] = [],
  continuous = false
) => {
  const ref = useRef<T>(null);
  const isAutoScrollEnabled = useRef(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const scrollToBottom = () => {
      if (isAutoScrollEnabled.current) {
        element.scrollTop = element.scrollHeight;
      }
    };

    // Detect if user manually scrolled up
    const handleScroll = () => {
      const threshold = 100; // pixels from bottom
      const isNearBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
      isAutoScrollEnabled.current = isNearBottom;
    };

    element.addEventListener('scroll', handleScroll);
    scrollToBottom();

    // For streaming: continuously scroll at intervals
    let intervalId: number | undefined;
    if (continuous) {
      intervalId = window.setInterval(scrollToBottom, 100); // Every 100ms
    }

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (intervalId) clearInterval(intervalId);
    };
  }, [...dependencies, continuous]);

  return ref;
};
