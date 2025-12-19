import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser';

describe('Inline Elements', () => {
  it('should transform span to text', () => {
    const html = '<span>Span Text</span>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: {},
        children: [{ kind: 'text', content: 'Span Text' }],
        meta: { sourceTag: 'span' },
      },
    ]);
  });

  it('should transform strong to text with fontWeight bold', () => {
    const html = '<strong>Bold Text</strong>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: { style: { fontWeight: 'bold' } },
        children: [{ kind: 'text', content: 'Bold Text' }],
        meta: { sourceTag: 'strong' },
      },
    ]);
  });

  it('should transform b to text with fontWeight bold', () => {
    const html = '<b>Bold Text</b>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: { style: { fontWeight: 'bold' } },
        children: [{ kind: 'text', content: 'Bold Text' }],
        meta: { sourceTag: 'b' },
      },
    ]);
  });

  it('should transform em to text with fontStyle italic', () => {
    const html = '<em>Italic Text</em>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: { style: { fontStyle: 'italic' } },
        children: [{ kind: 'text', content: 'Italic Text' }],
        meta: { sourceTag: 'em' },
      },
    ]);
  });

  it('should transform i to text with fontStyle italic', () => {
    const html = '<i>Italic Text</i>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: { style: { fontStyle: 'italic' } },
        children: [{ kind: 'text', content: 'Italic Text' }],
        meta: { sourceTag: 'i' },
      },
    ]);
  });

  it('should transform u to text with textDecoration underline', () => {
    const html = '<u>Underlined Text</u>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: { style: { textDecoration: 'underline' } },
        children: [{ kind: 'text', content: 'Underlined Text' }],
        meta: { sourceTag: 'u' },
      },
    ]);
  });

  it('should transform code to text with monospace font', () => {
    const html = '<code>Code Text</code>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: { style: { fontFamily: 'monospace' } },
        children: [{ kind: 'text', content: 'Code Text' }],
        meta: { sourceTag: 'code' },
      },
    ]);
  });
});
