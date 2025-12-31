import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  name: string;
  duration: number;
  memory?: number;
  iterations: number;
}

/**
 * Test data sets representing different document sizes and complexity
 */
const TEST_HTML = {
  small: '<div>Hello World</div>',
  medium: generateMediumHTML(100), // ~100 nodes with inline styles
  large: generateLargeHTML(500), // ~500 nodes with complex nesting and styles
  styleHeavy: generateStyleHeavyHTML(100), // ~100 nodes with heavy inline styles
};

/**
 * Generate realistic HTML with nested structures and inline styles
 */
function generateMediumHTML(nodeCount: number): string {
  let html = '<article style="padding: 20px; line-height: 1.6;">';
  for (let i = 0; i < nodeCount; i++) {
    const hasStyle = i % 3 === 0;
    const styleAttr = hasStyle
      ? ` style="color: #333; margin-bottom: 1em; font-size: 16px;"`
      : '';

    html += `<p${styleAttr}>Paragraph ${i} with <strong style="font-weight: 700;">bold</strong> and <em style="font-style: italic;">italic</em> text.</p>`;
  }
  html += '</article>';
  return html;
}

/**
 * Generate large HTML document with complex nested structures and inline styles
 */
function generateLargeHTML(nodeCount: number): string {
  let html = `<div style="max-width: 800px; margin: 0 auto; padding: 20px;">`;

  for (let i = 0; i < nodeCount / 10; i++) {
    html += `
      <section style="margin-bottom: 30px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
        <h2 style="font-size: 24px; color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Section ${i}: Complex Title with <span style="color: #e74c3c;">Highlights</span>
        </h2>
    `;

    for (let j = 0; j < 10; j++) {
      const nestedDepth = j % 3;
      let nestedContent = '<div style="margin-left: 20px;">';

      for (let k = 0; k < nestedDepth; k++) {
        nestedContent += `
          <div style="padding: 10px; margin: 5px 0; border-left: 3px solid #3498db;">
            <p style="margin: 0; color: #555; line-height: 1.8;">
              Nested text with <a href="#" style="color: #3498db; text-decoration: none;">link</a>,
              <strong style="font-weight: 700; color: #2c3e50;">bold text</strong>,
              <em style="font-style: italic; color: #7f8c8d;">italic text</em>,
              and <code style="background: #ecf0f1; padding: 2px 6px; border-radius: 3px;">inline code</code>.
            </p>
          </div>
        `;
      }

      nestedContent += '</div>';

      html += `
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 18px; color: #34495e; margin-bottom: 8px;">
            Subsection ${j}
          </h3>
          ${nestedContent}
        </div>
      `;
    }

    html += '</section>';
  }

  html += '</div>';
  return html;
}

/**
 * Generate HTML with heavy inline styles (stress test for style parsing)
 */
function generateStyleHeavyHTML(nodeCount: number): string {
  let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';

  for (let i = 0; i < nodeCount; i++) {
    html += `
      <div style="
        padding: 12px 16px;
        margin: 8px 0;
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
      ">
        <p style="
          font-size: 16px;
          line-height: 1.6;
          color: #333333;
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 8px;
        ">
          Text with <strong style="font-weight: 700; color: #000000;">heavy styling</strong>
          and <span style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">gradients</span>
        </p>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Performance measurement using Web Performance API
 */
function measurePerformance(
  name: string,
  fn: () => void,
  iterations = 100,
): PerformanceMetrics {
  // Force garbage collection if available (Node.js with --expose-gc)
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }

  const startMemory = process.memoryUsage().heapUsed;

  // Use performance.mark() for precise timing
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = name;

  performance.mark(startMark);
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  const measure = performance.getEntriesByName(measureName)[0];
  const duration = measure.duration; // Total duration for all iterations

  // Clean up marks and measures
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);

  const endMemory = process.memoryUsage().heapUsed;
  const memoryUsed = endMemory - startMemory;

  return {
    name,
    duration: duration / iterations, // Average per iteration
    memory: memoryUsed,
    iterations,
  };
}

describe('Performance Benchmarks', () => {
  describe('Transform Performance', () => {
    it('should transform small HTML efficiently', () => {
      const metrics = measurePerformance(
        'transform-small',
        () => {
          transformHTML(TEST_HTML.small);
        },
        1000,
      );

      console.log(`Small HTML: ${metrics.duration.toFixed(3)}ms per iteration`);

      // Baseline expectation: < 1ms per iteration
      expect(metrics.duration).toBeLessThan(1);
    });

    it('should transform medium HTML with inline styles efficiently', () => {
      const metrics = measurePerformance(
        'transform-medium',
        () => {
          transformHTML(TEST_HTML.medium);
        },
        100,
      );

      console.log(
        `Medium HTML (with inline styles): ${metrics.duration.toFixed(3)}ms per iteration`,
      );

      // Baseline expectation: < 10ms per iteration (adjusted for inline styles)
      expect(metrics.duration).toBeLessThan(10);
    });

    it('should transform large HTML with complex nesting efficiently', () => {
      const metrics = measurePerformance(
        'transform-large',
        () => {
          transformHTML(TEST_HTML.large);
        },
        50,
      );

      console.log(
        `Large HTML (complex nesting): ${metrics.duration.toFixed(3)}ms per iteration`,
      );

      // Baseline expectation: < 50ms per iteration (adjusted for complexity)
      expect(metrics.duration).toBeLessThan(50);
    });

    it('should transform style-heavy HTML efficiently', () => {
      const metrics = measurePerformance(
        'transform-style-heavy',
        () => {
          transformHTML(TEST_HTML.styleHeavy);
        },
        50,
      );

      console.log(
        `Style-heavy HTML: ${metrics.duration.toFixed(3)}ms per iteration`,
      );

      // Baseline expectation: < 30ms per iteration (stress test for style parsing)
      expect(metrics.duration).toBeLessThan(30);
    });
  });

  describe('Memory Usage', () => {
    it('should have acceptable memory footprint for medium documents', () => {
      const metrics = measurePerformance(
        'memory-medium',
        () => {
          transformHTML(TEST_HTML.medium);
        },
        100,
      );

      const memoryPerTransform =
        (metrics.memory ?? 0) / metrics.iterations / 1024;
      console.log(
        `Memory per transform (medium): ${memoryPerTransform.toFixed(2)} KB`,
      );

      // Baseline: < 600KB per transform (adjusted for handler pattern overhead)
      expect(memoryPerTransform).toBeLessThan(600);
    });

    it('should have acceptable memory footprint for large documents', () => {
      const metrics = measurePerformance(
        'memory-large',
        () => {
          transformHTML(TEST_HTML.large);
        },
        50,
      );

      const memoryPerTransform =
        (metrics.memory ?? 0) / metrics.iterations / 1024;
      console.log(
        `Memory per transform (large): ${memoryPerTransform.toFixed(2)} KB`,
      );

      // Baseline: < 4500KB per transform (large documents with complex nesting + inline styles + handler pattern)
      expect(memoryPerTransform).toBeLessThan(4500);
    });
  });
});
