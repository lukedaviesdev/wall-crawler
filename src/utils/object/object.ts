/**
 * Object utility functions
 */

/**
 * Deep clones an object
 */
export function deepClone<T>(object: T): T {
  if (object === null || typeof object !== 'object') {
    return object;
  }

  if (Array.isArray(object)) {
    return object.map((item) => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      cloned[key] = deepClone(object[key]);
    }
  }
  return cloned;
}

/**
 * Checks if two objects are deeply equal
 */
export function deepEqual(object1: unknown, object2: unknown): boolean {
  if (object1 === object2) {
    return true;
  }

  if (
    typeof object1 !== 'object' ||
    typeof object2 !== 'object' ||
    !object1 ||
    !object2
  ) {
    return false;
  }

  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2 as object);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (
      !deepEqual(
        (object1 as Record<string, unknown>)[key],
        (object2 as Record<string, unknown>)[key],
      )
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Picks specified properties from an object
 */
export function pick<T extends object, K extends keyof T>(
  object: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in object) {
      result[key] = object[key];
    }
  });
  return result;
}

/**
 * Omits specified properties from an object
 */
export function omit<T extends object, K extends keyof T>(
  object: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...object };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

/**
 * Merges multiple objects deeply
 */
export function deepMerge<T extends object>(...objects: T[]): T {
  const result = {} as T;

  objects.forEach((object) => {
    if (!object) return;

    Object.keys(object).forEach((key) => {
      const value = object[key as keyof T];
      const existing = result[key as keyof T];

      if (Array.isArray(value) && Array.isArray(existing)) {
        (result[key as keyof T] as unknown[]) = [...existing, ...value];
      } else if (isObject(value) && isObject(existing)) {
        result[key as keyof T] = deepMerge(existing, value) as T[keyof T];
      } else {
        result[key as keyof T] = deepClone(value);
      }
    });
  });

  return result;
}

/**
 * Helper function to check if a value is a plain object
 */
function isObject(item: unknown): item is object {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}
