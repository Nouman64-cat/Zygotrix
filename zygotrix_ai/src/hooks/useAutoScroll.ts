import { useEffect, useRef } from 'react';

export const useAutoScroll = <T extends HTMLElement>(dependencies: unknown[] = []) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, dependencies);

  return ref;
};
