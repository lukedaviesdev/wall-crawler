/**
 * Array utility functions
 */

/**
 * Chunks an array into smaller arrays of specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, (index + 1) * size),
  );
}

/**
 * Removes duplicate values from an array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Groups array elements by a key returned by the callback function
 */
export function groupBy<T>(
  array: T[],
  callback: (item: T) => string,
): Record<string, T[]> {
  return array.reduce(
    (accumulator, item) => {
      const key = callback(item);
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(item);
      return accumulator;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * Flattens an array of arrays into a single array
 */
export function flatten<T>(array: T[][]): T[] {
  return array.reduce((flat, current) => flat.concat(current), []);
}

/**
 * Returns the intersection of two arrays
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  const set = new Set(array2);
  return array1.filter((item) => set.has(item));
}
