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
  /** 宿主 view 的 class */
  hostClassName?: string;
  /** 宿主 view 的内联样式 */
  hostStyle?: Record<string, string | number>;
  /** 引擎不支持 Element API 时的降级渲染节点 */
  fallback?: React.ReactNode;
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
    hostClassName,
    hostStyle,
    fallback,
  } = props;

  const nodes = useMemo<LynxNode[]>(
    () =>
      transformHTML(html, {
        removeAllClass,
        removeAllStyle,
        styleMode: 'inline',
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

  useEffect(() => {
    if (unsupported) return;
    let cancelled = false;
    runOnMainThread(buildPapiTree)(hostRef, tree)
      .then((ok: unknown) => {
        if (ok === false && !cancelled) setUnsupported(true);
      })
      .catch(() => {
        if (!cancelled) setUnsupported(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tree, unsupported]);

  if (unsupported) {
    return <>{fallback}</>;
  }

  return (
    <view main-thread:ref={hostRef} class={hostClassName} style={hostStyle} />
  );
});
