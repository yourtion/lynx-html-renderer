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

  it('renders the fallback node when the builder resolves false', async () => {
    // builder 注入返回 false（引擎缺 Element API 等场景）→ 组件降级渲染 fallback
    const rejectingBuilder = (): boolean => false;
    const { container } = render(
      <PapiHTMLRenderer
        html="<p>Fallback Target</p>"
        fallback={<view>FALLBACK-NODE</view>}
        builder={rejectingBuilder}
      />,
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(container.textContent).toContain('FALLBACK-NODE');
  });

  it('renders the fallback node when the dispatch rejects', async () => {
    const throwingBuilder = (): boolean => {
      throw new Error('engine missing');
    };
    const { container } = render(
      <PapiHTMLRenderer
        html="<p>Reject Target</p>"
        fallback={<view>REJECT-FALLBACK</view>}
        builder={throwingBuilder}
      />,
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(container.textContent).toContain('REJECT-FALLBACK');
  });

  it('applies css-class root classes for dark mode and honors hostClassName', async () => {
    const { container: light } = render(
      <PapiHTMLRenderer html="<p>css-class light</p>" styleMode="css-class" />,
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(light.innerHTML).toContain('class="lynx-html-renderer"');

    const { container: dark } = render(
      <PapiHTMLRenderer
        html="<p>css-class dark</p>"
        styleMode="css-class"
        darkMode
      />,
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(dark.innerHTML).toContain('lynx-html-renderer lhr-dark');

    const { container: custom } = render(
      <PapiHTMLRenderer
        html="<p>custom host</p>"
        styleMode="css-class"
        darkMode
        hostClassName="my-host"
      />,
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(custom.innerHTML).toContain('my-host');
    expect(custom.innerHTML).not.toContain('lhr-dark');
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
