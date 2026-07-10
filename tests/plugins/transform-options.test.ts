import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it, vi } from 'vitest';
import {
  getPluginInfo,
  getPluginInfoByName,
  getPluginsByPhase,
} from '../../src/transform/plugin-info';

describe('Transform Options', () => {
  describe('removeAllClass', () => {
    it('should remove all class attributes by default (removeAllClass=true)', () => {
      const html = '<div class="container">Content</div>';
      const result = transformHTML(html);

      expect(result[0].props?.className).toBeUndefined();
    });

    it('should preserve class attributes when removeAllClass=false', () => {
      const html = '<div class="container">Content</div>';
      const result = transformHTML(html, { removeAllClass: false });

      expect(result[0].props?.className).toBe('container');
    });

    it('should remove class from multiple elements when removeAllClass=true', () => {
      const html = '<div class="outer"><p class="inner">Text</p></div>';
      const result = transformHTML(html, { removeAllClass: true });

      expect(result[0].props?.className).toBeUndefined();
      expect(result[0].children[0].props?.className).toBeUndefined();
    });

    it('should preserve class from multiple elements when removeAllClass=false', () => {
      const html = '<div class="outer"><p class="inner">Text</p></div>';
      const result = transformHTML(html, { removeAllClass: false });

      expect(result[0].props?.className).toBe('outer');
      expect(result[0].children[0].props?.className).toBe('inner');
    });
  });

  describe('removeAllStyle', () => {
    it('should preserve inline styles by default (removeAllStyle=false)', () => {
      const html = '<div style="color: red">Content</div>';
      const result = transformHTML(html);

      expect(result[0].props?.style).toBeDefined();
      expect(result[0].props?.style?.color).toBe('red');
    });

    it('should remove all inline styles when removeAllStyle=true', () => {
      const html = '<div style="color: red; font-size: 16px">Content</div>';
      const result = transformHTML(html, { removeAllStyle: true });

      // Should only have default style (flexDirection for div)
      expect(result[0].props?.style).toEqual({ flexDirection: 'column' });
    });

    it('should preserve style when removeAllStyle is not set', () => {
      const html = '<div style="background-color: blue">Content</div>';
      const result = transformHTML(html, {});

      expect(result[0].props?.style?.backgroundColor).toBe('blue');
    });
  });

  describe('combined options', () => {
    it('should handle both removeAllClass and removeAllStyle together', () => {
      const html = '<div class="wrapper" style="color: green">Text</div>';
      const result = transformHTML(html, {
        removeAllClass: true,
        removeAllStyle: true,
      });

      expect(result[0].props?.className).toBeUndefined();
      // Should only have default style
      expect(result[0].props?.style).toEqual({ flexDirection: 'column' });
    });

    it('should preserve both when options are false', () => {
      const html = '<div class="wrapper" style="color: blue">Text</div>';
      const result = transformHTML(html, {
        removeAllClass: false,
        removeAllStyle: false,
      });

      expect(result[0].props?.className).toBe('wrapper');
      expect(result[0].props?.style?.color).toBe('blue');
    });
  });

  describe('edge cases', () => {
    it('should handle elements with no class or style', () => {
      const html = '<div>Plain content</div>';
      const result = transformHTML(html, {
        removeAllClass: true,
        removeAllStyle: true,
      });

      // div has default flexDirection style
      expect(result[0].props).toEqual({ style: { flexDirection: 'column' } });
    });

    it('should handle empty class attribute', () => {
      const html = '<div class="">Content</div>';
      const result = transformHTML(html, { removeAllClass: false });

      // Empty class attribute should not add className prop (empty string is falsy)
      expect(result[0].props?.className).toBeUndefined();
    });

    it('should handle empty style attribute', () => {
      const html = '<div style="">Content</div>';
      const result = transformHTML(html, { removeAllStyle: false });

      // Empty style should not add style prop
      expect(result[0].props?.style).toEqual({ flexDirection: 'column' });
    });
  });
});

