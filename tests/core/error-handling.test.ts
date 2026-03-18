import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it, vi } from 'vitest';
import { LynxRenderError, PluginError } from '../../src/errors';
import type {
  LynxElementNode,
  LynxNode,
  LynxTextNode,
} from '../../src/lynx/types';
import {
  validateLynxNode,
  validateLynxNodes,
} from '../../src/validate/lynx-node';

function isTextNode(node: LynxNode): node is LynxTextNode {
  return node.kind === 'text';
}

function isElementNode(node: LynxNode): node is LynxElementNode {
  return node.kind === 'element';
}

function findTextContent(nodes: LynxNode[]): string[] {
  const texts: string[] = [];
  for (const node of nodes) {
    if (isTextNode(node)) {
      texts.push(node.content);
    } else if (isElementNode(node)) {
      texts.push(...findTextContent(node.children));
    }
  }
  return texts;
}

describe('Error Handling Tests', () => {
  describe('Transform Pipeline Errors', () => {
    it('should wrap thrown apply errors as PluginError', () => {
      const brokenPlugin = {
        name: 'broken-apply',
        phase: 'finalize' as const,
        apply: () => {
          throw new Error('apply exploded');
        },
      };

      expect(() =>
        transformHTML('<div>test</div>', {
          plugins: { extra: [brokenPlugin] },
        }),
      ).toThrow(PluginError);

      expect(() =>
        transformHTML('<div>test</div>', {
          plugins: { extra: [brokenPlugin] },
        }),
      ).toThrow('broken-apply failed in phase finalize: apply exploded');
    });

    it('should wrap thrown capability handler errors as PluginError', () => {
      const brokenPlugin = {
        name: 'broken-capability',
        phase: 'capability' as const,
        registerCapabilityHandlers: () =>
          new Map([
            [
              'text',
              () => {
                throw new Error('handler exploded');
              },
            ],
          ]),
      };

      expect(() =>
        transformHTML('<div>test</div>', {
          plugins: { extra: [brokenPlugin] },
        }),
      ).toThrow(PluginError);

      expect(() =>
        transformHTML('<div>test</div>', {
          plugins: { extra: [brokenPlugin] },
        }),
      ).toThrow(
        'broken-capability failed in phase capability: handler exploded',
      );
    });

    it('should validate output nodes in debug mode', () => {
      const invalidOutputPlugin = {
        name: 'invalid-output',
        phase: 'finalize' as const,
        apply: (ctx: { root: LynxNode }) => {
          if (ctx.root.kind !== 'element') {
            return;
          }

          ctx.root.children.push({
            kind: 'text',
            content: 123,
          } as unknown as LynxNode);
        },
      };
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      expect(() =>
        transformHTML('<div>debug validation</div>', {
          debug: true,
          plugins: { extra: [invalidOutputPlugin] },
        }),
      ).toThrow(LynxRenderError);

      expect(() =>
        transformHTML('<div>debug validation</div>', {
          debug: true,
          plugins: { extra: [invalidOutputPlugin] },
        }),
      ).toThrow('Invalid node at index');

      debugSpy.mockRestore();
    });
  });

  describe('Malformed HTML', () => {
    it('should handle unclosed tags and preserve text content', () => {
      const html = '<div><p>Unclosed paragraph';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const texts = findTextContent(result);
      expect(texts).toContain('Unclosed paragraph');
    });

    it('should handle mismatched tags and preserve text content', () => {
      const html = '<div><span>Mismatched</div></span>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);

      const texts = findTextContent(result);
      expect(texts).toContain('Mismatched');
    });

    it('should handle self-closing tags without slash', () => {
      const html = '<p>Text<br>More text</p>';
      const result = transformHTML(html);
      expect(result.length).toBeGreaterThan(0);

      const texts = findTextContent(result);
      expect(texts.join('')).toContain('Text');
      expect(texts.join('')).toContain('More text');
    });

    it('should silently drop tags with invalid tag names', () => {
      const html = '<123invalid>Content</123invalid><div>Valid</div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);

      const texts = findTextContent(result);
      expect(texts).toContain('Valid');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple root elements', () => {
      const html = '<p>First</p><p>Second</p><p>Third</p>';
      const result = transformHTML(html);
      expect(result.length).toBe(3);

      for (const node of result) {
        expect(isElementNode(node)).toBe(true);
        if (isElementNode(node)) {
          expect(node.meta?.sourceTag).toBe('p');
        }
      }
    });

    it('should decode HTML entities in text', () => {
      const html = '<p>Special: &lt; &gt; &amp; &quot;</p>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      const texts = findTextContent(result);
      const textContent = texts.join('');
      expect(textContent).toContain('<');
      expect(textContent).toContain('>');
      expect(textContent).toContain('&');
      expect(textContent).toContain('"');
    });

    it('should handle unicode characters correctly', () => {
      const html = '<p>Unicode: 你好 🎉</p>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      const texts = findTextContent(result);
      const textContent = texts.join('');
      expect(textContent).toContain('你好');
      expect(textContent).toContain('🎉');
    });
  });

  describe('Invalid Attributes', () => {
    it('should handle empty style attribute', () => {
      const html = '<div style="">Content</div>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);
      expect(isElementNode(result[0])).toBe(true);
      if (isElementNode(result[0])) {
        expect(result[0].tag).toBe('view');
      }
    });

    it('should handle malformed style values', () => {
      const html = '<div style="color:;font-weight:">Content</div>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      const texts = findTextContent(result);
      expect(texts).toContain('Content');
    });

    it('should handle attributes without values', () => {
      const html = '<input disabled checked>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Unknown Tags', () => {
    it('should drop unknown HTML tags but preserve content inside known tags', () => {
      const html = '<div><unknown-tag>Content in unknown</unknown-tag></div>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      if (isElementNode(result[0])) {
        expect(result[0].meta?.sourceTag).toBe('div');
      }
    });

    it('should drop custom web components as unknown tags', () => {
      const html = '<my-component>Content</my-component>';
      const result = transformHTML(html);
      expect(result.length).toBe(0);
    });

    it('should drop script and style tags completely', () => {
      const html =
        '<script>alert("test")</script><style>.class{}</style><div>Safe</div>';
      const result = transformHTML(html);

      const texts = findTextContent(result);
      expect(texts.join('')).not.toContain('alert');
      expect(texts.join('')).not.toContain('.class');
      expect(texts).toContain('Safe');
    });
  });

  describe('Text Node Edge Cases', () => {
    it('should handle empty div with no text nodes', () => {
      const html = '<div></div>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      if (isElementNode(result[0])) {
        expect(result[0].children.length).toBe(0);
      }
    });

    it('should handle text with only whitespace inside block elements', () => {
      const html = '<div>   </div>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      if (isElementNode(result[0])) {
        expect(result[0].children.length).toBe(0);
      }
    });

    it('should handle very long text content', () => {
      const longText = 'A'.repeat(10000);
      const html = `<p>${longText}</p>`;
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      const texts = findTextContent(result);
      expect(texts[0].length).toBe(10000);
    });
  });

  describe('Nested Inline Elements', () => {
    it('should handle nested formatting tags with correct marks', () => {
      const html = '<strong>bold <em>bold and italic</em> bold</strong>';
      const result = transformHTML(html);

      const allTexts: LynxTextNode[] = [];
      function collectTexts(nodes: LynxNode[]) {
        for (const node of nodes) {
          if (isTextNode(node)) {
            allTexts.push(node);
          } else if (isElementNode(node)) {
            collectTexts(node.children);
          }
        }
      }
      collectTexts(result);

      const boldTexts = allTexts.filter((t) => t.marks?.bold);
      expect(boldTexts.length).toBeGreaterThan(0);
    });

    it('should handle overlapping text marks', () => {
      const html = '<strong>bold</strong> <em>italic</em> <u>underline</u>';
      const result = transformHTML(html);

      const allTexts: LynxTextNode[] = [];
      function collectTexts(nodes: LynxNode[]) {
        for (const node of nodes) {
          if (isTextNode(node)) {
            allTexts.push(node);
          } else if (isElementNode(node)) {
            collectTexts(node.children);
          }
        }
      }
      collectTexts(result);

      const boldText = allTexts.find((t) => t.marks?.bold);
      const italicText = allTexts.find((t) => t.marks?.italic);
      const underlineText = allTexts.find((t) => t.marks?.underline);

      expect(boldText?.content).toBe('bold');
      expect(italicText?.content).toBe('italic');
      expect(underlineText?.content).toBe('underline');
    });
  });

  describe('Table Edge Cases', () => {
    it('should handle table with cells and preserve structure', () => {
      const html = '<table><tr><td>Cell</td></tr></table>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      if (isElementNode(result[0])) {
        expect(result[0].meta?.sourceTag).toBe('table');
      }
    });

    it('should handle table with empty rows', () => {
      const html = '<table><tr></tr><tr><td>Cell</td></tr></table>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      const texts = findTextContent(result);
      expect(texts).toContain('Cell');
    });
  });

  describe('Image Edge Cases', () => {
    it('should handle image without src', () => {
      const html = '<img />';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      if (isElementNode(result[0])) {
        expect(result[0].tag).toBe('image');
      }
    });

    it('should handle image with empty src', () => {
      const html = '<img src="" />';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      if (isElementNode(result[0])) {
        expect(result[0].tag).toBe('image');
        expect(result[0].meta?.sourceAttrs?.src).toBe('');
      }
    });
  });

  describe('List Edge Cases', () => {
    it('should handle list with empty items', () => {
      const html = '<ul><li></li><li>Item</li><li></li></ul>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      if (isElementNode(result[0])) {
        expect(result[0].meta?.sourceTag).toBe('ul');
      }

      const texts = findTextContent(result);
      expect(texts.join('')).toContain('Item');
    });

    it('should handle nested lists', () => {
      const html =
        '<ul><li>Item 1<ul><li>Nested 1</li><li>Nested 2</li></ul></li></ul>';
      const result = transformHTML(html);
      expect(result.length).toBe(1);

      const texts = findTextContent(result);
      expect(texts.join('')).toContain('Item 1');
      expect(texts.join('')).toContain('Nested 1');
      expect(texts.join('')).toContain('Nested 2');
    });
  });
});

