import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useEventListener } from './use-event-listener';

describe('useEventListener', () => {
  it('should add event listener to window by default', async () => {
    const handler = vi.fn();
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useEventListener('click', handler));

    expect(addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );

    await act(async () => {
      unmount();
    });

    expect(removeEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );
  });

  it('should add event listener to custom element', async () => {
    const handler = vi.fn();
    const element = document.createElement('div');
    const addEventListener = vi.spyOn(element, 'addEventListener');
    const removeEventListener = vi.spyOn(element, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useEventListener('click', handler, element),
    );

    expect(addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );

    await act(async () => {
      unmount();
    });

    expect(removeEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );
  });

  it('should handle event with options', async () => {
    const handler = vi.fn();
    const options = { capture: true };
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useEventListener('click', handler, undefined, options),
    );

    expect(addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      options,
    );

    await act(async () => {
      unmount();
    });

    expect(removeEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      options,
    );
  });

  it('should call handler when event is triggered', async () => {
    const handler = vi.fn();
    const event = new Event('click');

    renderHook(() => useEventListener('click', handler));

    await act(async () => {
      window.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should use window as default target when element is undefined', async () => {
    const handler = vi.fn();
    const addEventListener = vi.spyOn(window, 'addEventListener');

    await act(async () => {
      renderHook(() => useEventListener('click', handler, undefined));
    });

    expect(addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      undefined,
    );
  });
});
