import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';

describe('Core HTML Parsing', () => {
  describe('Basic Text Nodes', () => {
    it('should transform simple text correctly', () => {
      const html = 'Hello World';
      const result = transformHTML(html);

      expect(result).toEqual([
        {
          kind: 'text',
          content: 'Hello World',
        },
      ]);
    });

    it('should merge adjacent text nodes', () => {
      const html = 'Hello <span> </span> World';
      const result = transformHTML(html);

      expect(result).toEqual([
        {
          kind: 'text',
          content: 'Hello ',
        },
        {
          kind: 'element',
          tag: 'text',
          props: {},
          children: [],
          meta: { sourceTag: 'span' },
        },
        {
          kind: 'text',
          content: ' World',
        },
      ]);
    });

    it('should handle multiple text nodes', () => {
      const html = '<div>Text 1</div><div>Text 2</div>';
      const result = transformHTML(html);

      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [{ kind: 'text', content: 'Text 1' }],
          meta: { sourceTag: 'div' },
        },
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [{ kind: 'text', content: 'Text 2' }],
          meta: { sourceTag: 'div' },
        },
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty HTML', () => {
      const html = '';
      const result = transformHTML(html);

      expect(result).toEqual([]);
    });

    it('should handle whitespace-only HTML', () => {
      const html = '   \n   \t   ';
      const result = transformHTML(html);

      expect(result).toEqual([]);
    });

    it('should handle HTML with only comments', () => {
      const html = '<!-- This is a comment -->';
      const result = transformHTML(html);

      expect(result).toEqual([]);
    });

    it('should handle mixed content with whitespace', () => {
      const html = '  Text 1  <div>  Text 2  </div>  Text 3  ';
      const result = transformHTML(html);

      expect(result).toEqual([
        { kind: 'text', content: '  Text 1  ' },
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [{ kind: 'text', content: '  Text 2  ' }],
          meta: { sourceTag: 'div' },
        },
        { kind: 'text', content: '  Text 3  ' },
      ]);
    });
  });
});
