/**
 * Performance baseline configuration
 * Externalized baselines for easier maintenance and CI tracking
 */

export interface PerformanceBaseline {
  name: string;
  baselineMs: number;
  memoryKb: number;
  description: string;
}

export const PERFORMANCE_BASELINES: PerformanceBaseline[] = [
  {
    name: 'small-html',
    baselineMs: 1,
    memoryKb: 50,
    description: 'Simple HTML with minimal nodes',
  },
  {
    name: 'medium-html',
    baselineMs: 10,
    memoryKb: 600,
    description: '~100 nodes with inline styles',
  },
  {
    name: 'large-html',
    baselineMs: 50,
    memoryKb: 4500,
    description: '~500 nodes with complex nesting',
  },
  {
    name: 'style-heavy-html',
    baselineMs: 30,
    memoryKb: 2000,
    description: '~100 nodes with heavy inline styles',
  },
];

/**
 * Get baseline by test name
 */
export function getBaseline(
  name: keyof typeof BASELINE_MAP,
): PerformanceBaseline | undefined {
  return BASELINE_MAP[name];
}

const BASELINE_MAP = {
  'transform-small': PERFORMANCE_BASELINES[0],
  'transform-medium': PERFORMANCE_BASELINES[1],
  'transform-large': PERFORMANCE_BASELINES[2],
  'transform-style-heavy': PERFORMANCE_BASELINES[3],
  'memory-medium': { ...PERFORMANCE_BASELINES[1], memoryKb: 600 },
  'memory-large': { ...PERFORMANCE_BASELINES[2], memoryKb: 4500 },
} as const;

/**
 * Check if performance is within baseline
 */
export function isWithinBaseline(
  metrics: { duration: number; memory?: number },
  baseline: PerformanceBaseline,
): { durationOk: boolean; memoryOk: boolean } {
  return {
    durationOk: metrics.duration <= baseline.baselineMs,
    memoryOk: (metrics.memory ?? 0) <= baseline.memoryKb * 1024,
  };
}

/**
 * Format performance report
 */
export function formatPerformanceReport(
  name: string,
  metrics: { duration: number; memory?: number },
  baseline: PerformanceBaseline,
): string {
  const { durationOk, memoryOk } = isWithinBaseline(metrics, baseline);
  const status = durationOk && memoryOk ? '✓' : '⚠️';

  let report = `${status} ${name}\n`;
  report += `  Duration: ${metrics.duration.toFixed(3)}ms (baseline: ${baseline.baselineMs}ms)\n`;
  if (metrics.memory) {
    const memoryKb = metrics.memory / 1024;
    report += `  Memory: ${memoryKb.toFixed(2)} KB (baseline: ${baseline.memoryKb}KB)\n`;
  }
  return report;
}
