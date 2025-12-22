import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser';
import { HTMLRenderer } from '../../index';

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

  it('should test all text formatting options with HTMLRenderer', () => {
    // 测试所有文本格式选项，确保renderNode函数的样式处理被覆盖
    const html = `
      <div>
        <strong>Bold</strong>
        <em>Italic</em>
        <u>Underline</u>
        <code>Code</code>
        <b>Bold 2</b>
        <i>Italic 2</i>
      </div>
    `;

    const result = HTMLRenderer({ html });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });

  it('should test nested text formatting with HTMLRenderer', () => {
    // 测试嵌套文本格式，确保标记合并逻辑被覆盖
    const html = '<div><strong>Bold <em>and Italic</em></strong></div>';
    const result = HTMLRenderer({ html });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });
});
