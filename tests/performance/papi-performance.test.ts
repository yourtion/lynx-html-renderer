import { transformHTML } from '@lynx-html-renderer/html-parser';
import { createDefaultRegistry } from '@lynx-html-renderer/index';
import type { LynxNode } from '@lynx-html-renderer/lynx/types';
import { serializeNodes } from '@lynx-html-renderer/papi/serialize';
import { createRenderContext } from '@lynx-html-renderer/render/react-tree';
import { normalizeTextTreeForRender } from '@lynx-html-renderer/render/text-normalizer';
import { describe, it } from 'vitest';

/**
 * PAPI 直绘 vs ReactLynx 组件树 前置链路性能对比。
 *
 * 两条路线共享 transformHTML；差异在渲染前置阶段：
 * - PAPI：serializeNodes（LynxNode → 可结构化克隆的精简树）
 * - React：renderHTMLDirect（递归 createElement 构建 React 元素树）
 *
 * 主线程 Element API 构建开销无法在本环境测量（需要真实引擎），
 * 本基准衡量的是 background 线程的可量化差异。
 */

function generateHTML(paragraphs: number): string {
  let html = '<article style="padding: 20px; line-height: 1.6;">';
  for (let i = 0; i < paragraphs; i++) {
    html += `<p style="color: #333; margin-bottom: 1em;">Paragraph ${i} with <strong>bold</strong> and <em>italic</em> and <code>code</code> text.</p>`;
  }
  return `${html}</article>`;
}

function measure<T>(
  fn: () => T,
  iterations: number,
): { ms: number; result: T } {
  fn(); // warmup
  const start = performance.now();
  let result: T = undefined as unknown as T;
  for (let i = 0; i < iterations; i++) {
    result = fn();
  }
  return { ms: performance.now() - start, result };
}

describe('PAPI direct-draw vs React element tree (pre-render cost)', () => {
  const sizes = [50, 200, 800];

  for (const size of sizes) {
    it(`reports background-thread cost @ ${size} paragraphs`, () => {
      const html = generateHTML(size);
      const nodes = transformHTML(html).map(normalizeTextTreeForRender);
      const iterations = 20;

      const papi = measure(() => serializeNodes(nodes), iterations);
      // React 侧与 PAPI 侧同基准：对同一份预转换 nodes 计时
      // （renderHTMLDirect 会重复执行 transformHTML，口径不对称）
      const registry = createDefaultRegistry();
      const reactCtx = createRenderContext(registry);
      const react = measure(
        () => nodes.map((n) => reactCtx.renderNode(n)),
        iterations,
      );

      // 序列化体积（跨线程传输成本）
      const wireBytes = JSON.stringify(papi.result).length;

      console.info(
        `[perf@${size}p] serialize: ${papi.ms.toFixed(2)}ms | ` +
          `react-tree: ${react.ms.toFixed(2)}ms | ` +
          `ratio: ${(react.ms / Math.max(papi.ms, 0.001)).toFixed(1)}x | ` +
          `wire: ${(wireBytes / 1024).toFixed(1)}KB | ` +
          `nodes: ${countNodes(nodes)}`,
      );
    });
  }
});

function countNodes(nodes: LynxNode[]): number {
  let n = 0;
  const walk = (list: LynxNode[]) => {
    for (const node of list) {
      n++;
      if (node.kind === 'element') walk(node.children);
    }
  };
  walk(nodes);
  return n;
}
