import { describe, expect, it } from 'vitest';
import { transformHTML } from '@lynx-html-renderer/html-parser';

describe('Nested Structures', () => {
  it('should handle nested divs correctly', () => {
    const html = '<div><div>Inner Content</div></div>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { flexDirection: 'column' } },
        children: [
          {
            kind: 'element',
            tag: 'view',
            props: { style: { flexDirection: 'column' } },
            children: [{ kind: 'text', content: 'Inner Content' }],
            meta: { sourceTag: 'div' },
          },
        ],
        meta: { sourceTag: 'div' },
      },
    ]);
  });

  it('should handle complex nested structure', () => {
    const html =
      '<div><p>Paragraph <strong>with bold</strong> text</p><img src="test.jpg" /></div>';
    const result = transformHTML(html);

    // With marks system, <strong> no longer creates a wrapper element
    // It returns a text node with marks directly
    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { flexDirection: 'column' } },
        children: [
          {
            kind: 'element',
            tag: 'text',
            props: { style: { marginBottom: '1em' } },
            children: [
              { kind: 'text', content: 'Paragraph ' },
              { kind: 'text', content: 'with bold', marks: { bold: true } },
              { kind: 'text', content: ' text' },
            ],
            meta: { sourceTag: 'p' },
          },
          {
            kind: 'element',
            tag: 'image',
            props: {
              src: 'test.jpg',
              style: {},
            },
            children: [],
            meta: { sourceTag: 'img' },
          },
        ],
        meta: { sourceTag: 'div' },
      },
    ]);
  });
});
