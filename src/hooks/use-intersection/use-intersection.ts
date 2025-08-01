import { useEffect, useState } from 'react';

import type { RefObject } from 'react';

/**
 * Hook that tracks the intersection of an element with its scroll container or viewport
 * Useful for infinite scrolling, lazy loading images, or any visibility-based functionality
 */
export function useIntersection<T extends Element>(
  elementReference: RefObject<T>,
  options: IntersectionObserverInit = {},
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementReference.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementReference, options]);

  return entry;
}
