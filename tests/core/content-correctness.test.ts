import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../src/html-parser';
import type { LynxNode } from '../../src/lynx/types';

function textContent(nodes: LynxNode[]): string {
  return nodes
    .map((node) =>
      node.kind === 'text' ? node.content : textContent(node.children),
    )
    .join('');
}

describe('preformatted HTML content', () => {
  it.each(['inline', 'css-class'] as const)(
    'preserves whitespace across nested inline nodes in %s mode',
    (styleMode) => {
      const nodes = transformHTML(
        '<pre>  <code>one</code>\n\t  <code>two</code>\n </pre>',
        { styleMode },
      );
      expect(textContent(nodes)).toBe('  one\n\t  two\n ');
      // Lynx only supports normal/nowrap. Do not synthesize Web pre/pre-wrap CSS.
      expect(JSON.stringify(nodes)).not.toContain('"whiteSpace":"pre');
    },
  );

  it('preserves an all-whitespace pre and empty lines', () => {
    expect(textContent(transformHTML('<pre> \n\n\t </pre>'))).toBe(' \n\n\t ');
  });

  it('keeps pre whitespace when styles are stripped or unknown wrappers unwrapped', () => {
    expect(
      textContent(
        transformHTML(
          '<pre><custom><span>a</span>\n  <span>b</span></custom></pre>',
          {
            removeAllStyle: true,
            unknownTagPolicy: 'unwrap',
          },
        ),
      ),
    ).toBe('a\n  b');
  });

  it('does not leak pre whitespace handling into following content', () => {
    expect(
      textContent(
        transformHTML(
          '<pre><span>a</span>\n  <span>b</span></pre><p><span>c</span>\n  <span>d</span></p>',
        ),
      ),
    ).toBe('a\n  bc d');
  });
});

describe('image dimension translation', () => {
  it.each(['inline', 'css-class'] as const)(
    'uses inline dimensions in %s mode even when stripping other styles',
    (styleMode) => {
      for (const removeAllStyle of [false, true]) {
        const [node] = transformHTML(
          '<img src="x.png" width="100" height="40" style="width:200px;color:red">',
          { styleMode, removeAllStyle },
        );
        if (node.kind !== 'element') throw new Error('expected image');
        expect(node.props.style).toMatchObject({
          width: '200px',
          height: '40px',
        });
        if (removeAllStyle)
          expect(node.props.style).not.toHaveProperty('color');
      }
    },
  );

  it('translates numeric attributes to px and preserves percentages', () => {
    const [node] = transformHTML(
      '<img src="x.png" width=" 12.5 " height="50%">',
    );
    if (node.kind !== 'element') throw new Error('expected image');
    expect(node.props.style).toMatchObject({ width: '12.5px', height: '50%' });
  });
});
