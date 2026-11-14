import '@testing-library/jest-dom';
import { transformHTML } from '@lynx-html-renderer/html-parser';
import { createDefaultRegistry } from '@lynx-html-renderer/index';
import '@lynx-html-renderer/index';
import { PapiHTMLRenderer } from '@lynx-html-renderer/papi/PapiHTMLRenderer';
import { extractSlots } from '@lynx-html-renderer/papi/slots';
import {
  AdapterRegistry,
  getAdapterRegistry,
  registerAdapterByRole,
} from '@lynx-html-renderer/render/adapter-registry';
import { normalizeTextTreeForRender } from '@lynx-html-renderer/render/text-normalizer';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';

function makeRegistry(): AdapterRegistry {
  const registry = new AdapterRegistry({
    render: (node) => <view {...node.props} />,
  });
  return registry;
}

describe('extractSlots', () => {
  it('replaces custom-adapter nodes with id placeholders', () => {
    const registry = makeRegistry();
    registry.registerByTag('banner', {
      render: (node) => <view {...node.props} />,
    });
    const tagMappings = {
      banner: {
        lynxTag: 'banner',
        role: 'block',
        capabilities: { layout: 'flex', isVoid: false },
      },
    };
    const nodes = transformHTML(
      '<p>before</p><banner data-x="1" style="margin:8px"><p>inner</p></banner><p>after</p>',
      { tagMappings },
    );

    const { tree, slots } = extractSlots(nodes, registry);

    // 占位保留布局属性（style），丢弃适配器专属属性（data-*）
    const ph = tree[1] as { props: Record<string, unknown> };
    expect(ph.props.style).toBeDefined();
    expect(ph.props['data-x']).toBeUndefined();

    expect(slots).toHaveLength(1);
    expect(slots[0]?.id).toBe('papi-slot-0');
    expect(slots[0]?.node.meta?.sourceTag).toBe('banner');
    // 占位：tag=view、带 id、子树被摘空
    const placeholder = tree[1] as {
      kind: string;
      tag: string;
      props: Record<string, unknown>;
      children: unknown[];
    };
    expect(placeholder.kind).toBe('element');
    expect(placeholder.tag).toBe('view');
    expect(placeholder.props.id).toBe('papi-slot-0');
    expect(placeholder.children).toHaveLength(0);
    // 前后节点保持原位
    expect(tree).toHaveLength(3);
  });

  it('keeps the tree untouched when no custom adapter matches', () => {
    const registry = makeRegistry();
    const nodes = transformHTML('<div><p>plain</p></div>');
    const { tree, slots } = extractSlots(nodes, registry);
    expect(slots).toHaveLength(0);
    expect(tree).toEqual(nodes);
  });

  it('extracts nested matches and preserves outer structure', () => {
    const registry = makeRegistry();
    registry.registerByTag('widget', {
      render: (node) => <view {...node.props} />,
    });
    const tagMappings = {
      widget: {
        lynxTag: 'widget',
        role: 'block',
        capabilities: { layout: 'flex', isVoid: false },
      },
    };
    const nodes = transformHTML(
      '<div><p>a</p><widget><p>w</p></widget><p>b</p></div>',
      { tagMappings },
    );
    const { tree, slots } = extractSlots(nodes, registry);
    expect(slots).toHaveLength(1);
    const outer = tree[0] as { children: unknown[] };
    expect(outer.children).toHaveLength(3);
  });
});

