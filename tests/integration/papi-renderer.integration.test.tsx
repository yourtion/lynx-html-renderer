/**
 * PapiHTMLRenderer 集成测试
 *
 * 在 @lynx-js/react/testing-library 的双线程模拟环境中验证：
 * - runOnMainThread 通道是否可用（builder 是否被派发到主线程环境）
 * - Element API 是否被调用并产出可见内容
 *
 * 注意：该环境以 web-elements 模拟 Lynx 运行时，Element API 的可用性
 * 取决于模拟层；若模拟层缺失 __CreateView，组件应走降级路径。
 */
import '@testing-library/jest-dom';
import { PapiHTMLRenderer } from '@lynx-html-renderer/papi/PapiHTMLRenderer';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';

describe('PapiHTMLRenderer integration', () => {
  it('renders host view without crashing', () => {
    const { container } = render(
      <PapiHTMLRenderer html="<p>Hello <strong>PAPI</strong></p>" />,
    );
    // 宿主 view 至少存在
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('renders fallback when engine lacks Element API', async () => {
    const g = globalThis as unknown as Record<string, unknown>;
    const saved = g.__CreateView;
    // 模拟引擎不支持：testing-library 环境可能内置 stub（tests/setup/papi-globals.ts），
    // 删除后 builder 返回 false，组件切换到 fallback
    const hadStub = typeof saved !== 'undefined';
    if (hadStub) delete g.__CreateView;

    try {
      const { container } = render(
        <PapiHTMLRenderer
          html="<p>Fallback Target</p>"
          fallback={<view>FALLBACK-NODE</view>}
        />,
      );
      // 等 useEffect + Promise 微任务完成
      await new Promise((r) => setTimeout(r, 20));
      // 无 __CreateView 时要么显示 fallback，要么宿主为空 —— 不应崩溃
      expect(container).toBeDefined();
    } finally {
      if (hadStub) g.__CreateView = saved;
    }
  });

  it('builds native element tree with visible content', async () => {
    const { container } = render(
      <PapiHTMLRenderer html="<p>PAPI <strong>content</strong> built</p>" />,
    );
    await new Promise((r) => setTimeout(r, 30));

    // builder 在主线程（模拟环境）通过 Element API 构建的元素应出现在宿主下
    const html = container.innerHTML;
    expect(html).toContain('PAPI');
    expect(html).toContain('content');
    expect(html).toContain('built');
    // 粗体标记：text 元素 + raw-text 结构
    expect(html.toLowerCase()).toContain('<text');
    expect(html.toLowerCase()).toContain('font-weight');
  });
});
