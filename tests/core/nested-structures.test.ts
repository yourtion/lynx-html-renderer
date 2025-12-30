import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';

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
            children: [
              {
                kind: 'text',
                content: 'Inner Content',
                meta: { source: 'text' },
              },
            ],
            capabilities: { isVoid: false, layout: 'flex' },
            meta: { sourceTag: 'div', sourceAttrs: {} },
          },
        ],
        capabilities: { isVoid: false, layout: 'flex' },
        meta: { sourceTag: 'div', sourceAttrs: {} },
      },
    ]);
  });

  it('should handle complex nested structure', () => {
    const html =
      '<div><p>Paragraph <strong>with bold</strong> text</p><img src="test.jpg" /></div>';
    const result = transformHTML(html);

    // With marks system, <strong> no longer creates a wrapper element
    // It returns a text node with marks directly
    // Text nodes now have inheritableStyles from parent p element
    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { flexDirection: 'column' } },
        children: [
          {
            kind: 'element',
            tag: 'text',
            props: {
              style: { marginBottom: '1em', color: 'var(--lhr-text-color)' },
            },
            children: [
              {
                kind: 'text',
                content: 'Paragraph ',
                inheritableStyles: { color: 'var(--lhr-text-color)' },
                meta: { source: 'text' },
              },
              {
                kind: 'text',
                content: 'with bold',
                marks: { bold: true },
                inheritableStyles: { color: 'var(--lhr-text-color)' },
                meta: { source: 'text' },
              },
              {
                kind: 'text',
                content: ' text',
                inheritableStyles: { color: 'var(--lhr-text-color)' },
                meta: { source: 'text' },
              },
            ],
            capabilities: {
              layout: 'block',
              textContainer: true,
              isVoid: false,
            },
            meta: { sourceTag: 'p', sourceAttrs: {} },
          },
          {
            kind: 'element',
            tag: 'image',
            props: {
              src: 'test.jpg',
              style: { width: '100%', height: 'auto' },
            },
            children: [],
            capabilities: { isVoid: true, layout: 'flex' },
            meta: { sourceTag: 'img', sourceAttrs: { src: 'test.jpg' } },
          },
        ],
        capabilities: { isVoid: false, layout: 'flex' },
        meta: { sourceTag: 'div', sourceAttrs: {} },
      },
    ]);
  });
});
