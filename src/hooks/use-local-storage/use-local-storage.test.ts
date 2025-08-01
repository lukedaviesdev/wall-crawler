import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocalStorage } from './use-local-storage';

describe('useLocalStorage', () => {
  const key = 'test-key';
  const initialValue = { test: 'value' };
  let getItemSpy: ReturnType<typeof vi.spyOn<Storage, 'getItem'>>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    vi.spyOn(Storage.prototype, 'setItem');
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should use initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    expect(result.current[0]).toEqual(initialValue);
  });

  it('should use value from localStorage if it exists', () => {
    const storedValue = { test: 'stored' };
    localStorage.setItem(key, JSON.stringify(storedValue));

    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    expect(result.current[0]).toEqual(storedValue);
  });

  it('should update localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    const newValue = { test: 'new' };

    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toEqual(newValue);
    expect(localStorage.getItem(key)).toBe(JSON.stringify(newValue));
  });

  it('should handle function updates correctly', () => {
    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    act(() => {
      result.current[1]((previous) => ({ ...previous, updated: true }));
    });

    expect(result.current[0]).toEqual({ ...initialValue, updated: true });
  });

  it('should handle localStorage errors gracefully', () => {
    getItemSpy.mockImplementationOnce(() => {
      throw new Error('getItem error');
    });

    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    expect(result.current[0]).toEqual(initialValue);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should handle JSON parse errors gracefully', () => {
    localStorage.setItem(key, 'invalid json');

    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    expect(result.current[0]).toEqual(initialValue);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should sync state across hooks with same key', async () => {
    const { result: result1 } = renderHook(() =>
      useLocalStorage(key, initialValue),
    );
    const { result: result2 } = renderHook(() =>
      useLocalStorage(key, initialValue),
    );

    await act(async () => {
      result1.current[1]({ test: 'updated' });
    });

    // Simulate storage event
    await act(async () => {
      const storageEvent = new StorageEvent('storage', {
        key,
        newValue: JSON.stringify({ test: 'updated' }),
      });
      window.dispatchEvent(storageEvent);
    });

    expect(result2.current[0]).toEqual({ test: 'updated' });
  });
});
