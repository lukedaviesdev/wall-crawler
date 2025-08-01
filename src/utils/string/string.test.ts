import { describe, it, expect } from 'vitest';

import {
  capitalize,
  camelCase,
  truncate,
  removeWhitespace,
  isAlphanumeric,
  kebabCase,
} from './string';

describe('String Utils', () => {
  describe('capitalize', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('camelCase', () => {
    it('should convert string to camelCase', () => {
      expect(camelCase('hello world')).toBe('helloWorld');
      expect(camelCase('hello-world')).toBe('helloWorld');
      expect(camelCase('hello_world')).toBe('helloWorld');
    });

    it('should handle already camelCase strings', () => {
      expect(camelCase('helloWorld')).toBe('helloWorld');
    });

    it('should handle empty strings', () => {
      expect(camelCase('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate string to specified length with ellipsis', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should handle custom ellipsis', () => {
      expect(truncate('hello world', 8, '***')).toBe('hello***');
    });

    it('should handle empty strings', () => {
      expect(truncate('', 5)).toBe('');
    });
  });

  describe('removeWhitespace', () => {
    it('should remove all whitespace from string', () => {
      expect(removeWhitespace('hello world')).toBe('helloworld');
      expect(removeWhitespace('  hello  world  ')).toBe('helloworld');
    });

    it('should handle strings with no whitespace', () => {
      expect(removeWhitespace('hello')).toBe('hello');
    });

    it('should handle empty strings', () => {
      expect(removeWhitespace('')).toBe('');
    });
  });

  describe('isAlphanumeric', () => {
    it('should return true for alphanumeric strings', () => {
      expect(isAlphanumeric('hello123')).toBe(true);
      expect(isAlphanumeric('abc123')).toBe(true);
    });

    it('should return false for non-alphanumeric strings', () => {
      expect(isAlphanumeric('hello!')).toBe(false);
      expect(isAlphanumeric('hello world')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isAlphanumeric('')).toBe(false);
    });
  });

  describe('kebabCase', () => {
    it('should convert string to kebab-case', () => {
      expect(kebabCase('helloWorld')).toBe('hello-world');
      expect(kebabCase('HelloWorld')).toBe('hello-world');
      expect(kebabCase('hello world')).toBe('hello-world');
    });

    it('should handle already kebab-case strings', () => {
      expect(kebabCase('hello-world')).toBe('hello-world');
    });

    it('should handle empty strings', () => {
      expect(kebabCase('')).toBe('');
    });
  });
});
