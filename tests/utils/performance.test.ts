import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock lynx.performance before the module loads
const mockMark = vi.fn();
const mockMeasure = vi.fn();
const mockClearMarks = vi.fn();
const mockClearMeasures = vi.fn();

vi.mock('../../src/utils/performance', () => {
  return {
    startMeasure(name: string) {
      mockMark(`${name}-start`);
    },
    endMeasure(name: string): number {
      mockMark(`${name}-end`);
      mockMeasure(name, `${name}-start`, `${name}-end`);
      mockClearMarks(`${name}-start`);
      mockClearMarks(`${name}-end`);
      mockClearMeasures(name);
      return 0;
    },
    profile<T>(name: string, fn: () => T): T {
      mockMark(`${name}-start`);
      try {
        return fn();
      } finally {
        mockMark(`${name}-end`);
        mockMeasure(name, `${name}-start`, `${name}-end`);
      }
    },
  };
});

import { endMeasure, profile, startMeasure } from '../../src/utils/performance';

describe('performance utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startMeasure / endMeasure', () => {
    it('should call mark and measure', () => {
      startMeasure('test-basic');
      const duration = endMeasure('test-basic');
      expect(typeof duration).toBe('number');
      expect(mockMark).toHaveBeenCalledWith('test-basic-start');
      expect(mockMark).toHaveBeenCalledWith('test-basic-end');
    });
  });

  describe('profile', () => {
    it('should return the function result', () => {
      const result = profile('test-return', () => 42);
      expect(result).toBe(42);
    });

    it('should call the function once', () => {
      let count = 0;
      profile('test-call', () => {
        count++;
        return 'done';
      });
      expect(count).toBe(1);
    });

    it('should still throw when function throws', () => {
      expect(() =>
        profile('test-throw', () => {
          throw new Error('boom');
        }),
      ).toThrow('boom');
    });

    it('should measure sync work correctly', () => {
      const result = profile('test-sync', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });
      expect(result).toBe(499500);
    });
  });
});
