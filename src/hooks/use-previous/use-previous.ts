import { useEffect, useRef } from 'react';

/**
 * Hook that returns the previous value of a variable
 * Useful for comparing previous vs current values in effects
 */
export function usePrevious<T>(value: T): T | undefined {
  const reference = useRef<T>();

  useEffect(() => {
    reference.current = value;
  }, [value]);

  return reference.current;
}
