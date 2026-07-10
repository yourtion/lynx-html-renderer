import type { LynxElementNode, LynxNode, TransformPlugin } from '../../types';

/**
 * 表格结构插件
 * 职责：处理表格结构，扁平化 thead/tbody/tfoot
 */
export const tableStructurePlugin: TransformPlugin = {
  name: 'table-structure',
  phase: 'structure',
  order: 30,

  apply(ctx) {
    // 遍历所有节点，扁平化 thead/tbody/tfoot
    flattenTableSections(ctx.root);
  },
};

/**
 * 递归扁平化表格部分
 */
function flattenTableSections(node: LynxNode): void {
  if (node.kind === 'element') {
    const element = node as LynxElementNode;

    // 检查是否是 table 元素
    if (element.meta?.sourceTag === 'table') {
      element.children = flattenTableChildren(element.children);
    }

    // 递归处理子节点
    for (const child of element.children) {
      flattenTableSections(child);
    }
  }
}

/**
 * 扁平化 table 的直接子节点
 * 将 thead/tbody/tfoot 的子节点提升到 table 下一级
 * 但保留 view 包装器（与旧逻辑一致）
 */
function flattenTableChildren(children: LynxNode[]): LynxNode[] {
  const result: LynxNode[] = [];

  for (const child of children) {
    if (child.kind === 'element') {
      const childElement = child as LynxElementNode;
      const sourceTag = childElement.meta?.sourceTag;

      // 如果是 thead/tbody/tfoot，将子节点统一提升到 table 下一级
      if (
        sourceTag === 'thead' ||
        sourceTag === 'tbody' ||
        sourceTag === 'tfoot'
      ) {
        result.push(...childElement.children);
      } else {
        result.push(child);
      }
    } else {
      result.push(child);
    }
  }

  return result;
}
