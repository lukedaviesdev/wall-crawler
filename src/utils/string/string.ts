/**
 * String utility functions
 */

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(string_: string): string {
  if (!string_) return string_;
  return string_.charAt(0).toUpperCase() + string_.slice(1);
}

/**
 * Converts a string to camelCase
 */
export function camelCase(string_: string): string {
  return string_
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
}

/**
 * Truncates a string to a specified length and adds an ellipsis
 */
export function truncate(
  string_: string,
  length: number,
  ellipsis = '...',
): string {
  if (string_.length <= length) return string_;
  return string_.slice(0, length - ellipsis.length) + ellipsis;
}

/**
 * Removes all whitespace from a string
 */
export function removeWhitespace(string_: string): string {
  return string_.replace(/\s+/g, '');
}

/**
 * Checks if a string contains only alphanumeric characters
 */
export function isAlphanumeric(string_: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(string_);
}

/**
 * Converts a string to kebab-case
 */
export function kebabCase(string_: string): string {
  return string_
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
