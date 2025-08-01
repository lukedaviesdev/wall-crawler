import { describe, it, expect } from 'vitest';

import {
  formatDate,
  isToday,
  addDays,
  daysBetween,
  isWeekend,
  startOfDay,
} from './date';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-02-15T12:30:45');
      expect(formatDate(date)).toBe('2024-02-15');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-02-15T12:30:45');
      expect(formatDate(date, 'DD/MM/YYYY')).toBe('15/02/2024');
      expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe(
        '2024-02-15 12:30:45',
      );
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for other dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const date = new Date('2024-02-15');
      const result = addDays(date, 5);
      expect(result.toISOString().split('T')[0]).toBe('2024-02-20');
    });

    it('should subtract days when negative', () => {
      const date = new Date('2024-02-15');
      const result = addDays(date, -5);
      expect(result.toISOString().split('T')[0]).toBe('2024-02-10');
    });

    it('should handle month/year transitions', () => {
      const date = new Date('2024-02-28');
      const result = addDays(date, 5);
      expect(result.toISOString().split('T')[0]).toBe('2024-03-04');
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between dates', () => {
      const date1 = new Date('2024-02-15');
      const date2 = new Date('2024-02-20');
      expect(daysBetween(date1, date2)).toBe(5);
    });

    it('should handle same date', () => {
      const date = new Date('2024-02-15');
      expect(daysBetween(date, date)).toBe(0);
    });

    it('should handle reversed dates', () => {
      const date1 = new Date('2024-02-15');
      const date2 = new Date('2024-02-20');
      expect(daysBetween(date2, date1)).toBe(5);
    });
  });

  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2024-02-17'); // This is a Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should return true for Sunday', () => {
      const sunday = new Date('2024-02-18'); // This is a Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should return false for weekdays', () => {
      const monday = new Date('2024-02-19'); // This is a Monday
      expect(isWeekend(monday)).toBe(false);
    });
  });

  describe('startOfDay', () => {
    it('should set time to start of day', () => {
      const date = new Date('2024-02-15T12:30:45.123');
      const result = startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should not modify original date', () => {
      const original = new Date('2024-02-15T12:30:45.123');
      const originalTime = original.getTime();
      startOfDay(original);
      expect(original.getTime()).toBe(originalTime);
    });
  });
});
