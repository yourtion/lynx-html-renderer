import { describe, expect, it } from 'vitest';
import { normalizeTextTreeForRender } from '../../src/render/text-normalizer';
import type { LynxElementNode, LynxNode } from '../../src/render/types';

function wrapper(
  props: LynxElementNode['props'],
  role?: string,
): LynxElementNode {
  return {
    kind: 'element',
    tag: 'text',
    props,
    role,
    children: [
      { kind: 'text', content: 'T', inheritableStyles: { color: 'blue' } },
    ],
  };
}

describe('Text normalization preserves visible semantics', () => {
  it('collapses a style-only inline wrapper while preserving child priority', () => {
    const result = normalizeTextTreeForRender(
      wrapper({ style: { color: 'red', fontSize: '16px' } }, 'inline'),
    );
    expect(result).toMatchObject({
      kind: 'text',
      inheritableStyles: { color: 'blue', fontSize: '16px' },
    });
  });

  it.each([
    'marginBottom',
    'padding',
    'backgroundColor',
    'borderWidth',
    'flexDirection',
  ])('retains a container with %s', (property) => {
    const node = wrapper({ style: { [property]: '8px' } });
    const result = normalizeTextTreeForRender(node);
    expect(result).toEqual(node);
  });

  it.each(['textContainer', 'block', 'business'])(
    'retains semantic %s containers',
    (role) => {
      const node = wrapper({ style: { color: 'red' } }, role);
      expect(normalizeTextTreeForRender(node)).toEqual(node);
    },
  );

  it.each([
    { className: 'business' },
    { 'data-href': '/next' },
    { onTap: () => {} },
  ])('retains class and interaction props %j', (props) => {
    const node = wrapper(props);
    expect(normalizeTextTreeForRender(node)).toEqual(node);
  });

  it('preserves nested independent containers', () => {
    const child = wrapper(
      { style: { margin: '20px', color: 'blue' } },
      'textContainer',
    );
    const parent: LynxElementNode = {
      kind: 'element',
      tag: 'text',
      props: { style: { color: 'red' } },
      children: [child],
    };
    const result = normalizeTextTreeForRender(parent);
    expect(result).toMatchObject({
      kind: 'element',
      role: 'textContainer',
      props: { style: { margin: '20px', color: 'blue' } },
    });
  });

  it('retains multiple fragments and non-text elements', () => {
    const node = wrapper({});
    node.children.push({ kind: 'text', content: 'U' });
    expect(normalizeTextTreeForRender(node)).toEqual(node);
    const view: LynxNode = { ...node, tag: 'view' };
    expect(normalizeTextTreeForRender(view)).toEqual(view);
  });

  it('returns text leaves unchanged', () => {
    const text: LynxNode = { kind: 'text', content: 'T' };
    expect(normalizeTextTreeForRender(text)).toBe(text);
  });
});