describe('PapiHTMLRenderer adapter portal bridge', () => {
  it('renders custom adapter content into the PAPI placeholder', async () => {
    const registry = makeRegistry();
    registry.registerByTag('banner', {
      render: (node) => (
        <view>
          <text>{`ADAPTER:${String(node.props['data-x'])}`}</text>
        </view>
      ),
    });

    const html = '<p>lead</p><banner data-x="42"></banner><p>tail</p>';
    const { container } = render(
      <PapiHTMLRenderer
        html={html}
        adapterRegistry={registry}
        tagMappings={{
          banner: {
            lynxTag: 'banner',
            role: 'block',
            capabilities: { layout: 'flex', isVoid: false },
          },
        }}
      />,
    );
    // portal 在 slotsReady（builder Promise then）后挂载——等待微任务链
    await new Promise((r) => setTimeout(r, 40));

    // 适配器内容出现（经 createPortal 渲染）
    expect(container.textContent).toContain('ADAPTER:42');
    // PAPI 直绘的其余内容同样在（testing 模拟环境主线程构建）
    expect(container.textContent).toContain('lead');
    expect(container.textContent).toContain('tail');
  });

  it('keeps adapter subtree rendering on the React path (normalize first)', () => {
    // extractSlots 应在 normalizeTextTreeForRender 之后工作（组件内顺序）
    const registry = makeRegistry();
    // role 通道：tagMappings 映射到 view 且带 role，registerByRole 命中
    registry.registerByRole('promo', {
      render: (node) => <view>{String(node.role)}</view>,
    });
    const nodes = transformHTML('<div><promo>x</promo></div>', {
      tagMappings: {
        promo: {
          lynxTag: 'view',
          role: 'promo',
          capabilities: { layout: 'flex', isVoid: false },
        },
      },
    }).map(normalizeTextTreeForRender);
    const { slots } = extractSlots(nodes, registry);
    expect(slots).toHaveLength(1);
  });
});

describe('review regressions', () => {
  it('updates slot content without node-removal errors (P1: portal unmount before rebuild)', async () => {
    const registry = makeRegistry();
    registry.registerByRole('promo', {
      render: (node, ctx) => (
        <view class="promo">
          <text>{`PROMO:${String(node.meta?.sourceAttrs?.title ?? '')}`}</text>
          {ctx.renderChildren(node)}
        </view>
      ),
    });
    const tagMappings = {
      promo: {
        lynxTag: 'view',
        role: 'promo',
        capabilities: { layout: 'flex', isVoid: false },
      },
    };

    const { container, rerender } = render(
      <PapiHTMLRenderer
        html='<p>a</p><promo title="first">v1</promo><p>b</p>'
        adapterRegistry={registry}
        tagMappings={tagMappings}
      />,
    );
    await new Promise((r) => setTimeout(r, 40));
    expect(container.textContent).toContain('PROMO:first');

    // HTML 更新：旧 portal 必须先卸载，主线程才清空重建占位
    rerender(
      <PapiHTMLRenderer
        html='<p>a</p><promo title="second">v2</promo><p>b</p>'
        adapterRegistry={registry}
        tagMappings={tagMappings}
      />,
    );
    await new Promise((r) => setTimeout(r, 60));
    expect(container.textContent).toContain('PROMO:second');
    expect(container.textContent).not.toContain('PROMO:first');
  });

  it('promotes overridden built-in roles to custom (P2: registerByRole clears builtin mark)', () => {
    // 用户 registerByRole 覆盖内置 table → 应视为自定义适配器（进 slot 路径）
    const registry = createDefaultRegistry();
    registry.registerByRole('table', {
      render: () => <text>CUSTOM-TABLE</text>,
    });
    const nodes = transformHTML('<table><tr><td>Cell</td></tr></table>');
    const { slots } = extractSlots(nodes, registry);
    expect(slots).toHaveLength(1);
  });

  it('keeps built-in table roles out of the slot path (P2: builtin vs custom)', () => {
    // 默认 registry 的 table/row/cell 是内置 role，不应视为自定义适配器
    const nodes = transformHTML('<table><tr><td>Cell</td></tr></table>');
    const { slots } = extractSlots(nodes, createDefaultRegistry());
    expect(slots).toHaveLength(0);
  });

  it('global registry registrations apply when adapterRegistry is omitted (P2: parity)', async () => {
    // HTMLRenderer 主入口导入即初始化全局 registry；registerAdapterByRole
    // 的全局注册对 PAPI 路线同样生效（无需显式传 adapterRegistry）
    registerAdapterByRole('banner-global', {
      render: () => <text>GLOBAL-BANNER</text>,
    });
    const html = '<div><span>lead</span></div>';
    const nodes = transformHTML(html, {
      tagMappings: {
        div: {
          lynxTag: 'view',
          role: 'banner-global',
          capabilities: { layout: 'flex', isVoid: false },
        },
      },
    });
    const { slots } = extractSlots(nodes, getAdapterRegistry());
    expect(slots).toHaveLength(1);
  });
});
