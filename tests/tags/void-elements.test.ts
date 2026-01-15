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

  describe('Media Capability Plugin', () => {
    it('should use width/height from HTML attributes', () => {
      const html = '<img src="test.jpg" width="200" height="150" />';
      const result = transformHTML(html);

      expect(result[0].props?.style?.width).toBe('200');
      expect(result[0].props?.style?.height).toBe('150');
    });

    it('should use width/height from style attribute when HTML attrs missing', () => {
      const html = '<img src="test.jpg" style="width: 300px; height: 200px" />';
      const result = transformHTML(html);

      expect(result[0].props?.style?.width).toBe('300px');
      expect(result[0].props?.style?.height).toBe('200px');
    });

    it('should prefer HTML attributes over style for dimensions', () => {
      const html =
        '<img src="test.jpg" width="100" style="width: 200px; height: 150px" />';
      const result = transformHTML(html);

      // HTML attr width takes precedence, but height comes from style
      expect(result[0].props?.style?.width).toBe('100');
      expect(result[0].props?.style?.height).toBe('150px');
    });

    it('should set default dimensions when none provided', () => {
      const html = '<img src="test.jpg" />';
      const result = transformHTML(html);

      expect(result[0].props?.style?.width).toBe('100%');
      expect(result[0].props?.style?.height).toBe('auto');
    });

    it('should preserve image dimensions even with removeAllStyle=true', () => {
      const html = '<img src="test.jpg" width="200" height="150" />';
      const result = transformHTML(html, { removeAllStyle: true });

      expect(result[0].props?.src).toBe('test.jpg');
      expect(result[0].props?.style?.width).toBe('200');
      expect(result[0].props?.style?.height).toBe('150');
    });

    it('should not process non-img elements', () => {
      const html = '<div>Content</div>';
      const result = transformHTML(html);

      expect(result[0].props?.src).toBeUndefined();
    });
  });
});
