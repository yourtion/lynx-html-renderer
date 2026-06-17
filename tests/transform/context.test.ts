import { describe, expect, it, vi } from 'vitest';
import type { LynxElementNode, LynxNode } from '../../src/lynx/types';
import { createTransformContext } from '../../src/transform/context';

describe('TransformContext', () => {
  const mockAst = { type: 'root', children: [] } as never;
  const mockRoot: LynxElementNode = {
    kind: 'element',
    tag: 'root',
    props: {},
    children: [],
  };

  it('should create context with ast and root', () => {
    const ctx = createTransformContext(mockAst, mockRoot);
    expect(ctx.ast).toBe(mockAst);
    expect(ctx.root).toBe(mockRoot);
  });

  it('should have default metadata', () => {
    const ctx = createTransformContext(mockAst, mockRoot);
    expect(ctx.metadata.removeAllClass).toBe(true);
    expect(ctx.metadata.removeAllStyle).toBe(false);
    expect(ctx.metadata.styleMode).toBe('inline');
  });

  it('should allow updating root', () => {
    const ctx = createTransformContext(mockAst, mockRoot);
    const newRoot: LynxNode = { kind: 'text', content: 'new' };
    ctx.root = newRoot;
    expect(ctx.root).toBe(newRoot);
  });

  describe('utils', () => {
    it('should create element node with createNode', () => {
      const ctx = createTransformContext(mockAst, mockRoot);
      const node = ctx.utils.createNode({ tag: 'view' });
      if (node.kind === 'element') {
        expect(node.tag).toBe('view');
        expect(node.children).toEqual([]);
      }
    });

    it('should replace a node with replaceNode', () => {
      const child: LynxNode = { kind: 'text', content: 'old' };
      const root: LynxElementNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [child],
      };
      const ctx = createTransformContext(mockAst, root);
      const replacement: LynxNode = { kind: 'text', content: 'new' };
      ctx.utils.replaceNode(child, replacement);
      expect(root.children[0]).toBe(replacement);
    });

    it('should register and use handlers', () => {
      const ctx = createTransformContext(mockAst, mockRoot);
      const handler = vi.fn();
      ctx.utils.registerHandler('text', handler);
      expect(ctx._handlerRegistry.get('text')).toEqual([handler]);
    });

    it('should append multiple handlers for same key', () => {
      const ctx = createTransformContext(mockAst, mockRoot);
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      ctx.utils.registerHandler('text', handler1);
      ctx.utils.registerHandler('text', handler2);
      expect(ctx._handlerRegistry.get('text')).toEqual([handler1, handler2]);
    });
  });
});
