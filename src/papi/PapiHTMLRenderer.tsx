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

import { runOnMainThread, useMainThreadRef } from '@lynx-js/react';
import type { MainThread } from '@lynx-js/types';
import React, { useEffect, useMemo, useState } from 'react';
import { transformHTML } from '../html-parser';
import type { LynxNode } from '../lynx/types';
import { normalizeTextTreeForRender } from '../render/text-normalizer';
import type { TransformOptions } from '../transform/types';
import { buildPapiTree } from './builder';
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

import { serializeNodes } from './serialize';

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

  // background 线程完成全部序列化，主线程只做元素构建
  const tree = useMemo(() => serializeNodes(nodes), [nodes]);

  const hostRef = useMainThreadRef<MainThread.Element>(null);

  // 引擎不支持 Element API 时置 true，切换降级渲染
  const [unsupported, setUnsupported] = useState(false);
  // 强制 flush tick：部分运行时把 runOnMainThread 排队到下一次 commit
  // 才派发；追加一次空渲染把队列冲出去（不列入 effect 依赖，避免循环）
  const [, setFlushTick] = useState(0);

  useEffect(() => {
    if (unsupported) return;
    let cancelled = false;
    runOnMainThread(builder ?? buildPapiTree)(hostRef, tree)
      .then((ok: unknown) => {
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

  return (
    <view
      main-thread:ref={hostRef}
      class={resolvedClassName}
      style={hostStyle}
    />
  );
});
