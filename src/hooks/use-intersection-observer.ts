import { useCallback, useRef } from 'react';

/**
 * Hook for detecting when an element enters the viewport
 * Used for infinite scroll implementation
 */
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {},
) => {
  const observer = useRef<IntersectionObserver | null>(null);

  const elementReference = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;

      // Disconnect existing observer
      if (observer.current) {
        observer.current.disconnect();
      }

      // Create new observer
      observer.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            callback();
          }
        },
        {
          rootMargin: '100px', // Trigger 100px before element comes into view
          threshold: 0.1,
          ...options,
        },
      );

      // Start observing the element
      observer.current.observe(node);
    },
    [callback, options.rootMargin, options.threshold],
  );

  return elementReference;
};
