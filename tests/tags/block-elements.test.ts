import { describe, expect, it } from 'vitest';
import { transformHTML } from '@lynx-html-renderer/html-parser';

describe('Block Elements', () => {
  it('should transform div to view with correct style', () => {
    const html = '<div>Content</div>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: { style: { flexDirection: 'column' } },
        children: [{ kind: 'text', content: 'Content' }],
        meta: { sourceTag: 'div' },
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
        children: [{ kind: 'text', content: 'Section Content' }],
        meta: { sourceTag: 'section' },
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
        children: [{ kind: 'text', content: 'Article Content' }],
        meta: { sourceTag: 'article' },
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
        children: [{ kind: 'text', content: 'Header Content' }],
        meta: { sourceTag: 'header' },
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
        children: [{ kind: 'text', content: 'Footer Content' }],
        meta: { sourceTag: 'footer' },
      },
    ]);
  });

  it('should transform p to text with marginBottom', () => {
    const html = '<p>Paragraph</p>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: { style: { marginBottom: '1em' } },
        children: [{ kind: 'text', content: 'Paragraph' }],
        meta: { sourceTag: 'p' },
      },
    ]);
  });
});
