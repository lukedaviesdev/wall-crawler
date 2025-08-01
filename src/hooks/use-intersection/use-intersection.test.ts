import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useIntersection } from './use-intersection';

describe('useIntersection', () => {
  let mockObserver: {
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
  };
  let observerCallback: (entries: IntersectionObserverEntry[]) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    // @ts-expect-error - we know this is a mock
    global.IntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback;
      return mockObserver;
    });
  });

  it('should observe element when ref is provided', async () => {
    const elementReference = { current: document.createElement('div') };
    renderHook(() => useIntersection(elementReference));

    expect(mockObserver.observe).toHaveBeenCalledWith(elementReference.current);

    // Simulate intersection
    act(() => {
      observerCallback([
        {
          isIntersecting: true,
          boundingClientRect: new DOMRect(0, 0, 100, 100),
          intersectionRatio: 1,
          intersectionRect: new DOMRect(0, 0, 100, 100),
          rootBounds: null,
          target: elementReference.current,
          time: Date.now(),
        },
      ]);
    });
  });

  it('should not observe when ref is null', () => {
    const elementReference = { current: null };
    renderHook(() => useIntersection(elementReference));

    expect(mockObserver.observe).not.toHaveBeenCalled();
  });

  it('should disconnect observer on unmount', () => {
    const elementReference = { current: document.createElement('div') };
    const { unmount } = renderHook(() => useIntersection(elementReference));

    unmount();
    expect(mockObserver.disconnect).toHaveBeenCalled();
  });

  it('should pass options to IntersectionObserver', () => {
    const elementReference = { current: document.createElement('div') };
    const options = { threshold: 0.5, root: null };

    renderHook(() => useIntersection(elementReference, options));

    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      options,
    );
  });
});
