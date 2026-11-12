import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transformHTML } from '@lynx-html-renderer/html-parser';
import {
  serializeNodes,
  styleToCssString,
} from '@lynx-html-renderer/papi/serialize';
import { describe, expect, it } from 'vitest';

describe('styleToCssString', () => {
  it('converts camelCase keys to kebab-case', () => {
    expect(
      styleToCssString({ fontSize: '16px', fontWeight: 'bold', color: '#333' }),
    ).toBe('font-size:16px;font-weight:bold;color:#333;');
  });

  it('returns undefined for empty or missing style', () => {
    expect(styleToCssString(undefined)).toBeUndefined();
    expect(styleToCssString({})).toBeUndefined();
  });

  it('stringifies number values', () => {
    expect(styleToCssString({ flexShrink: 0 })).toBe('flex-shrink:0;');
  });
});

describe('serializeNodes', () => {
  it('serializes simple paragraph with inline styles', () => {
    const nodes = transformHTML(
      '<p style="color:red;font-size:18px;">Hello</p>',
    );
    const tree = serializeNodes(nodes);

    // 管道为 p 注入默认样式（margin-bottom）并映射为 text 容器
    expect(tree).toHaveLength(1);
    const root = tree[0];
    if (root.kind !== 'element') throw new Error('expected element');
    expect(root.tg).toBe('text');
    expect(root.st).toContain('color:red;');
    expect(root.st).toContain('font-size:18px;');
    expect(root.st).toContain('margin-bottom:1em;');
    const child = root.k?.[0];
    if (child?.kind !== 'text') throw new Error('expected text child');
    expect(child.v).toBe('Hello');
    expect(child.st).toContain('color:red;');
    expect(child.st).toContain('font-size:18px;');
  });

  it('serializes bold text with mark styles merged into text node', () => {
    const nodes = transformHTML('<strong>Bold</strong>');
    const tree = serializeNodes(nodes);

    expect(tree).toEqual([
      {
        kind: 'text',
        v: 'Bold',
        st: 'font-weight:bold;',
        cl: undefined,
      },
    ]);
  });

  it('serializes image with src attribute', () => {
    const nodes = transformHTML(
      '<img src="https://example.com/a.png" style="width:100px" />',
    );
    const tree = serializeNodes(nodes);

    expect(tree).toEqual([
      {
        kind: 'element',
        tg: 'image',
        // 管道为 img 自动补 height:auto
        st: 'width:100px;height:auto;',
        cl: undefined,
        at: { src: 'https://example.com/a.png' },
        k: undefined,
      },
    ]);
  });

  it('preserves nesting structure', () => {
    const nodes = transformHTML(
      '<div><p>One</p><p>Two <em>emph</em></p></div>',
    );
    const tree = serializeNodes(nodes);

    expect(tree).toHaveLength(1);
    const root = tree[0];
    if (root.kind !== 'element') throw new Error('expected element root');
    expect(root.tg).toBe('view');
    expect(root.k).toHaveLength(2);
    const second = root.k?.[1];
    if (!second || second.kind !== 'element') {
      throw new Error('expected element');
    }
    // text + em 内联文本
    expect(second.k).toHaveLength(2);
    const emText = second.k?.[1];
    if (emText?.kind !== 'text') throw new Error('expected text');
    // em 文本继承管道注入的默认文本色
    expect(emText.st).toContain('font-style:italic;');
  });

  it('produces JSON-cloneable output (cross-thread safe)', () => {
    const nodes = transformHTML(
      '<div style="padding:4px"><span>A</span><img src="/b.png"/></div>',
    );
    const tree = serializeNodes(nodes);
    expect(() => JSON.parse(JSON.stringify(tree))).not.toThrow();
  });
});

describe('buildPapiTree source contract', () => {
  // buildPapiTree 是 worklet（'main thread' 指令），在 vitest 中被编译为
  // worklet 对象无法直调；行为验证由双线程集成测试与真机完成。这里锁定
  // 源码契约，防止重构时破坏 worklet 自包含性或遗漏关键 Element API。
  const source = readFileSync(
    resolve(__dirname, '../src/papi/builder.ts'),
    'utf-8',
  );

  it('declares the main thread directive', () => {
    expect(source).toContain("'main thread'");
  });

  it('guards against engines without Element API', () => {
    expect(source).toContain("typeof g.__CreateView !== 'function'");
  });

  it('accesses Element API via globalThis (no free-variable capture)', () => {
    // 裸引用 __Xxx 会被编译器捕获进 worklet _c 对象，在 background 加载时崩溃
    const body = source.slice(source.indexOf("'main thread'"));
    expect(body).not.toMatch(/[^.$_]__Create(View|Text|Image)\(/);
    expect(source).toContain(
      'globalThis as unknown as Record<string, unknown>',
    );
  });

  it('uses the core Element PAPI surface', () => {
    for (const api of [
      '__GetElementUniqueID',
      '__FirstElement',
      '__RemoveElement',
      '__CreateText',
      '__CreateRawText',
      '__CreateImage',
      '__CreateView',
      '__SetInlineStyles',
      '__SetClasses',
      '__SetAttribute',
      '__AppendElement',
      '__FlushElementTree',
    ]) {
      expect(source).toContain(api);
    }
  });

  it('stays self-contained for cross-thread serialization (type-only imports)', () => {
    const imports = source.match(/^import .+$/gm) ?? [];
    for (const line of imports) {
      expect(line.startsWith('import type ')).toBe(true);
    }
  });

  it('walks the serialized object tree recursively', () => {
    expect(source).toContain('appendNode');
    expect(source).toContain('node.k');
    expect(source).toContain('node.kind');
  });
});
