import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';

describe('Void Elements', () => {
  it('should transform img to image element', () => {
    const html = '<img src="test.jpg" alt="Test Image" />';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'image',
        props: {
          src: 'test.jpg',
          style: { width: '100%', height: 'auto' },
        },
        children: [],
        capabilities: { isVoid: true, layout: 'flex' },
        meta: {
          sourceTag: 'img',
          sourceAttrs: { src: 'test.jpg', alt: 'Test Image' },
        },
      },
    ]);
  });

  it('should transform br to newline text node', () => {
    const html = 'Line 1<br />Line 2';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'text',
        content: 'Line 1\nLine 2',
      },
    ]);
  });
});
