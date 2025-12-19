import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser.js';
import { pluginManager } from '../../plugin-system.js';
import { BuiltinProcessorType } from '../../plugins/builtin.js';

describe('Plugin System - Builtin Plugin', () => {
  it('should have all builtin processor types defined', () => {
    // Test BuiltinProcessorType enum completeness
    expect(Object.values(BuiltinProcessorType)).toHaveLength(4);
    expect(BuiltinProcessorType.BASE_TAG_TRANSFORM).toBeDefined();
    expect(BuiltinProcessorType.TEXT_NODE_HANDLER).toBeDefined();
    expect(BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES).toBeDefined();
    expect(BuiltinProcessorType.STYLE_PARSER).toBeDefined();
  });

  it('should register all builtin processors', () => {
    // Test that builtin plugin correctly registers all processors
    const html = '<div><strong>Test</strong></div>';
    const result = transformHTML(html);
    expect(result).toBeDefined();
    expect(result[0].children[0].props?.style?.fontWeight).toBe('bold');
  });
});
