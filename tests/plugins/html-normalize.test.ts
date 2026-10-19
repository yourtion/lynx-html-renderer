import { describe, expect, it } from 'vitest';
import type { HtmlAstNode } from '../../src/ast/types';
import type { TransformContext } from '../../src/transform/types';
import { htmlNormalizePlugin } from '../../src/transform/plugins/normalize/html-normalize.plugin';

function runPlugin(nodes: HtmlAstNode[]): void {
  const ctx = {
    utils: {
      walkAst: (callback: (node: HtmlAstNode) => void) => {
        for (const node of nodes) callback(node);
      },
    },
  };
  htmlNormalizePlugin.apply?.(ctx as unknown as TransformContext);
}

const textNode = (data: string | undefined): HtmlAstNode =>
  ({ type: 'text', data }) as HtmlAstNode;

describe('html-normalize plugin (mutation hardening)', () => {
  it('exposes the expected plugin metadata', () => {
    expect(htmlNormalizePlugin.name).toBe('html-normalize');
    expect(htmlNormalizePlugin.phase).toBe('normalize');
  });

  it.each(['', ' ', '   ', '\n', '\t \n'])(
    'flags pure-whitespace text node %j as isWhitespace',
    (data) => {
      const node = textNode(data);
      runPlugin([node]);
      expect(
        (node as unknown as Record<string, unknown>).isWhitespace,
      ).toBe(true);
    },
  );

  it.each(['a', ' a ', 'word'])(
    'does not flag text node %j with content',
    (data) => {
      const node = textNode(data);
      runPlugin([node]);
      expect(
        (node as unknown as Record<string, unknown>).isWhitespace,
      ).toBeUndefined();
    },
  );

  it('skips text nodes without data', () => {
    const node = textNode(undefined);
    runPlugin([node]);
    expect(
      (node as unknown as Record<string, unknown>).isWhitespace,
    ).toBeUndefined();
  });

  it('leaves non-text nodes untouched', () => {
    const node = { type: 'tag', name: 'div' } as unknown as HtmlAstNode;
    runPlugin([node]);
    expect(
      (node as unknown as Record<string, unknown>).isWhitespace,
    ).toBeUndefined();
  });
});
