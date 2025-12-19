import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser.js';
import { pluginManager } from '../../plugin-system.js';
import { BuiltinProcessorType } from '../../plugins/builtin.js';
import type { HtmlToLynxPlugin } from '../../typings.js';

describe('Plugin System - Processor Management', () => {
  // Reset plugin manager state before each test
  beforeEach(() => {
    // Re-enable all builtin processors
    Object.values(BuiltinProcessorType).forEach((type) => {
      pluginManager.enableProcessor(type);
    });
  });

  // Clean up plugin manager state after each test
  afterEach(() => {
    // Re-enable all builtin processors
    Object.values(BuiltinProcessorType).forEach((type) => {
      pluginManager.enableProcessor(type);
    });
  });

  it('should check if processor is disabled', () => {
    // Test isProcessorDisabled method
    pluginManager.disableProcessor(
      BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES,
    );
    expect(
      pluginManager.isProcessorDisabled(
        BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES,
      ),
    ).toBe(true);

    pluginManager.enableProcessor(
      BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES,
    );
    expect(
      pluginManager.isProcessorDisabled(
        BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES,
      ),
    ).toBe(false);
  });

  it('should respect processor priorities', () => {
    // Test processor priority handling
    const highPriorityHandler = (node: any, context: any) => {
      if (node.type === 'tag' && node.name === 'span') {
        return {
          kind: 'element',
          tag: 'text',
          props: { style: { color: 'red' } },
          children: context.transformChildren(node.children),
          meta: { sourceTag: 'span', priority: 'high' },
        };
      }
      return context.defaultTransform();
    };

    const lowPriorityHandler = (node: any, context: any) => {
      if (node.type === 'tag' && node.name === 'span') {
        return {
          kind: 'element',
          tag: 'text',
          props: { style: { color: 'blue' } },
          children: context.transformChildren(node.children),
          meta: { sourceTag: 'span', priority: 'low' },
        };
      }
      return context.defaultTransform();
    };

    // Set different priorities
    (highPriorityHandler as any).type = 'highPriorityHandler';
    (highPriorityHandler as any).priority = 200;

    (lowPriorityHandler as any).type = 'lowPriorityHandler';
    (lowPriorityHandler as any).priority = 100;

    // Register processors (order doesn't matter, priority determines execution order)
    pluginManager.registerPlugin({
      name: 'low-priority-plugin',
      setup(ctx) {
        ctx.registerTagHandler('span', lowPriorityHandler);
      },
    });

    pluginManager.registerPlugin({
      name: 'high-priority-plugin',
      setup(ctx) {
        ctx.registerTagHandler('span', highPriorityHandler);
      },
    });

    // Test that high priority processor is executed
    const html = '<span>Priority Test</span>';
    const result = transformHTML(html);

    // Verify high priority processor was executed
    expect(result[0].meta?.priority).toBe('high');
    expect(result[0].props?.style?.color).toBe('red');
  });
});
