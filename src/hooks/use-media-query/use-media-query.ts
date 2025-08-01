import { useEffect, useState } from 'react';

/**
 * Hook that listens to a media query and returns whether it matches
 * @param query - The media query to match against
 * @returns boolean indicating if the media query matches
 * @example
 * ```tsx
 * const isLargeScreen = useMediaQuery('(min-width: 1024px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', listener);

    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}
