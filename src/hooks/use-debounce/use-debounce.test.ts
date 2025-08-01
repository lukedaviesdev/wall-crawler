import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebounce } from './use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      },
    );

    // Initial value
    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Value should not have changed yet
    expect(result.current).toBe('initial');

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should be updated
    expect(result.current).toBe('updated');
  });

  it('should handle multiple rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      },
    );

    // Multiple rapid updates
    rerender({ value: 'update1', delay: 500 });
    rerender({ value: 'update2', delay: 500 });
    rerender({ value: 'update3', delay: 500 });

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Advance remaining time
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Should have the last update only
    expect(result.current).toBe('update3');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      },
    );

    // Update with longer delay
    rerender({ value: 'updated', delay: 1000 });

    // Advance time by original delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should not have changed yet
    expect(result.current).toBe('initial');

    // Advance remaining time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should be updated
    expect(result.current).toBe('updated');
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('test', 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
