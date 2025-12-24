import type { LynxNode, LynxTextNode } from '../typings';

/**
 * 合并相邻文本节点
 */
export function mergeAdjacentTextNodes(nodes: LynxNode[]): LynxNode[] {
  const merged: LynxNode[] = [];

  for (const node of nodes) {
    const last = merged[merged.length - 1];

    if (last?.kind === 'text' && node.kind === 'text') {
      // 合并文本内容
      last.content += node.content;

      // 合并 marks
      if (last.marks || node.marks) {
        last.marks = {
          ...last.marks,
          ...node.marks,
        };
      }
    } else {
      merged.push(node);
    }
  }

  return merged;
}

/**
 * 检查是否为文本节点
 */
export function isTextNode(node: LynxNode): node is LynxTextNode {
  return node.kind === 'text';
}

/**
 * 检查文本节点是否有 marks
 */
export function hasMarks(marks?: Record<string, boolean>): boolean {
  return marks !== undefined && Object.values(marks).some(Boolean);
}

/**
 * 应用节点后处理器
 */
export function applyPostProcessors(
  node: LynxNode,
  processors: Array<(node: LynxNode) => LynxNode>,
): LynxNode {
  let result = node;
  for (const processor of processors) {
    result = processor(result);
  }
  return result;
}
