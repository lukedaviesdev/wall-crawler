import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMediaQuery } from './use-media-query';

describe('useMediaQuery', () => {
  let matchMedia: typeof window.matchMedia;
  const createMatchMedia = (matches: boolean) => {
    return (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  };

  beforeEach(() => {
    matchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = matchMedia;
  });

  it('should return true when media query matches', () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(result.current).toBe(true);
  });

  it('should return false when media query does not match', () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(result.current).toBe(false);
  });

  it('should handle changes to media query matches', () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        listeners.add(listener);
      },
      removeEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        listeners.delete(listener);
      },
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      listeners.forEach((listener) => {
        listener({
          matches: true,
          media: '(min-width: 1024px)',
        } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener,
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });
});
