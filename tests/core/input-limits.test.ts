import { describe, expect, it, vi } from 'vitest';
import { HTMLTransformError } from '../../src/errors';
import { transformHTML } from '../../src/html-parser';
import type { TransformLimits } from '../../src/transform/types';

describe('HTML input limits', () => {
  it('rejects deeply nested input with a typed error before plugins run', () => {
    const apply = vi.fn();
    const html = `${'<div>'.repeat(2000)}x${'</div>'.repeat(2000)}`;
    expect(() =>
      transformHTML(html, {
        plugins: {
          extra: [{ name: 'probe', phase: 'normalize', order: -1, apply }],
        },
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'LIMIT_EXCEEDED', phase: 'parse' }),
    );
    expect(apply).not.toHaveBeenCalled();
  });

  it.each([
    ['maxInputLength', '<p>x</p>', 8],
    ['maxNodes', '<p>x</p>', 2],
    ['maxDepth', '<div><span>x</span></div>', 2],
  ] as const)(
    'accepts the exact %s boundary and rejects one less',
    (key, html, maximum) => {
      expect(() =>
        transformHTML(html, { limits: { [key]: maximum } }),
      ).not.toThrow();
      expect(() =>
        transformHTML(html, { limits: { [key]: maximum - 1 } }),
      ).toThrowError(expect.objectContaining({ code: 'LIMIT_EXCEEDED' }));
    },
  );

  it('counts ignored subtrees and comments before content filtering', () => {
    expect(() =>
      transformHTML('<script>x</script><!-- c -->', {
        limits: { maxNodes: 2 },
      }),
    ).toThrow('maxNodes exceeded');
    expect(() =>
      transformHTML('<unknown><unknown>x</unknown></unknown>', {
        limits: { maxDepth: 1 },
      }),
    ).toThrow('maxDepth exceeded');
  });

  it('bounds input length before any AST processing', () => {
    expect(() => transformHTML('x'.repeat(1_000_001))).toThrow(
      'maxInputLength exceeded',
    );
  });

  it('allows empty input with zero limits', () => {
    expect(
      transformHTML('', {
        limits: { maxInputLength: 0, maxNodes: 0, maxDepth: 0 },
      }),
    ).toEqual([]);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid limit %s',
    (value) => {
      for (const key of ['maxNodes', 'maxDepth', 'maxInputLength'] as Array<
        keyof TransformLimits
      >) {
        expect(() =>
          transformHTML('<p>x</p>', { limits: { [key]: value } }),
        ).toThrow(HTMLTransformError);
      }
    },
  );

  it('allows a normal deeply nested document within the default bound', () => {
    expect(() =>
      transformHTML(`${'<div>'.repeat(256)}x${'</div>'.repeat(256)}`),
    ).not.toThrow();
  });
});
