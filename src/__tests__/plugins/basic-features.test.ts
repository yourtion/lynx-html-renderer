import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser.js';
import { pluginManager } from '../../plugin-system.js';
import type { HtmlToLynxPlugin } from '../../typings.js';

describe('Plugin System - Basic Features', () => {
  // Create a simple plugin to test custom tag handling
  const customPlugin: HtmlToLynxPlugin = {
    name: 'custom-plugin',
    setup(ctx) {
      ctx.registerTagHandler('custom', (node, { transformChildren }) => {
        return {
          kind: 'element',
          tag: 'view',
          props: { style: { backgroundColor: 'red' } },
          children: transformChildren(node.children),
          meta: { sourceTag: 'custom' },
        };
      });
    },
  };

  // Create a simple plugin to test style handling
  const stylePlugin: HtmlToLynxPlugin = {
    name: 'style-plugin',
    setup(ctx) {
      ctx.registerStyleHandler((style, _node) => {
        // Add default border to all elements
        return {
          ...style,
          border: '1px solid blue',
        };
      });
    },
  };

  // Create a simple plugin to test node post-processing
  const postProcessorPlugin: HtmlToLynxPlugin = {
    name: 'post-processor-plugin',
    setup(ctx) {
      ctx.registerNodePostProcessor((node) => {
        // Add 'processed' marker to all text nodes
        if (node.kind === 'text') {
          return {
            ...node,
            content: `${node.content} (processed)`,
          };
        }
        return node;
      });
    },
  };

  it('should allow registering and using a custom tag handler', () => {
    // Register plugin
    pluginManager.registerPlugin(customPlugin);

    // Test custom tag transformation
    const html = '<custom>Custom Content</custom>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { backgroundColor: 'red' } },
        children: [{ kind: 'text', content: 'Custom Content' }],
        meta: { sourceTag: 'custom' },
      },
    ]);
  });

  it('should allow registering and using a custom style handler', () => {
    // Register plugin
    pluginManager.registerPlugin(stylePlugin);

    // Test style handling
    const html = '<div style="color: red">Styled Content</div>';
    const result = transformHTML(html);

    expect(result[0].props?.style).toEqual({
      flexDirection: 'column',
      color: 'red',
      border: '1px solid blue',
    });
  });

  it('should allow registering and using a node post-processor', () => {
    // Register plugin
    pluginManager.registerPlugin(postProcessorPlugin);

    // Test node post-processing
    const html = '<div>Original Content</div>';
    const result = transformHTML(html);

    expect(result[0].children[0].content).toBe('Original Content (processed)');
  });
});
