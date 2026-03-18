import { describe, expect, it } from 'vitest';
import { normalizeTextTreeForRender } from '../../src/render/text-normalizer';
import type { LynxElementNode } from '../../src/render/types';

describe('text normalizer for render', () => {
  it('should merge text wrapper props into a text node before rendering', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: {
        className: 'heading',
        style: {
          fontSize: '16px',
          marginBottom: '1em',
        },
      },
      children: [
        {
          kind: 'text',
          content: 'hello',
          inheritableClasses: 'leaf',
        },
      ],
    };

    const result = normalizeTextTreeForRender(node);

    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.inheritableClasses).toBe('heading leaf');
      expect(result.inheritableStyles).toEqual({ fontSize: '16px' });
    }
  });

  it('should collapse nested text elements before rendering', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: { className: 'outer' },
      children: [
        {
          kind: 'element',
          tag: 'text',
          props: { className: 'inner' },
          children: [
            {
              kind: 'text',
              content: 'content',
            },
          ],
        },
      ],
    };

    const result = normalizeTextTreeForRender(node);

    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.inheritableClasses).toBe('outer inner');
    }
  });
});
