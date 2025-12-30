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
          { kind: 'text', content: 'Paragraph', meta: { source: 'text' } },
        ],
        capabilities: { layout: 'block', textContainer: true, isVoid: false },
        meta: { sourceTag: 'p', sourceAttrs: {} },
      },
    ]);
  });
});
