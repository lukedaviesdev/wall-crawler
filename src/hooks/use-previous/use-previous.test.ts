import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { usePrevious } from './use-previous';

describe('usePrevious', () => {
  it('should return undefined on first render', () => {
    const { result } = renderHook(() => usePrevious('initial'));
    expect(result.current).toBeUndefined();
  });

  it('should return previous value after update', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    rerender({ value: 'final' });
    expect(result.current).toBe('updated');
  });

  it('should handle different value types', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: unknown }) => usePrevious(value),
      {
        initialProps: { value: 1 },
      },
    );

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });
});
