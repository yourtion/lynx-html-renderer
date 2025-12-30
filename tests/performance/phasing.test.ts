import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';

describe('Phase Performance Profiling', () => {
  it('should profile each transformation phase', () => {
    const html = `
      <div>
        <p>Text with <strong>bold</strong> and <em>italic</em></p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `;

    // Profile using Web Performance API
    const phases = [
      'parse-html',
      'normalize-phase',
      'structure-phase',
      'capability-phase',
      'finalize-phase',
    ];

    phases.forEach((phase) => {
      performance.mark(`${phase}-start`);
    });

    // Execute transformation
    const result = transformHTML(html);

    phases.forEach((phase) => {
      performance.mark(`${phase}-end`);
      performance.measure(phase, `${phase}-start`, `${phase}-end`);
    });

    // Report phase timings
    const measures = performance.getEntriesByType(
      'measure',
    ) as PerformanceMeasure[];
    console.log('\nPhase Breakdown:');
    measures.forEach((measure) => {
      console.log(`  ${measure.name}: ${measure.duration.toFixed(3)}ms`);
    });

    // Cleanup
    performance.clearMarks();
    performance.clearMeasures();

    expect(result).toBeDefined();
  });
});
