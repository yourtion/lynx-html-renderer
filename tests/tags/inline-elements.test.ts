import { transformHTML } from '@lynx-html-renderer/html-parser';
import { HTMLRenderer } from '@lynx-html-renderer/index';
import { describe, expect, it } from 'vitest';

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
        kind: 'text',
        content: 'Bold Text',
        marks: { bold: true },
      },
    ]);
  });

  it('should transform b to text with fontWeight bold', () => {
    const html = '<b>Bold Text</b>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'text',
        content: 'Bold Text',
        marks: { bold: true },
      },
    ]);
  });

  it('should transform em to text with fontStyle italic', () => {
    const html = '<em>Italic Text</em>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'text',
        content: 'Italic Text',
        marks: { italic: true },
      },
    ]);
  });

  it('should transform i to text with fontStyle italic', () => {
    const html = '<i>Italic Text</i>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'text',
        content: 'Italic Text',
        marks: { italic: true },
      },
    ]);
  });

  it('should transform u to text with textDecoration underline', () => {
    const html = '<u>Underlined Text</u>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'text',
        content: 'Underlined Text',
        marks: { underline: true },
      },
    ]);
  });

  it('should transform code to text with monospace font', () => {
    const html = '<code>Code Text</code>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'text',
        content: 'Code Text',
        marks: { code: true },
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
