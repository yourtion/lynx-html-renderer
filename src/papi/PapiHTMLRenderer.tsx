/**
 * Element PAPI 直绘版 HTML 渲染组件（方案 C 原型）。
 *
 * 与 `HTMLRenderer` 共享同一 HTML→LynxNode 转换管道，
 * 区别在渲染层：跳过 ReactLynx 组件树，把序列化树发送到主线程，
 * 直接通过 Element PAPI（`__CreateView` 等）构建原生元素树。
 *
 * 引擎要求：Element API 完整可用（参考 @lynx-js/genui 标注的 4.2+）。
 * 引擎不支持时自动降级到 `fallback` 节点。
 */

import {
  createPortal,
  runOnMainThread,
  useMainThreadRef,
} from '@lynx-js/react';
import type { MainThread } from '@lynx-js/types';
import React, { useEffect, useId, useMemo, useState } from 'react';
import { transformHTML } from '../html-parser';
import type { LynxNode } from '../lynx/types';
import type { AdapterRegistry } from '../render/adapter-registry';
import { createRenderContext } from '../render/react-tree';
import { normalizeTextTreeForRender } from '../render/text-normalizer';
import type { TransformOptions } from '../transform/types';
import { buildPapiTree } from './builder';
import { serializeNodes } from './serialize';
import type { PapiSlot } from './slots';
import { extractSlots } from './slots';
import type { PapiTree } from './types';

/**
 * 主线程构建器签名。注意：'main thread' worklet 必须能被消费方的
 * ReactLynx 编译链处理——当前工具链（react-rsbuild-plugin ≤ 0.22.x）
 * 只对项目自身源码做 worklet 提取，第三方库源码中的 worklet 不会被
 * 正确编译。因此在消费方项目中定义 builder 并通过 props 注入是
 * 推荐用法（见 README「注入构建器」），库内默认实现供支持的场景使用。
 */
export type PapiBuilder = (
  hostRef: { current: unknown },
  roots: PapiTree,
) => boolean;

export interface PapiHTMLRendererProps
  extends Pick<
    TransformOptions,
    'plugins' | 'tagMappings' | 'unknownTagPolicy'
  > {
  /** HTML 字符串输入 */
  html: string;
  /** 是否移除所有 class 属性（默认: true） */
  removeAllClass?: boolean;
  /** 是否移除所有 style 属性（默认: false） */
  removeAllStyle?: boolean;
  /** 自定义链接样式 */
  linkStyle?: Record<string, string | number>;
  /** 启用 transform 调试日志与指标采集（默认: false） */
  debug?: boolean;
  /** 样式模式: 'inline' 内联样式 或 'css-class' CSS类模式（默认: 'inline'）。
   * css-class 模式节点带 lhr-* 类名，样式表由页面级 CSS 提供
   * （generateCSS() 或 import 'lynx-html-renderer/dist/styles.css'），
   * class 经引擎样式系统解析，与 ReactLynx 路线一致。 */
  styleMode?: 'inline' | 'css-class';
  /** 是否启用暗色模式（css-class 模式下为宿主追加 lhr-dark 类，默认: false） */
  darkMode?: boolean;
  /** css-class 模式根容器 class（默认: 'lynx-html-renderer'） */
  rootClassName?: string;
  /** 宿主 view 的 class（显式指定时优先于 darkMode/rootClassName 组合） */
  hostClassName?: string;
  /** 宿主 view 的内联样式 */
  hostStyle?: Record<string, string | number>;
  /** 引擎不支持 Element API 时的降级渲染节点 */
  fallback?: React.ReactNode;
  /**
   * 主线程构建器注入（推荐）：在消费方源码中定义 `'main thread'` worklet
   * 并传入，规避编译链对第三方库源码不做 worklet 提取的限制。
   * 缺省使用库内 buildPapiTree（要求消费方工具链能编译库源码 worklet）。
   */
  builder?: PapiBuilder;
  /**
   * 适配器注册表：命中的自定义适配器（registerByTag/ByRole）子树不进
   * PAPI 直绘，而是经 createPortal 渲染进原位置的占位元素——React 组件
   * 保持完整生命周期与更新能力（portal 子树仅 background 线程渲染）。
   */
  adapterRegistry?: AdapterRegistry;
}

