/**
 * Storage utility functions that complement the useLocalStorage hook
 * For React components, prefer using the useLocalStorage hook instead
 */

/**
 * Checks if storage is available and working
 */
export function isStorageAvailable(storage: Storage = localStorage): boolean {
  try {
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the total storage usage as a percentage of the quota
 * Returns null if the quota information is not available
 */
export async function getStorageQuota(): Promise<number | null> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        return (estimate.usage / estimate.quota) * 100;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting storage quota:', error);
    return null;
  }
}

/**
 * Gets all storage entries as a Record
 */
export function getAllStorage(
  storage: Storage = localStorage,
): Record<string, unknown> {
  try {
    return Object.keys(storage).reduce(
      (accumulator, key) => {
        try {
          const value = storage.getItem(key);
          accumulator[key] = value ? JSON.parse(value) : null;
        } catch {
          accumulator[key] = null;
        }
        return accumulator;
      },
      {} as Record<string, unknown>,
    );
  } catch (error) {
    console.error('Error getting all storage:', error);
    return {};
  }
}

/**
 * Checks if a key exists in storage
 */
export function hasStorageItem(
  key: string,
  storage: Storage = localStorage,
): boolean {
  try {
    return key in storage;
  } catch (error) {
    console.error(`Error checking if key ${key} exists in storage:`, error);
    return false;
  }
}

/**
 * Safely clears all items from storage that match a prefix
 */
export function clearStorageByPrefix(
  prefix: string,
  storage: Storage = localStorage,
): void {
  try {
    const keys = Object.keys(storage).filter((key) => key.startsWith(prefix));
    keys.forEach((key) => storage.removeItem(key));
  } catch (error) {
    console.error(`Error clearing storage with prefix ${prefix}:`, error);
  }
}

/**
 * Gets the size of all items in storage
 * @returns Size in bytes
 */
export function getStorageSize(storage: Storage = localStorage): number {
  try {
    return Object.entries(storage).reduce((size, [key, value]) => {
      return size + (key.length + (value?.length || 0)) * 2; // UTF-16 uses 2 bytes per character
    }, 0);
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
}
