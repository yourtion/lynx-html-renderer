/**
 * Performance measurement utilities
 * Supports both Lynx performance API and Web Performance API
 */

export type PerformanceAPI = {
  mark(name: string): void;
  measure(name: string, start: string, end: string): void;
  getEntriesByType(type: string): PerformanceEntryList;
  clearMarks(name?: string): void;
  clearMeasures(name?: string): void;
};

/**
 * Detect available performance API
 */
const getPerformanceAPI = (): PerformanceAPI => {
  // Check for Lynx performance API
  if (typeof lynx !== 'undefined' && lynx.performance) {
    return {
      mark: (name: string) => lynx.performance.profileMark(name),
      measure: (name: string, start: string, end: string) => {
        // Lynx doesn't have measure, use profileStart/End
        lynx.performance.profileStart(`${name}-${start}`);
        lynx.performance.profileEnd(`${name}-${end}`);
      },
      getEntriesByType: (_type: string) => [],
      clearMarks: () => {},
      clearMeasures: () => {},
    };
  }

  // Use Web Performance API (browser or Node.js)
  if (typeof performance !== 'undefined') {
    return performance as PerformanceAPI;
  }

  // Fallback: no-op implementation
  return {
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
  };
};

const perf = getPerformanceAPI();

/**
 * Start a performance measurement
 */
export function startMeasure(name: string): void {
  perf.mark(`${name}-start`);
}

/**
 * End a performance measurement and log the result
 */
export function endMeasure(name: string): number {
  perf.mark(`${name}-end`);
  perf.measure(name, `${name}-start`, `${name}-end`);

  const measures = perf.getEntriesByType('measure');
  const lastMeasure = Array.from(measures).pop() as PerformanceMeasure;

  // Cleanup
  perf.clearMarks(`${name}-start`);
  perf.clearMarks(`${name}-end`);
  perf.clearMeasures(name);

  return lastMeasure?.duration ?? 0;
}

/**
 * Profile a function execution
 */
export function profile<T>(name: string, fn: () => T): T {
  startMeasure(name);
  try {
    return fn();
  } finally {
    const duration = endMeasure(name);

    // Only log in development or if profiling is enabled
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV !== 'production' &&
      process.env?.ENABLE_PROFILING
    ) {
      console.log(`[Perf] ${name}: ${duration.toFixed(3)}ms`);
    }
  }
}
