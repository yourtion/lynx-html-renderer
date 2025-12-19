import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser';

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
        children: [{ kind: 'text', content: 'Styled Text' }],
        meta: { sourceTag: 'div' },
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
        children: [{ kind: 'text', content: 'Styled Paragraph' }],
        meta: { sourceTag: 'p' },
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
        children: [{ kind: 'text', content: 'Styled Div' }],
        meta: { sourceTag: 'div' },
      },
    ]);
  });
});
