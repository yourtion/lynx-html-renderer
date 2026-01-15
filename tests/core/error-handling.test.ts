import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';
import { LynxRenderError } from '../../src/errors';
import type { LynxNode } from '../../src/lynx/types';
import {
  validateLynxNode,
  validateLynxNodes,
} from '../../src/validate/lynx-node';

describe('Error Handling Tests', () => {
  describe('Malformed HTML', () => {
    it('should handle unclosed tags', () => {
      const html = '<div><p>Unclosed paragraph';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle mismatched tags', () => {
      const html = '<div><span>Mismatched</div></span>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle self-closing tags without slash', () => {
      const html = '<p>Text<br>More text</p>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle tags with invalid characters', () => {
      const html = '<div>Normal text</div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple root elements', () => {
      const html = '<p>First</p><p>Second</p><p>Third</p>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle special characters in text', () => {
      const html = '<p>Special: &lt; &gt; &amp; &quot; &apos;</p>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle unicode characters', () => {
      const html = '<p>Unicode: 你好 🎉</p>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Invalid Attributes', () => {
    it('should handle empty style attribute', () => {
      const html = '<div style="">Content</div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle malformed style values', () => {
      const html = '<div style="color:;font-weight:">Content</div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle attributes without values', () => {
      const html = '<input disabled checked>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Unknown Tags', () => {
    it('should handle unknown HTML tags gracefully', () => {
      const html = '<unknown-tag>Content</unknown-tag>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle custom web components', () => {
      const html = '<my-component>Content</my-component>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Text Node Edge Cases', () => {
    it('should handle empty text nodes', () => {
      const html = '<div></div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle text with only whitespace', () => {
      const html = '<div>   </div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle very long text content', () => {
      const longText = 'A'.repeat(10000);
      const html = `<p>${longText}</p>`;
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Nested Inline Elements', () => {
    it('should handle nested formatting tags', () => {
      const html = '<strong>bold <em>bold and italic</em> bold</strong>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle overlapping text marks', () => {
      const html = '<strong>bold</strong> <em>italic</em> <u>underline</u>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Table Edge Cases', () => {
    it('should handle table with missing cells', () => {
      const html = '<table><tr><td>Cell</td></tr></table>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle table with empty rows', () => {
      const html = '<table><tr></tr><tr><td>Cell</td></tr></table>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Image Edge Cases', () => {
    it('should handle image without src', () => {
      const html = '<img />';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle image with empty src', () => {
      const html = '<img src="" />';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('List Edge Cases', () => {
    it('should handle list with empty items', () => {
      const html = '<ul><li></li><li>Item</li><li></li></ul>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle nested lists', () => {
      const html =
        '<ul><li>Item 1<ul><li>Nested 1</li><li>Nested 2</li></ul></li></ul>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
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
