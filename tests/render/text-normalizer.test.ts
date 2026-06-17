import { describe, expect, it } from 'vitest';
import { normalizeTextTreeForRender } from '../../src/render/text-normalizer';
import type { LynxElementNode, LynxNode } from '../../src/render/types';

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

  it('should return non-element nodes unchanged', () => {
    const textNode: LynxNode = { kind: 'text', content: 'plain' };
    expect(normalizeTextTreeForRender(textNode)).toBe(textNode);
  });

  it('should return non-text element unchanged', () => {
    const viewNode: LynxNode = {
      kind: 'element',
      tag: 'view',
      props: {},
      children: [],
    };
    expect(normalizeTextTreeForRender(viewNode)).toEqual(viewNode);
  });

  it('should return text element without className or style unchanged', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: {},
      children: [{ kind: 'text', content: 'plain' }],
    };
    const result = normalizeTextTreeForRender(node);
    expect(result.kind).toBe('element');
  });

  it('should return text element with multiple children unchanged', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: { className: 'multi' },
      children: [
        { kind: 'text', content: 'a' },
        { kind: 'text', content: 'b' },
      ],
    };
    const result = normalizeTextTreeForRender(node);
    expect(result.kind).toBe('element');
  });

  it('should handle child that is element but not text tag', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: { className: 'wrap' },
      children: [
        {
          kind: 'element',
          tag: 'view',
          props: {},
          children: [],
        },
      ],
    };
    const result = normalizeTextTreeForRender(node);
    expect(result.kind).toBe('element');
  });

  it('should merge text child with parent style only (no parent className)', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: {
        style: { fontWeight: 'bold' },
      },
      children: [
        {
          kind: 'text',
          content: 'styled',
          inheritableClasses: 'existing',
        },
      ],
    };
    const result = normalizeTextTreeForRender(node);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.inheritableClasses).toBe('existing');
      expect(result.inheritableStyles).toEqual({ fontWeight: 'bold' });
    }
  });

  it('should preserve child inheritableStyles when parent has no inheritable styles', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: {
        style: { flexDirection: 'row' },
        className: 'cls',
      },
      children: [
        {
          kind: 'text',
          content: 'text',
          inheritableStyles: { color: 'red' },
          inheritableClasses: 'child-cls',
        },
      ],
    };
    const result = normalizeTextTreeForRender(node);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.inheritableStyles).toEqual({ color: 'red' });
    }
  });

  it('should merge nested text element with parent style and className', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: {
        style: { fontSize: '14px' },
        className: 'parent-cls',
      },
      children: [
        {
          kind: 'element',
          tag: 'text',
          props: {
            style: { color: 'blue' },
            className: 'child-cls',
          },
          children: [{ kind: 'text', content: 'deep' }],
        },
      ],
    };
    const result = normalizeTextTreeForRender(node);
    // After mergeTextElementWithParentProps and recursive normalize:
    // the inner text element becomes a text node
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.content).toBe('deep');
    }
  });

  it('should merge nested text element without parent style', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: {
        className: 'outer',
      },
      children: [
        {
          kind: 'element',
          tag: 'text',
          props: {
            className: 'inner',
          },
          children: [{ kind: 'text', content: 'merged' }],
        },
      ],
    };
    const result = normalizeTextTreeForRender(node);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.content).toBe('merged');
    }
  });

  it('should recursively normalize children of non-text elements', () => {
    const node: LynxElementNode = {
      kind: 'element',
      tag: 'view',
      props: {},
      children: [
        {
          kind: 'element',
          tag: 'text',
          props: { className: 'inner' },
          children: [{ kind: 'text', content: 'nested' }],
        },
      ],
    };
    const result = normalizeTextTreeForRender(node);
    expect(result.kind).toBe('element');
    if (result.kind === 'element') {
      expect(result.children[0].kind).toBe('text');
    }
  });
});
