import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  isStorageAvailable,
  getStorageQuota,
  getAllStorage,
  hasStorageItem,
  clearStorageByPrefix,
  getStorageSize,
} from './storage';

describe('Storage Utils', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    // Create a mock storage object
    mockStorage = {
      length: 0,
      clear: vi.fn(),
      getItem: vi.fn(),
      key: vi.fn().mockReturnValue(null),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    };
  });

  describe('isStorageAvailable', () => {
    it('should return true when storage is available', () => {
      expect(isStorageAvailable(mockStorage)).toBe(true);
    });

    it('should return false when storage throws error', () => {
      mockStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(isStorageAvailable(mockStorage)).toBe(false);
    });
  });

  describe('getStorageQuota', () => {
    it('should return null when storage estimate is not available', async () => {
      const quota = await getStorageQuota();
      expect(quota).toBe(null);
    });

    // Note: Testing actual quota requires browser environment
  });

  describe('getAllStorage', () => {
    it('should get all storage items as a record', () => {
      const mockData = {
        key1: JSON.stringify({ value: 1 }),
        key2: JSON.stringify('test'),
      };

      mockStorage.getItem = vi.fn(
        (key: string) => mockData[key as keyof typeof mockData],
      );
      Object.defineProperty(mockStorage, 'length', {
        value: Object.keys(mockData).length,
      });
      vi.spyOn(Object, 'keys').mockReturnValue(Object.keys(mockData));

      const result = getAllStorage(mockStorage);
      expect(result).toEqual({
        key1: { value: 1 },
        key2: 'test',
      });
    });

    it('should handle invalid JSON', () => {
      mockStorage.getItem = vi.fn().mockReturnValue('invalid json');
      vi.spyOn(Object, 'keys').mockReturnValue(['key1']);

      const result = getAllStorage(mockStorage);
      expect(result).toEqual({
        key1: null,
      });
    });
  });

  describe('hasStorageItem', () => {
    it('should return true when item exists', () => {
      vi.spyOn(Object, 'keys').mockReturnValue(['testKey']);
      expect(hasStorageItem('testKey', mockStorage)).toBe(true);
    });

    it('should return false when item does not exist', () => {
      vi.spyOn(Object, 'keys').mockReturnValue(['otherKey']);
      expect(hasStorageItem('testKey', mockStorage)).toBe(false);
    });
  });

  describe('clearStorageByPrefix', () => {
    it('should clear items with matching prefix', () => {
      const keys = ['test_1', 'test_2', 'other_1'];
      vi.spyOn(Object, 'keys').mockReturnValue(keys);

      clearStorageByPrefix('test_', mockStorage);

      expect(mockStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test_1');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test_2');
    });

    it('should not clear items without matching prefix', () => {
      const keys = ['other_1', 'other_2'];
      vi.spyOn(Object, 'keys').mockReturnValue(keys);

      clearStorageByPrefix('test_', mockStorage);

      expect(mockStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('getStorageSize', () => {
    it('should calculate storage size in bytes', () => {
      const mockData = {
        key1: 'value1', // key: 4 chars, value: 6 chars = 20 bytes
        key2: 'value2', // key: 4 chars, value: 6 chars = 20 bytes
      };

      vi.spyOn(Object, 'entries').mockReturnValue(Object.entries(mockData));

      const size = getStorageSize(mockStorage);
      expect(size).toBe(40); // (4 + 6) * 2 * 2 = 40 bytes
    });

    it('should handle empty storage', () => {
      vi.spyOn(Object, 'entries').mockReturnValue([]);
      const size = getStorageSize(mockStorage);
      expect(size).toBe(0);
    });

    it('should handle null values', () => {
      const mockData = {
        key1: null,
      };

      vi.spyOn(Object, 'entries').mockReturnValue(Object.entries(mockData));

      const size = getStorageSize(mockStorage);
      expect(size).toBe(8); // key length (4) * 2 = 8 bytes
    });
  });
});
