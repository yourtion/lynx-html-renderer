import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';

describe('Performance API Usage', () => {
  it('should measure total transform time using performance API', () => {
    const html = `
      <div>
        <p>Text with <strong>bold</strong> and <em>italic</em></p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `;

    performance.mark('transform-start');

    const result = transformHTML(html);

    performance.mark('transform-end');
    performance.measure('transform-total', 'transform-start', 'transform-end');

    const measures = performance.getEntriesByType(
      'measure',
    ) as PerformanceMeasure[];
    console.log('\nTransform Timing:');
    measures.forEach((measure) => {
      console.log(`  ${measure.name}: ${measure.duration.toFixed(3)}ms`);
    });

    performance.clearMarks();
    performance.clearMeasures();

    expect(result).toBeDefined();
  });
});
