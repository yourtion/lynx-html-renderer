/**
 * 主线程元素树构建器（Element PAPI 直绘核心）。
 *
 * 接收 serializeNodes 产出的对象树，在主线程递归构建原生元素。
 *
 * 该函数通过 `runOnMainThread(buildPapiTree)` 序列化到主线程执行。
 * 注意：`__` Element API 必须通过 `globalThis` 成员访问——裸引用会被
 * ReactLynx 编译器捕获进 worklet `_c` 对象，background 模块加载即崩溃。
 */
import type { PapiNode, PapiTree } from './types';

/**
 * 在宿主元素下构建（或重建）PapiTree 描述的原生元素树。
 *
 * @param hostRef 宿主元素的 main-thread ref（由 `main-thread:ref` 挂载）
 * @param roots 序列化对象树
 * @returns 是否成功构建（引擎缺少 Element API 或宿主未挂载时返回 false，上层可降级）
 */
export function buildPapiTree(
  hostRef: { current: unknown },
  roots: PapiTree,
): boolean {
  'main thread';
  const g = globalThis as unknown as Record<string, unknown>;

  // main-thread:ref 的 current 在部分运行时是 { element } 包装（ReactLynx WorkletRef 适配层）
  const current = hostRef.current as { element?: unknown } | null;
  const host = current?.element ?? current ?? null;
  if (host === null || host === undefined) return false;
  if (typeof g.__CreateView !== 'function') return false;

  const createView = g.__CreateView as (uniId: number) => unknown;
  const createText = g.__CreateText as (uniId: number) => unknown;
  const createImage = g.__CreateImage as (uniId: number) => unknown;
  const createRawText = g.__CreateRawText as (text: string) => unknown;
  const appendElement = g.__AppendElement as (
    parent: unknown,
    child: unknown,
  ) => unknown;
  const removeElement = g.__RemoveElement as (
    parent: unknown,
    child: unknown,
  ) => unknown;
  const firstElement = g.__FirstElement as (
    parent: unknown,
  ) => unknown | undefined;
  const setInlineStyles = g.__SetInlineStyles as (
    node: unknown,
    css: string,
  ) => void;
  const setClasses = g.__SetClasses as (
    node: unknown,
    className: string,
  ) => void;
  const setAttribute = g.__SetAttribute as (
    node: unknown,
    name: string,
    value: string,
  ) => void;
  const flushElementTree = g.__FlushElementTree as () => void;
  const getUniqueID = g.__GetElementUniqueID as (node: unknown) => number;

  const uniId = getUniqueID(host);

  // 清空宿主旧子树（重建场景）
  for (;;) {
    const first = firstElement(host);
    if (!first) break;
    removeElement(host, first);
  }

  const appendNode = (node: PapiNode, parent: unknown): void => {
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

    let element: unknown;
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
