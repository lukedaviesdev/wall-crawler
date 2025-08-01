import { describe, it, expect } from 'vitest';

import { chunk, unique, groupBy, flatten, intersection } from './array';

describe('Array Utils', () => {
  describe('chunk', () => {
    it('should chunk array into smaller arrays of specified size', () => {
      const array = [1, 2, 3, 4, 5];
      expect(chunk(array, 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk(array, 3)).toEqual([
        [1, 2, 3],
        [4, 5],
      ]);
    });

    it('should handle empty arrays', () => {
      expect(chunk([], 2)).toEqual([]);
    });
  });

  describe('unique', () => {
    it('should remove duplicate values', () => {
      const array = [1, 2, 2, 3, 3, 4];
      expect(unique(array)).toEqual([1, 2, 3, 4]);
    });

    it('should handle arrays with no duplicates', () => {
      const array = [1, 2, 3, 4];
      expect(unique(array)).toEqual([1, 2, 3, 4]);
    });

    it('should handle empty arrays', () => {
      expect(unique([])).toEqual([]);
    });
  });

  describe('groupBy', () => {
    it('should group array elements by key', () => {
      const array = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' },
      ];
      const result = groupBy(array, (item) => item.category);
      expect(result).toEqual({
        A: [
          { id: 1, category: 'A' },
          { id: 3, category: 'A' },
        ],
        B: [{ id: 2, category: 'B' }],
      });
    });

    it('should handle empty arrays', () => {
      expect(
        groupBy<{ toString(): string }>([], (item) => item.toString()),
      ).toEqual({});
    });
  });

  describe('flatten', () => {
    it('should flatten nested arrays', () => {
      const array = [[1, 2], [3, 4], [5]];
      expect(flatten(array)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty arrays', () => {
      expect(flatten([])).toEqual([]);
      expect(flatten([[], []])).toEqual([]);
    });
  });

  describe('intersection', () => {
    it('should return common elements between two arrays', () => {
      const array1 = [1, 2, 3, 4];
      const array2 = [3, 4, 5, 6];
      expect(intersection(array1, array2)).toEqual([3, 4]);
    });

    it('should handle arrays with no common elements', () => {
      const array1 = [1, 2];
      const array2 = [3, 4];
      expect(intersection(array1, array2)).toEqual([]);
    });

    it('should handle empty arrays', () => {
      expect(intersection([], [1, 2])).toEqual([]);
      expect(intersection([1, 2], [])).toEqual([]);
    });
  });
});
