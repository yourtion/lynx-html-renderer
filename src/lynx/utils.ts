import type { LynxNode, LynxTextNode } from './types';

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
      const marksAreSame =
        JSON.stringify(lastMarks) === JSON.stringify(nodeMarks);

      if (marksAreSame) {
        // Special handling for br tags: clean up whitespace around newlines
        if (last.meta?.source === 'br' || node.meta?.source === 'br') {
          // Trim leading whitespace from node if last is br
          if (last.meta?.source === 'br') {
            node.content = node.content.trimStart();
          }
          // Trim trailing whitespace from last if node is br
          if (node.meta?.source === 'br') {
            last.content = last.content.trimEnd();
          }

          // When merging br nodes, remove meta to get clean text node
          delete last.meta;
        }

        // Merge text content
        last.content += node.content;

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
 * 递归合并所有相邻文本节点
 */
export function mergeAllTextNodes(node: LynxNode): LynxNode {
  if (node.kind === 'element') {
    node.children = node.children.map(mergeAllTextNodes);
    node.children = mergeAdjacentTextNodes(node.children);
  }

  return node;
}
