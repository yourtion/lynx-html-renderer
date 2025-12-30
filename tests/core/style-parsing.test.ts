import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';

describe('Style Parsing', () => {
  it('should parse inline styles correctly', () => {
    const html = '<div style="color: red; font-size: 16px;">Styled Text</div>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: {
          style: {
            flexDirection: 'column',
            color: 'red',
            fontSize: '16px',
          },
        },
        children: [
          { kind: 'text', content: 'Styled Text', meta: { source: 'text' } },
        ],
        capabilities: { isVoid: false, layout: 'flex' },
        meta: {
          sourceTag: 'div',
          sourceAttrs: { style: 'color: red; font-size: 16px;' },
        },
      },
    ]);
  });

  it('should merge default styles with inline styles', () => {
    const html = '<p style="color: blue;">Styled Paragraph</p>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'text',
        props: {
          style: {
            marginBottom: '1em',
            color: 'blue',
          },
        },
        children: [
          {
            kind: 'text',
            content: 'Styled Paragraph',
            // Note: inheritableStyles has the default style color, not the merged color
            // The actual rendering will use props.style which has the merged value
            inheritableStyles: { color: 'var(--lhr-text-color)' },
            meta: { source: 'text' },
          },
        ],
        capabilities: { layout: 'block', textContainer: true, isVoid: false },
        meta: { sourceTag: 'p', sourceAttrs: { style: 'color: blue;' } },
      },
    ]);
  });

  it('should handle kebab-case styles correctly', () => {
    const html =
      '<div style="background-color: #fff; border-radius: 4px;">Styled Div</div>';
    const result = transformHTML(html);

    expect(result).toEqual([
      {
        kind: 'element',
        tag: 'view',
        props: {
          style: {
            flexDirection: 'column',
            backgroundColor: '#fff',
            borderRadius: '4px',
          },
        },
        children: [
          { kind: 'text', content: 'Styled Div', meta: { source: 'text' } },
        ],
        capabilities: { isVoid: false, layout: 'flex' },
        meta: {
          sourceTag: 'div',
          sourceAttrs: { style: 'background-color: #fff; border-radius: 4px;' },
        },
      },
    ]);
  });
});
