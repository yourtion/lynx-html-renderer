import type { LynxNode, NodePostProcessor, ProcessorBase } from '../typings';
import { mergeAdjacentTextNodes as mergeTextNodes } from '../utils/node-helpers';

// Merge adjacent text nodes processor (internal implementation)
const mergeAdjacentTextNodesImpl: NodePostProcessor = (
  node: LynxNode,
): LynxNode => {
  if (node.kind === 'element') {
    return {
      ...node,
      children: mergeTextNodes(node.children),
    };
  }

  return node;
};

// Create tagged processor with type identification
const createTaggedProcessor = (
  processor: NodePostProcessor,
  type: string,
  priority: number,
): NodePostProcessor & ProcessorBase => {
  return Object.assign(processor, { type, priority });
};

// Export version with type identification
export const mergeAdjacentTextNodes = createTaggedProcessor(
  mergeAdjacentTextNodesImpl,
  'mergeAdjacentTextNodes',
  50,
);
