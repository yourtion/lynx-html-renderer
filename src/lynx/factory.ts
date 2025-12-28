import type { LynxElementNode, LynxNode, LynxTextNode } from './types';

/**
 * 创建根节点容器
 */
export function createRootNode(): LynxElementNode {
  return {
    kind: 'element',
    tag: 'root',
    props: {},
    children: [],
    meta: {},
  };
}

/**
 * 创建 LynxNode
 * @param partial 节点的部分属性
 * @returns 完整的 LynxNode
 */
export function createLynxNode(
  partial: Partial<LynxElementNode | LynxTextNode>,
): LynxNode {
  if (
    partial.kind === 'text' ||
    (!partial.kind && partial.content !== undefined)
  ) {
    // 文本节点
    const textNode: LynxTextNode = {
      kind: 'text',
      content: partial.content ?? '',
    };

    // 只添加有值的字段
    if (partial.marks) textNode.marks = partial.marks;
    if (partial.meta) textNode.meta = partial.meta;

    return textNode;
  } else {
    // 元素节点
    const elementNode: LynxElementNode = {
      kind: 'element',
      tag: partial.tag ?? 'view',
      props: partial.props ?? {},
      children: partial.children ?? [],
    };

    // 只添加有值的字段
    if (partial.role) elementNode.role = partial.role;
    if (partial.capabilities) elementNode.capabilities = partial.capabilities;
    if (partial.meta) elementNode.meta = partial.meta;

    return elementNode;
  }
}

/**
 * 替换节点
 * @param root 根节点
 * @param target 要替换的目标节点
 * @param next 替换后的新节点
 */
export function replaceLynxNode(
  root: LynxNode,
  target: LynxNode,
  next: LynxNode,
): void {
  if (root === target) {
    // 如果根节点就是目标节点，直接替换所有属性
    Object.assign(root, next);
    return;
  }

  if (root.kind === 'element') {
    for (let i = 0; i < root.children.length; i++) {
      if (root.children[i] === target) {
        root.children[i] = next;
        return;
      }

      // 递归查找子节点
      replaceLynxNode(root.children[i], target, next);
    }
  }
}

/**
 * 创建元素节点
 */
export function createElementNode(
  tag: string,
  props?: LynxElementNode['props'],
  children?: LynxNode[],
): LynxElementNode {
  return {
    kind: 'element',
    tag,
    props: props ?? {},
    children: children ?? [],
  };
}

/**
 * 创建文本节点
 */
export function createTextNode(content: string): LynxTextNode {
  return {
    kind: 'text',
    content,
  };
}