describe('Plugin Info API', () => {
  describe('getPluginInfo', () => {
    it('should return all builtin plugins', () => {
      const plugins = getPluginInfo();

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
    });

    it('should return plugins with required fields', () => {
      const plugins = getPluginInfo();

      for (const plugin of plugins) {
        expect(plugin).toHaveProperty('name');
        expect(plugin).toHaveProperty('phase');
        expect(plugin).toHaveProperty('order');
        expect(plugin).toHaveProperty('enabledByDefault');
        expect(typeof plugin.name).toBe('string');
        expect(typeof plugin.order).toBe('number');
        expect(typeof plugin.enabledByDefault).toBe('boolean');
      }
    });
  });

  describe('getPluginInfoByName', () => {
    it('should return plugin info for existing plugin', () => {
      const plugins = getPluginInfo();
      const firstName = plugins[0].name;

      const plugin = getPluginInfoByName(firstName);

      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe(firstName);
    });

    it('should return undefined for non-existent plugin', () => {
      const plugin = getPluginInfoByName('non-existent-plugin');

      expect(plugin).toBeUndefined();
    });
  });

  describe('getPluginsByPhase', () => {
    it('should filter plugins by phase', () => {
      const structurePlugins = getPluginsByPhase('structure');

      expect(Array.isArray(structurePlugins)).toBe(true);
      for (const plugin of structurePlugins) {
        expect(plugin.phase).toBe('structure');
      }
    });

    it('should sort plugins by order', () => {
      const plugins = getPluginsByPhase('structure');

      for (let i = 1; i < plugins.length; i++) {
        expect(plugins[i].order).toBeGreaterThanOrEqual(plugins[i - 1].order);
      }
    });

    it('should filter plugins by finalize phase', () => {
      const plugins = getPluginsByPhase('finalize');

      expect(Array.isArray(plugins)).toBe(true);
      for (const plugin of plugins) {
        expect(plugin.phase).toBe('finalize');
      }
    });
  });

  describe('Plugin Execution Order', () => {
    it('should execute plugins in phase order: normalize -> structure -> capability -> finalize', () => {
      const executionOrder: string[] = [];

      const testPlugins = [
        {
          name: 'test-finalize',
          phase: 'finalize' as const,
          order: 10,
          apply: () => executionOrder.push('finalize'),
        },
        {
          name: 'test-normalize',
          phase: 'normalize' as const,
          order: 10,
          apply: () => executionOrder.push('normalize'),
        },
        {
          name: 'test-structure',
          phase: 'structure' as const,
          order: 10,
          apply: () => executionOrder.push('structure'),
        },
        {
          name: 'test-capability',
          phase: 'capability' as const,
          order: 10,
          registerCapabilityHandlers: () => {
            executionOrder.push('capability');
            return new Map();
          },
        },
      ];

      transformHTML('<div>test</div>', { plugins: { extra: testPlugins } });
      expect(executionOrder).toEqual([
        'normalize',
        'structure',
        'capability',
        'finalize',
      ]);
    });

    it('should execute plugins within same phase by order', () => {
      const executionOrder: string[] = [];

      const testPlugins = [
        {
          name: 'order-30',
          phase: 'finalize' as const,
          order: 30,
          apply: () => executionOrder.push('order-30'),
        },
        {
          name: 'order-10',
          phase: 'finalize' as const,
          order: 10,
          apply: () => executionOrder.push('order-10'),
        },
        {
          name: 'order-20',
          phase: 'finalize' as const,
          order: 20,
          apply: () => executionOrder.push('order-20'),
        },
      ];

      transformHTML('<div>test</div>', { plugins: { extra: testPlugins } });
      expect(executionOrder).toEqual(['order-10', 'order-20', 'order-30']);
    });
  });

  describe('TransformMetadata', () => {
    it('should have correct default metadata values', () => {
      let capturedMetadata: Record<string, unknown> = {};

      const inspector = {
        name: 'inspector',
        phase: 'finalize' as const,
        order: 999,
        apply: (ctx: { metadata: Record<string, unknown> }) => {
          capturedMetadata = { ...ctx.metadata };
        },
      };

      transformHTML('<div>test</div>', { plugins: { extra: [inspector] } });

      expect(capturedMetadata.removeAllClass).toBe(true);
      expect(capturedMetadata.removeAllStyle).toBe(false);
      expect(capturedMetadata.styleMode).toBe('inline');
    });

    it('should override metadata with provided options', () => {
      let capturedMetadata: Record<string, unknown> = {};

      const inspector = {
        name: 'inspector',
        phase: 'finalize' as const,
        order: 999,
        apply: (ctx: { metadata: Record<string, unknown> }) => {
          capturedMetadata = { ...ctx.metadata };
        },
      };

      transformHTML('<div>test</div>', {
        removeAllClass: false,
        removeAllStyle: true,
        styleMode: 'css-class',
        plugins: { extra: [inspector] },
      });

      expect(capturedMetadata.removeAllClass).toBe(false);
      expect(capturedMetadata.removeAllStyle).toBe(true);
      expect(capturedMetadata.styleMode).toBe('css-class');
    });

    it('should ignore rootClassName in transform metadata', () => {
      let capturedMetadata: Record<string, unknown> = {};

      const inspector = {
        name: 'inspector',
        phase: 'finalize' as const,
        order: 999,
        apply: (ctx: { metadata: Record<string, unknown> }) => {
          capturedMetadata = { ...ctx.metadata };
        },
      };

      transformHTML('<div>test</div>', {
        rootClassName: 'custom-root',
        plugins: { extra: [inspector] },
      });

      expect('rootClassName' in capturedMetadata).toBe(false);
    });
  });

  describe('Debug Mode', () => {
    it('should collect plugin timing metrics when debug=true', () => {
      let capturedMetrics:
        | {
            pluginTimings: Map<string, number>;
            nodeCount: number;
          }
        | undefined;

      const inspector = {
        name: 'metrics-inspector',
        phase: 'finalize' as const,
        order: 999,
        apply: (ctx: {
          metrics?: { pluginTimings: Map<string, number>; nodeCount: number };
        }) => {
          capturedMetrics = ctx.metrics;
        },
      };

      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      transformHTML('<div><p>hello</p><strong>world</strong></div>', {
        debug: true,
        plugins: { extra: [inspector] },
      });

      expect(capturedMetrics).toBeDefined();
      expect(capturedMetrics?.pluginTimings.size).toBeGreaterThan(0);
      expect(debugSpy).toHaveBeenCalledTimes(1);

      debugSpy.mockRestore();
    });

    it('should not collect metrics or emit debug logs when debug is disabled', () => {
      let capturedMetrics:
        | {
            pluginTimings: Map<string, number>;
            nodeCount: number;
          }
        | undefined;

      const inspector = {
        name: 'metrics-inspector',
        phase: 'finalize' as const,
        order: 999,
        apply: (ctx: {
          metrics?: { pluginTimings: Map<string, number>; nodeCount: number };
        }) => {
          capturedMetrics = ctx.metrics;
        },
      };

      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      transformHTML('<div>no debug</div>', {
        plugins: { extra: [inspector] },
      });

      expect(capturedMetrics).toBeUndefined();
      expect(debugSpy).not.toHaveBeenCalled();

      debugSpy.mockRestore();
    });
  });

  describe('Capability Handler Replacements', () => {
    it('should apply text replacements in a single capability traversal', () => {
      const uppercasePlugin = {
        name: 'uppercase-text',
        phase: 'capability' as const,
        order: 5,
        registerCapabilityHandlers: () =>
          new Map([
            [
              'text',
              (node: {
                kind: string;
                content?: string;
              }): undefined | { kind: 'text'; content: string } => {
                if (node.kind !== 'text' || node.content === undefined) {
                  return undefined;
                }
                return { kind: 'text', content: node.content.toUpperCase() };
              },
            ],
          ]),
        apply: () => {},
      };

      const result = transformHTML('<div>one<span>two</span>three</div>', {
        plugins: { extra: [uppercasePlugin] },
      });

      const collectText = (
        nodes: Array<{ kind: string; content?: string; children?: unknown[] }>,
      ): string => {
        let output = '';
        for (const node of nodes) {
          if (node.kind === 'text' && node.content) {
            output += node.content;
          } else if (node.kind === 'element' && Array.isArray(node.children)) {
            output += collectText(
              node.children as Array<{
                kind: string;
                content?: string;
                children?: unknown[];
              }>,
            );
          }
        }
        return output;
      };

      expect(
        collectText(
          result as Array<{
            kind: string;
            content?: string;
            children?: unknown[];
          }>,
        ),
      ).toBe('ONETWOTHREE');
    });

    it('should handle capability handler that replaces root node', () => {
      const replaceRootPlugin = {
        name: 'replace-root',
        phase: 'capability' as const,
        registerCapabilityHandlers: () =>
          new Map([
            [
              'root',
              () => ({
                kind: 'element',
                tag: 'view',
                props: {},
                children: [{ kind: 'text', content: 'replaced root' }],
              }),
            ],
          ]),
      };

      const result = transformHTML('<div>test</div>', {
        plugins: { extra: [replaceRootPlugin] },
      });

      expect(result).toBeDefined();
    });
  });

  describe('Layout capability skip', () => {
    it('should skip element that already has capabilities', () => {
      let checkedCount = 0;
      const inspectPlugin = {
        name: 'inspect-capabilities',
        phase: 'finalize' as const,
        order: 999,
        apply(ctx: {
          root: { kind: string; children: unknown[]; capabilities?: unknown };
        }) {
          if (ctx.root.kind !== 'element') return;
          for (const child of ctx.root.children) {
            if (child && typeof child === 'object' && 'capabilities' in child) {
              checkedCount++;
            }
          }
        },
      };

      // Pre-set capabilities via a plugin before layout-capability runs
      const preCapPlugin = {
        name: 'pre-capabilities',
        phase: 'capability' as const,
        order: 5, // runs before layout-capability (order 20)
        registerCapabilityHandlers: () =>
          new Map([
            [
              'view',
              (node: { kind: string; capabilities?: unknown }) => {
                if (node.kind === 'element') {
                  node.capabilities = { layout: 'flex', isVoid: false };
                }
              },
            ],
          ]),
      };

      transformHTML('<div>test</div>', {
        plugins: { extra: [preCapPlugin, inspectPlugin] },
      });

      expect(checkedCount).toBeGreaterThan(0);
    });
  });
});
