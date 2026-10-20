import { describe, expect, it } from 'vitest';
import type {
  LynxElementNode,
  LynxNode,
  NodeCapabilityHandler,
} from '../../src/lynx/types';
import { layoutCapabilityPlugin } from '../../src/transform/plugins/capability/layout-capability.plugin';
import { mediaCapabilityPlugin } from '../../src/transform/plugins/capability/media-capability.plugin';
import type { TransformContext } from '../../src/transform/types';

const stubCtx = {} as TransformContext;

function getHandler(
  plugin: typeof layoutCapabilityPlugin,
  tag: string,
): NodeCapabilityHandler {
  const handlers = plugin.registerCapabilityHandlers?.(stubCtx);
  const handler = handlers?.get(tag);
  if (!handler) throw new Error(`no handler registered for tag ${tag}`);
  return handler;
}

const elementNode = (
  overrides: Partial<LynxElementNode> = {},
): LynxElementNode => ({
  kind: 'element',
  tag: 'view',
  props: {},
  children: [],
  ...overrides,
});

describe('layout-capability plugin (mutation hardening)', () => {
  it('exposes the expected plugin metadata', () => {
    expect(layoutCapabilityPlugin.name).toBe('layout-capability');
    expect(layoutCapabilityPlugin.phase).toBe('capability');
  });

  it('registers exactly one handler per element tag', () => {
    const handlers =
      layoutCapabilityPlugin.registerCapabilityHandlers?.(stubCtx);
    expect([...(handlers?.keys() ?? [])].sort()).toEqual([
      'frame',
      'image',
      'text',
      'view',
    ]);
  });

  it('assigns flex layout defaults to elements without capabilities', () => {
    for (const tag of ['view', 'text', 'image', 'frame']) {
      const node = elementNode({ tag });
      getHandler(layoutCapabilityPlugin, tag)(node, stubCtx);
      expect(node.capabilities, `tag ${tag}`).toEqual({
        layout: 'flex',
        isVoid: false,
      });
    }
  });

  it('preserves capabilities that already exist', () => {
    const existing = { layout: 'inline' as const, isVoid: true };
    const node = elementNode({ capabilities: existing });
    getHandler(layoutCapabilityPlugin, 'view')(node, stubCtx);
    expect(node.capabilities).toBe(existing);
  });

  it('ignores non-element nodes', () => {
    const node: LynxNode = { kind: 'text', content: 'x' };
    getHandler(layoutCapabilityPlugin, 'view')(node, stubCtx);
    expect((node as LynxElementNode).capabilities).toBeUndefined();
  });
});

describe('media-capability plugin (mutation hardening)', () => {
  const imgNode = (sourceAttrs: Record<string, string>): LynxElementNode =>
    elementNode({
      tag: 'image',
      meta: { sourceTag: 'img', sourceAttrs },
    });

  const run = (node: LynxElementNode): LynxElementNode => {
    getHandler(mediaCapabilityPlugin, 'image')(node, stubCtx);
    return node;
  };

  it('exposes the expected plugin metadata', () => {
    expect(mediaCapabilityPlugin.name).toBe('media-capability');
  });

  it('ignores image nodes not originating from <img>', () => {
    const node = elementNode({
      tag: 'image',
      meta: { sourceTag: 'video', sourceAttrs: { src: 'v.mp4' } },
    });
    run(node);
    expect(node.props.src).toBeUndefined();
    expect(node.props.style).toBeUndefined();
  });

  it('ignores image nodes without meta', () => {
    const node = elementNode({ tag: 'image' });
    expect(() => run(node)).not.toThrow();
    expect(node.props.src).toBeUndefined();
  });

  it('ignores img nodes without source attributes', () => {
    const node = elementNode({ tag: 'image', meta: { sourceTag: 'img' } });
    run(node);
    expect(node.props.src).toBeUndefined();
    expect(node.props.style).toBeUndefined();
  });

  it('ignores img nodes whose source attributes lack src', () => {
    const node = imgNode({ alt: 'no src' });
    run(node);
    expect(node.props.src).toBeUndefined();
    expect(node.props.style).toBeUndefined();
  });

  it('sets src and falls back to default sizing without dimensions', () => {
    const node = run(imgNode({ src: 'a.png' }));
    expect(node.props.src).toBe('a.png');
    expect(node.props.style).toEqual({ width: '100%', height: 'auto' });
  });

  it('prefers width/height HTML attributes over the style attribute', () => {
    const node = run(
      imgNode({
        src: 'a.png',
        width: '200',
        height: '100',
        style: 'width: 9px; height: 9px',
      }),
    );
    expect(node.props.style).toEqual({ width: '200', height: '100' });
  });

  it('extracts both dimensions from the style attribute when absent as attributes', () => {
    const node = run(
      imgNode({ src: 'a.png', style: 'width: 50px; height: 60px' }),
    );
    expect(node.props.style).toEqual({ width: '50px', height: '60px' });
  });

  it('fills only the missing dimension from the style attribute', () => {
    const node = run(
      imgNode({ src: 'a.png', height: '100', style: 'width: 50px' }),
    );
    expect(node.props.style).toEqual({ width: '50px', height: '100' });
  });

  it('keeps pre-existing styles and only adds dimensions', () => {
    const node = imgNode({ src: 'a.png' });
    node.props.style = { borderRadius: '4px' };
    run(node);
    expect(node.props.style).toEqual({
      borderRadius: '4px',
      width: '100%',
      height: 'auto',
    });
  });

  it('never lets the style attribute override an explicit width attribute', () => {
    const node = run(
      imgNode({
        src: 'a.png',
        width: '200',
        style: 'width: 9px; height: 60px',
      }),
    );
    expect(node.props.style).toEqual({ width: '200', height: '60px' });
  });

  it('falls back to defaults for the dimension missing everywhere', () => {
    const node = run(imgNode({ src: 'a.png', width: '200' }));
    expect(node.props.style).toEqual({ width: '200', height: 'auto' });
  });
});
