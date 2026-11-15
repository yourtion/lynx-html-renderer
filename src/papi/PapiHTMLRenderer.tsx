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
import {
  type AdapterRegistry,
  getAdapterRegistry,
} from '../render/adapter-registry';
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
  /** 主线程构建成功回调（builder resolve true 且未被更新作废时触发） */
  onBuildComplete?: () => void;
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
    onBuildComplete,
  } = props;

  // 适配器注册表解析：显式传入 > 全局注册表（与 HTMLRenderer 行为一致，
  // registerAdapterByTag/ByRole 的全局注册对 PAPI 路线同样生效）；
  // 全局未初始化时按无适配器处理（纯直绘）
  const registry = useMemo(() => {
    if (adapterRegistry) return adapterRegistry;
    try {
      return getAdapterRegistry();
    } catch {
      return undefined;
    }
  }, [adapterRegistry]);

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
    if (!registry) return { tree: serializeNodes(nodes), slots: [] };
    const extracted = extractSlots(nodes, registry, `x${slotIdPrefix}`);
    return { tree: serializeNodes(extracted.tree), slots: extracted.slots };
  }, [nodes, registry, slotIdPrefix]);
  const hasSlots = slots.length > 0;

  const hostRef = useMainThreadRef<MainThread.Element>(null);

  // 引擎不支持 Element API 时置 true，切换降级渲染
  const [unsupported, setUnsupported] = useState(false);
  // 构建阶段：building = portal 已卸载、原生树可安全重建；ready = 可挂 portal
  const [phase, setPhase] = useState<'building' | 'ready'>('building');
  // Portal 桥接能力探测失败（占位无法被 selector 寻址）→ 整体 React 渲染兜底
  const [bridgeDown, setBridgeDown] = useState(false);
  // 构建代次：tree 变化时递增，作废在途 builder 的回调
  const buildGenRef = React.useRef(0);
  // 上次派发构建的 tree 引用：区分「tree 变化需先卸载 portal」与
  // 「phase 自身推进」（避免 phase 变化重跑 effect 时误触发再卸载循环）
  const lastBuiltTreeRef = React.useRef<typeof tree | null>(null);
  // onBuildComplete 回调用 ref 存（内联函数引用每渲染变，列入依赖会导致
  // effect 级联重派发 + gen 递增作废全部在途回调）
  const onBuildCompleteRef = React.useRef(onBuildComplete);
  onBuildCompleteRef.current = onBuildComplete;
  // 强制 flush tick：部分运行时把 runOnMainThread 排队到下一次 commit
  // 才派发；追加一次空渲染把队列冲出去（不列入 effect 依赖，避免循环）
  const [, setFlushTick] = useState(0);

  useEffect(() => {
    if (unsupported) return;
    // 两段式更新（P1 时序）：tree 变化时若 portal 仍挂载，先切回 building
    // 卸载 portal（React 子树节点须先移除，否则主线程清空占位会导致
    // "child is not in parent" 删除错误），本 commit 不派发 builder；
    // phase 回到 building 后 effect 重跑才执行重建。
    if (phase !== 'building') {
      if (lastBuiltTreeRef.current !== tree) {
        buildGenRef.current += 1;
        lastBuiltTreeRef.current = tree;
        setPhase('building');
      }
      return;
    }
    let cancelled = false;
    lastBuiltTreeRef.current = tree;
    const gen = ++buildGenRef.current;
    // builder 不列入依赖：换新 builder 引用无需重建（tree 变更才需要）
    runOnMainThread(builder ?? buildPapiTree)(hostRef, tree)
      .then((ok: unknown) => {
        if (cancelled || gen !== buildGenRef.current) return;
        if (ok === true) {
          setPhase('ready');
          onBuildCompleteRef.current?.();
        } else {
          setUnsupported(true);
        }
      })
      .catch((err: unknown) => {
        if (cancelled || gen !== buildGenRef.current) return;
        console.error('[PapiHTMLRenderer] dispatch error:', err);
        setUnsupported(true);
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
  }, [tree, phase, unsupported]);

  // registry / tree 变化后重置桥接探测结论，并重新探测
  useEffect(() => {
    setBridgeDown(false);
    // 桥接能力探测（组件层执行，不依赖 portal 子树挂载成功）：
    // native 引擎当前无法通过 selector 寻址运行时创建的占位（上游
    // lynx#10989）——fields 回调 data 为 null 即不可达 → 整体 React 兜底，
    // 避免适配器内容静默缺失。探测 API 缺失（模拟层）时保持乐观。
    if (!hasSlots || phase !== 'ready') return;
    try {
      const firstSlot = slots[0];
      if (firstSlot === undefined) return;
      const ref = lynx.createSelectorQuery().select(`#${firstSlot.id}`) as {
        fields?: (
          f: { id: boolean },
          cb: (data: unknown) => void,
        ) => { exec?: () => void };
      };
      if (typeof ref.fields === 'function') {
        ref
          .fields({ id: true }, (data: unknown) => {
            if (data === null) setBridgeDown(true);
          })
          .exec?.();
      }
    } catch {
      // select 即失败或探测通道缺失：保持乐观，继续 portal 尝试
    }
  }, [tree, registry, phase, hasSlots, slots]);

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

  // 桥接不可用且有适配器子树：整体走 React 渲染兜底（内容不缺失），
  // 放弃本轮直绘（上游修复 selector 寻址后自动恢复）
  if (bridgeDown && hasSlots && registry !== undefined) {
    const ctx = createRenderContext(registry);
    return (
      <view class={resolvedClassName} style={hostStyle}>
        {nodes.map((node) => ctx.renderNode(node))}
      </view>
    );
  }

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
      {phase === 'ready' &&
        registry !== undefined &&
        slots.map((slot) => (
          <SlotPortal
            key={slot.id}
            slot={slot}
            registry={registry}
            onUnreachable={() => setBridgeDown(true)}
          />
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
  onUnreachable,
}: {
  slot: PapiSlot;
  registry: AdapterRegistry;
  onUnreachable: () => void;
}) {
  const ctx = useMemo(() => createRenderContext(registry), [registry]);
  // select 若抛（占位元素不存在 / 运行时不支持）即视为桥接不可达，
  // 由上层走整体 React 兜底——不创建 Portal，避免 teardown 崩溃
  let nodesRef: Parameters<typeof createPortal>[1];
  let unreachable = false;
  try {
    nodesRef = lynx.createSelectorQuery().select(`#${slot.id}`) as never;
  } catch {
    unreachable = true;
    nodesRef = undefined as never;
  }
  // onUnreachable 在 effect 中触发（渲染期 setState 会导致组件树重建异常）
  useEffect(() => {
    if (unreachable) onUnreachable();
  }, [unreachable, onUnreachable]);
  if (unreachable) return null;
  return createPortal(ctx.renderNode(slot.node) as never, nodesRef);
}