export const PapiHTMLRenderer = React.memo(function PapiHTMLRenderer(
  props: PapiHTMLRendererProps,
) {
  const {
    html,
    removeAllClass = true,
    removeAllStyle = false,
    linkStyle,
    debug = false,
    plugins,
    tagMappings,
    unknownTagPolicy,
    styleMode = 'inline',
    darkMode = false,
    rootClassName = 'lynx-html-renderer',
    hostClassName,
    hostStyle,
    fallback,
    builder,
    adapterRegistry,
  } = props;

  const nodes = useMemo<LynxNode[]>(
    () =>
      transformHTML(html, {
        removeAllClass,
        removeAllStyle,
        styleMode,
        linkStyle,
        debug,
        plugins,
        tagMappings,
        unknownTagPolicy,
      }).map(normalizeTextTreeForRender),
    [
      html,
      removeAllClass,
      removeAllStyle,
      styleMode,
      linkStyle,
      debug,
      plugins,
      tagMappings,
      unknownTagPolicy,
    ],
  );

  // 自定义适配器子树摘出：PAPI 树中留占位（带 id），React 侧 Portal 渲染
  // useId 含 Lynx 选择器不支持的字符（如「:」），规范化为安全前缀
  const slotIdPrefix = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const { tree, slots } = useMemo(() => {
    if (!adapterRegistry) return { tree: serializeNodes(nodes), slots: [] };
    const extracted = extractSlots(nodes, adapterRegistry, `x${slotIdPrefix}`);
    return { tree: serializeNodes(extracted.tree), slots: extracted.slots };
  }, [nodes, adapterRegistry, slotIdPrefix]);
  const hasSlots = slots.length > 0;

  const hostRef = useMainThreadRef<MainThread.Element>(null);

  // 引擎不支持 Element API 时置 true，切换降级渲染
  const [unsupported, setUnsupported] = useState(false);
  // 占位元素由主线程 builder 创建，就绪后才能 Portal（selector 需元素已挂载）
  const [slotsReady, setSlotsReady] = useState(false);
  // 强制 flush tick：部分运行时把 runOnMainThread 排队到下一次 commit
  // 才派发；追加一次空渲染把队列冲出去（不列入 effect 依赖，避免循环）
  const [, setFlushTick] = useState(0);

  useEffect(() => {
    if (unsupported) return;
    let cancelled = false;
    setSlotsReady(false);
    // builder 不列入依赖：换新 builder 引用无需重建（tree 变更才需要）
    runOnMainThread(builder ?? buildPapiTree)(hostRef, tree)
      .then((ok: unknown) => {
        if (ok === true && !cancelled) setSlotsReady(true);
        if (ok !== true && !cancelled) setUnsupported(true);
      })
      .catch((err: unknown) => {
        console.error('[PapiHTMLRenderer] dispatch error:', err);
        if (!cancelled) setUnsupported(true);
      });
    // 宏任务触发空渲染 flush 被排队的主线程派发（native snapshot 模式）：
    // - 0ms：脱离当前渲染周期，保证产生独立 commit 冲出队列
    // - 300ms：兜底二次 flush，规避主线程 worklet runtime 加载时序竞争
    setTimeout(() => {
      if (!cancelled) setFlushTick((t) => t + 1);
    }, 0);
    setTimeout(() => {
      if (!cancelled) setFlushTick((t) => t + 1);
    }, 300);
    return () => {
      cancelled = true;
    };
  }, [tree, unsupported]);

  if (unsupported) {
    return <>{fallback}</>;
  }

  const resolvedClassName =
    hostClassName ??
    (styleMode === 'css-class'
      ? darkMode
        ? `${rootClassName} lhr-dark`
        : rootClassName
      : undefined);

  if (!hasSlots) {
    return (
      <view
        main-thread:ref={hostRef}
        class={resolvedClassName}
        style={hostStyle}
      />
    );
  }

  return (
    <view class={resolvedClassName} style={hostStyle}>
      <view main-thread:ref={hostRef} />
      {slotsReady &&
        adapterRegistry !== undefined &&
        slots.map((slot) => (
          <SlotPortal key={slot.id} slot={slot} registry={adapterRegistry} />
        ))}
    </view>
  );
});

/**
 * 适配器 Portal 桥接：把命中自定义适配器的子树渲染进 PAPI 占位元素。
 *
 * 占位元素由主线程 builder 创建（slotsReady 后才渲染本组件，selector
 * 必然可命中）；createPortal 的 container 接受 CSS-selector NodesRef，
 * portal 子树保留完整 React 生命周期（仅 background 线程渲染）。
 */
function SlotPortal({
  slot,
  registry,
}: {
  slot: PapiSlot;
  registry: AdapterRegistry;
}) {
  const ctx = useMemo(() => createRenderContext(registry), [registry]);
  const nodesRef = lynx.createSelectorQuery().select(`#${slot.id}`) as never;
  return createPortal(ctx.renderNode(slot.node) as never, nodesRef);
}
