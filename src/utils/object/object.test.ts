import { describe, it, expect } from 'vitest';

import { deepClone, deepEqual, pick, omit, deepMerge } from './object';

describe('Object Utils', () => {
  describe('deepClone', () => {
    it('should deep clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should deep clone arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
      expect(cloned[2]).not.toBe(original[2]);
    });
  });

  describe('deepEqual', () => {
    it('should compare primitive values', () => {
      expect(deepEqual(42, 42)).toBe(true);
      expect(deepEqual('hello', 'hello')).toBe(true);
      expect(deepEqual(42, '42')).toBe(false);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
      expect(deepEqual(null, undefined)).toBe(false);
    });

    it('should compare objects deeply', () => {
      const object1 = { a: 1, b: { c: 2 } };
      const object2 = { a: 1, b: { c: 2 } };
      const object3 = { a: 1, b: { c: 3 } };
      expect(deepEqual(object1, object2)).toBe(true);
      expect(deepEqual(object1, object3)).toBe(false);
    });

    it('should compare arrays deeply', () => {
      const array1 = [1, [2, 3], { a: 4 }];
      const array2 = [1, [2, 3], { a: 4 }];
      const array3 = [1, [2, 3], { a: 5 }];
      expect(deepEqual(array1, array2)).toBe(true);
      expect(deepEqual(array1, array3)).toBe(false);
    });
  });

  describe('pick', () => {
    it('should pick specified properties', () => {
      const object = { a: 1, b: 2, c: 3, d: 4 };
      expect(pick(object, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle non-existent properties', () => {
      const object = { a: 1, b: 2 };
      expect(pick(object, ['a', 'c' as keyof typeof object])).toEqual({ a: 1 });
    });

    it('should handle empty keys array', () => {
      const object = { a: 1, b: 2 };
      expect(pick(object, [])).toEqual({});
    });
  });

  describe('omit', () => {
    it('should omit specified properties', () => {
      const object = { a: 1, b: 2, c: 3, d: 4 };
      expect(omit(object, ['a', 'c'])).toEqual({ b: 2, d: 4 });
    });

    it('should handle non-existent properties', () => {
      const object = { a: 1, b: 2 };
      expect(omit(object, ['a', 'c' as keyof typeof object])).toEqual({ b: 2 });
    });

    it('should handle empty keys array', () => {
      const object = { a: 1, b: 2 };
      expect(omit(object, [])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const object1 = { a: 1, b: { c: 2 } };
      const object2 = { b: { d: 3 }, e: 4 };
      const expected = { a: 1, b: { c: 2, d: 3 }, e: 4 };
      expect(deepMerge<Record<string, unknown>>(object1, object2)).toEqual(
        expected,
      );
    });

    it('should merge arrays', () => {
      const object1 = { a: [1, 2] };
      const object2 = { a: [3, 4] };
      const expected = { a: [1, 2, 3, 4] };
      expect(deepMerge<Record<string, unknown>>(object1, object2)).toEqual(
        expected,
      );
    });

    it('should handle null and undefined objects', () => {
      const object1 = { a: 1 };
      const object2 = null as unknown as Record<string, unknown>;
      expect(deepMerge<Record<string, unknown>>(object1, object2)).toEqual({
        a: 1,
      });
    });

    it('should create deep clones of merged values', () => {
      const nested = { c: 2 };
      const object1 = { a: 1, b: nested };
      const object2 = { d: 3 };
      const result = deepMerge<Record<string, unknown>>(object1, object2);
      expect(result.b).not.toBe(nested);
    });
  });
});
