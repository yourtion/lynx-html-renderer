import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../src/html-parser';
import type { LynxNode, LynxTextNode } from '../../src/lynx/types';
import { listStructurePlugin } from '../../src/transform/plugins/structure/list-structure.plugin';

function collectTexts(
  node: LynxNode,
  acc: LynxTextNode[] = [],
): LynxTextNode[] {
  if (node.kind === 'text') acc.push(node);
  if (node.kind === 'element')
    for (const c of node.children) collectTexts(c, acc);
  return acc;
}

describe('list-structure plugin (mutation hardening)', () => {
  it.each([
    ['<ol start="5"><li>a</li><li>b</li></ol>', ['5. a', '6. b']],
    [
      '<ol reversed><li>a</li><li>b</li><li>c</li></ol>',
      ['3. a', '2. b', '1. c'],
    ],
    [
      '<ol start="5" reversed><li>a</li><li value="9">b</li><li>c</li></ol>',
      ['5. a', '9. b', '8. c'],
    ],
    [
      '<ol start="0"><li>a</li><li value="-2">b</li><li>c</li></ol>',
      ['0. a', '-2. b', '-1. c'],
    ],
    ['<ol start="bad"><li>a</li><li value="2.5">b</li></ol>', ['1. a', '2. b']],
    [
      '<ol reversed><li>a<ol start="7"><li>b</li></ol></li><li>c</li></ol>',
      ['2. a', '7. b', '1. c'],
    ],
    [
      '<ol reversed><div>x</div><li>a</li><li>b</li></ol>',
      ['x', '2. a', '1. b'],
    ],
    [
      '<ul start="5" reversed><li value="9">a</li><li>b</li></ul>',
      ['• a', '• b'],
    ],
  ])('honors list numbering for %s', (html, expected) => {
    expect(collectTexts(transformHTML(html)[0]).map((t) => t.content)).toEqual(
      expected,
    );
  });

  it('exposes the expected plugin metadata', () => {
    expect(listStructurePlugin.name).toBe('list-structure');
    expect(listStructurePlugin.phase).toBe('structure');
  });

  it('does not add markers to li elements outside a list', () => {
    const roots = transformHTML('<div><li>x</li></div>');
    const texts = collectTexts(roots[0]).map((t) => t.content);
    expect(texts).toEqual(['x']);
  });

  it('merges unordered markers into the first text of each li', () => {
    const roots = transformHTML('<ul><li>甲</li><li>乙</li></ul>');
    const texts = collectTexts(roots[0]).map((t) => t.content);
    expect(texts).toEqual(['• 甲', '• 乙']);
  });

  it('numbers ordered markers incrementally', () => {
    const roots = transformHTML('<ol><li>a</li><li>b</li><li>c</li></ol>');
    const texts = collectTexts(roots[0]).map((t) => t.content);
    expect(texts).toEqual(['1. a', '2. b', '3. c']);
  });

  it('prepends a standalone marker node when li has no text descendant', () => {
    const roots = transformHTML('<ul><li><img src="a.png"></li></ul>');
    const list = roots[0];
    if (list.kind !== 'element') throw new Error('expected element root');
    const li = list.children[0];
    if (li.kind !== 'element') throw new Error('expected li element');
    const firstChild = li.children[0];
    expect(firstChild.kind).toBe('text');
    expect((firstChild as LynxTextNode).content).toBe('• ');
    expect((firstChild as LynxTextNode).meta?.source).toBe('li-marker');
  });

  it('finds inline text nested inside formatted li content', () => {
    const roots = transformHTML('<ul><li><strong>deep</strong></li></ul>');
    const texts = collectTexts(roots[0]).map((t) => t.content);
    expect(texts).toEqual(['• deep']);
  });

  it('processes nested lists independently', () => {
    const roots = transformHTML('<ul><li>a<ul><li>b</li></ul></li></ul>');
    const texts = collectTexts(roots[0]).map((t) => t.content);
    expect(texts).toEqual(['• a', '• b']);
  });

  it('leaves non-li children of the list untouched', () => {
    const roots = transformHTML('<ul><li>x</li><div>y</div></ul>');
    const texts = collectTexts(roots[0]).map((t) => t.content);
    expect(texts).toEqual(['• x', 'y']);
  });

  it('numbers nested ordered lists from their own counter', () => {
    const roots = transformHTML(
      '<ol><li>a<ol><li>b</li><li>c</li></ol></li></ol>',
    );
    const texts = collectTexts(roots[0]).map((t) => t.content);
    expect(texts).toEqual(['1. a', '1. b', '2. c']);
  });
});