describe('LynxNode Validation', () => {
  describe('validateLynxNode', () => {
    it('should validate valid element node', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'view',
        props: {},
        children: [],
      };

      expect(() => validateLynxNode(node)).not.toThrow();
    });

    it('should validate valid text node', () => {
      const node: LynxNode = {
        kind: 'text',
        content: 'Hello world',
      };

      expect(() => validateLynxNode(node)).not.toThrow();
    });

    it('should throw for invalid node kind', () => {
      const node = { kind: 'invalid' } as unknown as LynxNode;

      expect(() => validateLynxNode(node)).toThrow(LynxRenderError);
      expect(() => validateLynxNode(node)).toThrow('Invalid node kind');
    });

    it('should throw for element node without valid tag', () => {
      const node = {
        kind: 'element',
        tag: '',
        props: {},
        children: [],
      } as LynxNode;

      expect(() => validateLynxNode(node)).toThrow('must have a valid tag');
    });

    it('should throw for element node with invalid children', () => {
      const node = {
        kind: 'element',
        tag: 'view',
        props: {},
        children: 'not an array',
      } as unknown as LynxNode;

      expect(() => validateLynxNode(node)).toThrow('children must be an array');
    });

    it('should throw for element node without props', () => {
      const node = {
        kind: 'element',
        tag: 'view',
        props: null,
        children: [],
      } as unknown as LynxNode;

      expect(() => validateLynxNode(node)).toThrow('must have a props object');
    });

    it('should validate nested children recursively', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'view',
        props: {},
        children: [
          { kind: 'text', content: 'child text' },
          {
            kind: 'element',
            tag: 'text',
            props: {},
            children: [],
          },
        ],
      };

      expect(() => validateLynxNode(node)).not.toThrow();
    });

    it('should throw for invalid child node', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'view',
        props: {},
        children: [{ kind: 'invalid' } as unknown as LynxNode],
      };

      expect(() => validateLynxNode(node)).toThrow('Invalid child at index 0');
    });

    it('should throw for text node with non-string content', () => {
      const node = {
        kind: 'text',
        content: 123,
      } as unknown as LynxNode;

      expect(() => validateLynxNode(node)).toThrow('content must be a string');
    });

    it('should validate text node with valid marks', () => {
      const node: LynxNode = {
        kind: 'text',
        content: 'styled text',
        marks: { bold: true, italic: true },
      };

      expect(() => validateLynxNode(node)).not.toThrow();
    });

    it('should throw for text node with invalid marks type', () => {
      const node = {
        kind: 'text',
        content: 'text',
        marks: 'invalid',
      } as unknown as LynxNode;

      expect(() => validateLynxNode(node)).toThrow('marks must be an object');
    });

    it('should throw for text node with array marks', () => {
      const node = {
        kind: 'text',
        content: 'text',
        marks: ['bold'],
      } as unknown as LynxNode;

      expect(() => validateLynxNode(node)).toThrow('marks must be an object');
    });

    it('should throw for text node with invalid mark types', () => {
      const node = {
        kind: 'text',
        content: 'text',
        marks: { bold: true, invalidMark: true },
      } as unknown as LynxNode;

      expect(() => validateLynxNode(node)).toThrow('Invalid mark types');
    });
  });

  describe('validateLynxNodes', () => {
    it('should validate array of valid nodes', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'text1' },
        { kind: 'element', tag: 'view', props: {}, children: [] },
      ];

      expect(() => validateLynxNodes(nodes)).not.toThrow();
    });

    it('should throw for non-array input', () => {
      expect(() =>
        validateLynxNodes('not an array' as unknown as LynxNode[]),
      ).toThrow('must be an array');
    });

    it('should throw for array with invalid node', () => {
      const nodes = [
        { kind: 'text', content: 'valid' },
        { kind: 'invalid' },
      ] as unknown as LynxNode[];

      expect(() => validateLynxNodes(nodes)).toThrow('Invalid node at index 1');
    });

    it('should validate empty array', () => {
      expect(() => validateLynxNodes([])).not.toThrow();
    });
  });
});
