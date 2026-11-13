/**
 * 适配器 slot 提取：把命中自定义适配器的子树从 PAPI 直绘树中摘出，
 * 原位置替换为带 id 的占位 view；被摘出的子树交给 React 侧
 * 经 createPortal 渲染进占位元素（见 PapiHTMLRenderer 的 SlotPortal）。
 */

import type { LynxElementNode, LynxNode } from '../lynx/types';
import type { AdapterRegistry } from '../render/adapter-registry';

export interface PapiSlot {
  /** 占位元素 id（同时是 CSS 选择器 id，含实例级前缀避免多实例冲突） */
  id: string;
  /** 命中自定义适配器的原始子树（整棵交给 React 渲染） */
  node: LynxElementNode;
}

export interface ExtractedSlots {
  /** 含占位节点的树（走 PAPI 序列化） */
  tree: LynxNode[];
  /** 被摘出的适配器子树（走 React Portal） */
  slots: PapiSlot[];
}

/**
 * 遍历树，把命中自定义适配器（registry.hasCustomAdapter）的元素替换为
 * 空占位 view（保留原节点的 style/class 以维持外层布局语义），
 * 并记录原始子树供 React 侧渲染。
 */
export function extractSlots(
  nodes: LynxNode[],
  registry: AdapterRegistry,
  /** 实例级 id 前缀（如 useId），避免同页多实例的占位 id 冲突 */
  instancePrefix = '',
): ExtractedSlots {
  const slots: PapiSlot[] = [];

  const walk = (list: LynxNode[]): LynxNode[] =>
    list.map((node) => {
      if (node.kind !== 'element') return node;
      if (registry.hasCustomAdapter(node)) {
        const id = `papi-slot${instancePrefix}-${slots.length}`;
        slots.push({ id, node });
        // 占位只保留布局相关属性：适配器专属属性（如 data-*）属于 React 子树，
        // 带到原生元素上会触发引擎属性白名单失败
        const { style, className } = node.props;
        return {
          kind: 'element',
          tag: 'view',
          props: {
            ...(style && { style }),
            ...(className && { className }),
            id,
          },
          children: [],
        } satisfies LynxElementNode;
      }
      if (node.children.length === 0) return node;
      return { ...node, children: walk(node.children) };
    });

  return { tree: walk(nodes), slots };
}
