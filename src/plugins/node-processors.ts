import type { LynxNode, NodePostProcessor } from '../typings';

// Merge adjacent text nodes processor (internal implementation)
const mergeAdjacentTextNodesImpl: NodePostProcessor = (
  node: LynxNode,
): LynxNode => {
  // Process text node array merging
  const mergeTextNodes = (nodes: LynxNode[]): LynxNode[] => {
    const merged: LynxNode[] = [];

    for (const child of nodes) {
      const processedChild = mergeAdjacentTextNodesImpl(child);
      const last = merged[merged.length - 1];

      if (last?.kind === 'text' && processedChild.kind === 'text') {
        // Merge text content
        last.content += processedChild.content;

        // Only merge and retain marks when marked
        if (last.marks || processedChild.marks) {
          last.marks = {
            ...last.marks,
            ...processedChild.marks,
          };
        }
      } else {
        merged.push(processedChild);
      }
    }

    return merged;
  };

  if (node.kind === 'element') {
    return {
      ...node,
      children: mergeTextNodes(node.children),
    };
  }

  return node;
};

// Export version with type identification
export const mergeAdjacentTextNodes: NodePostProcessor =
  mergeAdjacentTextNodesImpl as any;

// Add processor type identification
(mergeAdjacentTextNodes as any).type = 'mergeAdjacentTextNodes';
(mergeAdjacentTextNodes as any).priority = 50;
