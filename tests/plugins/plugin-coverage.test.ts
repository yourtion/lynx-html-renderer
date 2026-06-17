import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';
import type {
  LynxElementNode,
  TransformPlugin,
} from '../../src/transform/types';

describe('Plugin branch coverage', () => {
  describe('media-capability fallback width/height', () => {
    it('should set default width=100% and height=auto for img without dimensions', () => {
      const html = '<img src="test.jpg" />';
      const result = transformHTML(html);
      expect(result).toHaveLength(1);
      const img = result[0] as LynxElementNode;
      expect(img.tag).toBe('image');
      expect(img.props.src).toBe('test.jpg');
      // Default width and height should be set by media-capability plugin
      expect(img.props.style?.width).toBe('100%');
      expect(img.props.style?.height).toBe('auto');
    });

    it('should use HTML width/height attributes over defaults', () => {
      const html = '<img src="test.jpg" width="200" height="150" />';
      const result = transformHTML(html);
      const img = result[0] as LynxElementNode;
      expect(img.props.style?.width).toBe('200');
      expect(img.props.style?.height).toBe('150');
    });

    it('should extract width from inline style as fallback', () => {
      const html = '<img src="test.jpg" style="width: 300px" />';
      const result = transformHTML(html);
      const img = result[0] as LynxElementNode;
      expect(img.props.style?.width).toBe('300px');
    });
  });

  describe('layout-capability skip existing capabilities', () => {
    it('should not overwrite pre-existing capabilities', () => {
      const preCap: TransformPlugin = {
        name: 'pre-cap',
        phase: 'capability',
        order: 5,
        registerCapabilityHandlers() {
          return new Map([
            [
              'view',
              (node) => {
                const el = node as LynxElementNode;
                el.capabilities = { layout: 'custom', isVoid: false };
              },
            ],
          ]);
        },
      };

      const inspect: TransformPlugin = {
        name: 'inspect',
        phase: 'finalize',
        order: 999,
        apply(ctx) {
          if (ctx.root.kind !== 'element') return;
          const child = ctx.root.children[0] as LynxElementNode;
          expect(child.capabilities?.layout).toBe('custom');
        },
      };

      transformHTML('<div>test</div>', {
        plugins: { extra: [preCap, inspect] },
      });
    });
  });

  describe('list-structure non-li children', () => {
    it('should handle text nodes inside ul', () => {
      const html = '<ul><li>Item 1</li>text between<li>Item 2</li></ul>';
      const result = transformHTML(html);
      expect(result).toHaveLength(1);
    });

    it('should handle ol without inheritable styles on markers', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const result = transformHTML(html);
      expect(result).toHaveLength(1);
      const ol = result[0] as LynxElementNode;
      expect(ol.meta?.sourceTag).toBe('ol');
      // Check markers（标记合并进首个文本节点，保证与内容同行渲染）
      const firstLi = ol.children[0] as LynxElementNode;
      const firstChild = firstLi.children[0];
      expect(firstChild.kind === 'text' && firstChild.content).toBe('1. First');
    });
  });

  describe('table-structure text children in table', () => {
    it('should handle text node directly inside table', () => {
      const html = '<table>text node<tr><td>Cell</td></tr></table>';
      const result = transformHTML(html);
      expect(result).toHaveLength(1);
      const table = result[0] as LynxElementNode;
      expect(table.meta?.sourceTag).toBe('table');
    });
  });

  describe('block-structure whitespace between inline elements', () => {
    it('should preserve whitespace between inline siblings', () => {
      const html = '<strong>A</strong> <em>B</em>';
      const result = transformHTML(html);
      // Whitespace between two inline elements should be preserved
      const texts: string[] = [];
      function collect(nodes: typeof result) {
        for (const n of nodes) {
          if (n.kind === 'text') texts.push(n.content);
          else if (n.kind === 'element') collect(n.children);
        }
      }
      collect(result);
      expect(texts.join('')).toContain('A B');
    });
  });

  describe('capability handler replacing child nodes', () => {
    it('should replace non-root nodes in capability phase', () => {
      const replacePlugin: TransformPlugin = {
        name: 'replace-child',
        phase: 'capability',
        registerCapabilityHandlers() {
          return new Map([
            [
              'view',
              (node) => {
                const el = node as LynxElementNode;
                // Only replace if it has children
                if (el.children.length === 0) return;
                return {
                  ...el,
                  children: [{ kind: 'text', content: 'replaced' }],
                };
              },
            ],
          ]);
        },
      };

      const result = transformHTML('<div><div>inner</div></div>', {
        plugins: { extra: [replacePlugin] },
      });
      expect(result).toHaveLength(1);
    });
  });
});
