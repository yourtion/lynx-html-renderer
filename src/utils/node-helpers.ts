import type { LynxNode, LynxTextNode } from '../typings';

/**
 * 合并相邻文本节点
 * Only merges text nodes that have the same marks (or both have no marks)
 */
export function mergeAdjacentTextNodes(nodes: LynxNode[]): LynxNode[] {
  const merged: LynxNode[] = [];

  for (const node of nodes) {
    const last = merged[merged.length - 1];

    // Only merge if both are text nodes AND have the same marks
    if (last?.kind === 'text' && node.kind === 'text') {
      const lastMarks = last.marks || {};
      const nodeMarks = node.marks || {};

      // Check if marks are the same (compare keys and values)
      const marksAreSame = JSON.stringify(lastMarks) === JSON.stringify(nodeMarks);

      if (marksAreSame) {
        // Merge text content
        last.content += node.content;

        // Marks are already the same, no need to merge
        continue;
      }
    }

    merged.push(node);
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
