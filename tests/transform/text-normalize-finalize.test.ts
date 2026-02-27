import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';
import type { TransformPlugin } from '../../src/transform/types';

describe('text-normalize-finalize plugin', () => {
  it('should collapse nested transparent text wrappers in finalize phase', () => {
    const injectTransparentWrappers: TransformPlugin = {
      name: 'inject-transparent-wrappers',
      phase: 'structure',
      order: 998,
      apply(ctx) {
        ctx.root.children = [
          {
            kind: 'element',
            tag: 'text',
            props: {},
            children: [
              {
                kind: 'element',
                tag: 'text',
                props: {},
                children: [
                  {
                    kind: 'text',
                    content: 'flatten me',
                  },
                ],
              },
            ],
          },
        ];
      },
    };

    const result = transformHTML('<div>ignored</div>', {
      plugins: {
        extra: [injectTransparentWrappers],
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('text');
    if (result[0].kind === 'text') {
      expect(result[0].content).toBe('flatten me');
    }
  });

  it('should keep text wrappers when they have props', () => {
    const injectStyledTextWrapper: TransformPlugin = {
      name: 'inject-styled-text-wrapper',
      phase: 'structure',
      order: 998,
      apply(ctx) {
        ctx.root.children = [
          {
            kind: 'element',
            tag: 'text',
            props: {
              style: { fontSize: '16px' },
            },
            children: [
              {
                kind: 'text',
                content: 'keep me',
              },
            ],
          },
        ];
      },
    };

    const result = transformHTML('<div>ignored</div>', {
      plugins: {
        extra: [injectStyledTextWrapper],
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('element');
    if (result[0].kind === 'element') {
      expect(result[0].tag).toBe('text');
      expect(result[0].props.style).toEqual({ fontSize: '16px' });
    }
  });
});
