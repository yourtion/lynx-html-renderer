/**
 * 主线程元素树构建器（Element PAPI 直绘核心）。
 *
 * 该函数通过 `lynx.runOnMainThread(buildPapiTree)` 序列化到主线程执行。
 *
 * 重要：`__` Element API 必须通过 `globalThis` 动态访问。
 * 直接裸引用会被 ReactLynx 编译器当作自由变量捕获进 worklet 的
 * `_c` 对象，导致 background 线程模块加载时即抛 ReferenceError；
 * 而成员表达式（`g.__CreateView`）不参与闭包捕获，可在主线程解析。
 */
import type { ElementRef } from '@lynx-js/type-element-api';
import type { PapiNode, PapiTree } from './types';

/**
 * 在宿主元素下构建（或重建）PapiTree 描述的原生元素树。
 *
 * @param hostRef 宿主元素的 main-thread ref（由 `main-thread:ref` 挂载）
 * @param roots 序列化树
 * @returns 是否成功构建（引擎缺少 Element API 或宿主未挂载时返回 false，上层可降级）
 */
export function buildPapiTree(
  hostRef: { current: unknown },
  roots: PapiTree,
): boolean {
  'main thread';
  const g = globalThis as unknown as Record<string, unknown>;

  // main-thread:ref 的 current 在部分运行时是 { element } 包装（ReactLynx WorkletRef 适配层）
  const current = hostRef.current as
    | (ElementRef & { element?: ElementRef })
    | null;
  const host = current?.element ?? current ?? null;
  if (host === null || host === undefined) return false;
  if (typeof g.__CreateView !== 'function') return false;

  const createView = g.__CreateView as (uniId: number) => ElementRef;
  const createText = g.__CreateText as (uniId: number) => ElementRef;
  const createImage = g.__CreateImage as (uniId: number) => ElementRef;
  const createRawText = g.__CreateRawText as (text: string) => ElementRef;
  const appendElement = g.__AppendElement as (
    parent: ElementRef,
    child: ElementRef,
  ) => ElementRef;
  const removeElement = g.__RemoveElement as (
    parent: ElementRef,
    child: ElementRef,
  ) => ElementRef;
  const firstElement = g.__FirstElement as (
    parent: ElementRef,
  ) => ElementRef | undefined;
  const setInlineStyles = g.__SetInlineStyles as (
    node: ElementRef,
    css: string,
  ) => void;
  const setClasses = g.__SetClasses as (
    node: ElementRef,
    className: string,
  ) => void;
  const setAttribute = g.__SetAttribute as (
    node: ElementRef,
    name: string,
    value: string,
  ) => void;
  const flushElementTree = g.__FlushElementTree as () => void;
  const getUniqueID = g.__GetElementUniqueID as (node: ElementRef) => number;

  const uniId = getUniqueID(host);

  // 清空宿主旧子树（重建场景）
  for (;;) {
    const first = firstElement(host);
    if (!first) break;
    removeElement(host, first);
  }

  const appendNode = (node: PapiNode, parent: ElementRef): void => {
    if (node.kind === 'text') {
      const text = createText(uniId);
      if (node.st) {
        setInlineStyles(text, node.st);
      }
      if (node.cl) {
        setClasses(text, node.cl);
      }
      appendElement(text, createRawText(node.v));
      appendElement(parent, text);
      return;
    }

    let element: ElementRef;
    if (node.tg === 'image') {
      element = createImage(uniId);
    } else if (node.tg === 'text') {
      element = createText(uniId);
    } else {
      // view 及其余容器标签统一按 view 构建
      element = createView(uniId);
    }
    if (node.st) {
      setInlineStyles(element, node.st);
    }
    if (node.cl) {
      setClasses(element, node.cl);
    }
    if (node.at) {
      for (const key in node.at) {
        setAttribute(element, key, node.at[key]);
      }
    }
    appendElement(parent, element);
    if (node.k) {
      for (const child of node.k) {
        appendNode(child, element);
      }
    }
  };

  for (const root of roots) {
    appendNode(root, host);
  }

  flushElementTree();
  return true;
}
