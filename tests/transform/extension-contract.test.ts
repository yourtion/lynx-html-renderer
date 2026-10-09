import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../src/html-parser';
import type { LynxTextNode } from '../../src/lynx/types';
import { mergeAdjacentTextNodes } from '../../src/lynx/utils';

describe('Extension and text merge contracts', () => {
  it('drops unknown subtrees by default and supports explicit unwrap', () => {
    expect(transformHTML('<custom-card><p>T</p></custom-card>')).toEqual([]);
    expect(
      transformHTML('<custom-card><p>T</p></custom-card>', {
        unknownTagPolicy: 'unwrap',
      }),
    ).toMatchObject([
      { meta: { sourceTag: 'p' }, children: [{ content: 'T' }] },
    ]);
  });

  it('keeps fallback tag identity, children and source attributes', () => {
    expect(
      transformHTML('<custom-card title="card"><p>T</p></custom-card>', {
        unknownTagPolicy: 'fallback',
      }),
    ).toMatchObject([
      {
        tag: 'custom-card',
        props: { title: 'card' },
        children: [{ children: [{ content: 'T' }] }],
      },
    ]);
  });

  it('excludes head, script and style content in every unknown-tag mode', () => {
    for (const unknownTagPolicy of ['drop', 'unwrap', 'fallback'] as const) {
      expect(
        transformHTML(
          '<html><head><title>Hidden</title></head><body><script>Hidden</script><style>Hidden</style><p>T</p></body></html>',
          { unknownTagPolicy },
        ),
      ).toMatchObject([
        { meta: { sourceTag: 'p' }, children: [{ content: 'T' }] },
      ]);
    }
  });

  it.each([
    { inheritableStyles: { color: 'blue' } },
    { inheritableClasses: 'business' },
    { meta: { interaction: 'link' } },
  ])(
    'does not merge fragments with different styles, classes or semantics %j',
    (difference) => {
      const first: LynxTextNode = {
        kind: 'text',
        content: 'A',
        inheritableStyles: { color: 'red' },
      };
      const second: LynxTextNode = { ...first, ...difference, content: 'B' };
      expect(mergeAdjacentTextNodes([first, second])).toHaveLength(2);
    },
  );

  it('merges fragments with the same resolved style and marks', () => {
    const first: LynxTextNode = {
      kind: 'text',
      content: 'A',
      marks: { bold: true },
      inheritableStyles: { color: 'red' },
      inheritableClasses: 'business',
    };
    expect(
      mergeAdjacentTextNodes([first, { ...first, content: 'B' }]),
    ).toMatchObject([
      {
        content: 'AB',
        marks: { bold: true },
        inheritableStyles: { color: 'red' },
        inheritableClasses: 'business',
      },
    ]);
  });
});
