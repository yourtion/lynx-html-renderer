import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';

describe('Block Elements', () => {
  it('should transform div to view with correct style', () => {
    const html = '<div>Content</div>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { flexDirection: 'column' } },
        children: [
          { kind: 'text', content: 'Content', meta: { source: 'text' } },
        ],
        capabilities: { isVoid: false, layout: 'flex' },
        meta: { sourceTag: 'div', sourceAttrs: {} },
      },
    ]);
  });

  it('should transform section to view', () => {
    const html = '<section>Section Content</section>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { flexDirection: 'column' } },
        children: [
          {
            kind: 'text',
            content: 'Section Content',
            meta: { source: 'text' },
          },
        ],
        capabilities: { isVoid: false, layout: 'flex' },
        meta: { sourceTag: 'section', sourceAttrs: {} },
      },
    ]);
  });

  it('should transform article to view', () => {
    const html = '<article>Article Content</article>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { flexDirection: 'column' } },
        children: [
          {
            kind: 'text',
            content: 'Article Content',
            meta: { source: 'text' },
          },
        ],
        capabilities: { isVoid: false, layout: 'flex' },
        meta: { sourceTag: 'article', sourceAttrs: {} },
      },
    ]);
  });

  it('should transform header to view', () => {
    const html = '<header>Header Content</header>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { flexDirection: 'column' } },
        children: [
          { kind: 'text', content: 'Header Content', meta: { source: 'text' } },
        ],
        capabilities: { isVoid: false, layout: 'flex' },
        meta: { sourceTag: 'header', sourceAttrs: {} },
      },
    ]);
  });

  it('should transform footer to view', () => {
    const html = '<footer>Footer Content</footer>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { flexDirection: 'column' } },
        children: [
          { kind: 'text', content: 'Footer Content', meta: { source: 'text' } },
        ],
        capabilities: { isVoid: false, layout: 'flex' },
        meta: { sourceTag: 'footer', sourceAttrs: {} },
      },
    ]);
  });

  it('should transform p to text with marginBottom and color', () => {
    const html = '<p>Paragraph</p>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: {
          style: { marginBottom: '1em', color: 'var(--lhr-text-color)' },
        },
        children: [
          {
            kind: 'text',
            content: 'Paragraph',
            inheritableStyles: { color: 'var(--lhr-text-color)' },
            meta: { source: 'text' },
          },
        ],
        capabilities: { layout: 'block', textContainer: true, isVoid: false },
        meta: { sourceTag: 'p', sourceAttrs: {} },
      },
    ]);
  });

  describe('Capability Plugin - Layout', () => {
    it('should add capabilities to all block elements', () => {
      const html = '<div><section><article>Content</article></section></div>';
      const result = transformHTML(html);

      expect(result[0].capabilities).toBeDefined();
      expect(result[0].capabilities?.layout).toBe('flex');
      expect(result[0].children[0].capabilities).toBeDefined();
    });

    it('should not override existing capabilities', () => {
      const html = '<p>Text</p>';
      const result = transformHTML(html);

      // p tag has specific capabilities set by structure plugin
      expect(result[0].capabilities?.layout).toBe('block');
      expect(result[0].capabilities?.textContainer).toBe(true);
    });
  });

  describe('Capability Plugin - Style', () => {
    it('should parse inline styles from HTML', () => {
      const html = '<div style="color: red; font-size: 16px">Styled</div>';
      const result = transformHTML(html);

      expect(result[0].props?.style?.color).toBe('red');
      expect(result[0].props?.style?.fontSize).toBe('16px');
    });

    it('should merge default styles with inline styles', () => {
      const html = '<div style="color: blue">Content</div>';
      const result = transformHTML(html);

      // Should have both flexDirection (default) and color (inline)
      expect(result[0].props?.style?.flexDirection).toBe('column');
      expect(result[0].props?.style?.color).toBe('blue');
    });

    it('should handle class attribute with removeAllClass=false', () => {
      const html = '<div class="my-class other-class">Content</div>';
      const result = transformHTML(html, { removeAllClass: false });

      expect(result[0].props?.className).toBe('my-class other-class');
    });

    it('should remove class attribute by default', () => {
      const html = '<div class="my-class">Content</div>';
      const result = transformHTML(html);

      expect(result[0].props?.className).toBeUndefined();
    });
  });

  describe('List Structure', () => {
    it('should merge list markers into the first text node', () => {
      const html = '<ul><li>Item</li></ul>';
      const result = transformHTML(html);
      const listItem = result[0].children[0];

      expect(listItem.kind).toBe('element');
      if (listItem.kind === 'element') {
        // 标记与首个文本合并为单个文本节点，保证渲染时在同一 <text>（同行）
        expect(listItem.children[0]).toMatchObject({
          kind: 'text',
          content: '• Item',
        });
      }
    });
  });
});
