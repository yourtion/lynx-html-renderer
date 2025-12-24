import { pluginManager } from '../plugin-system';
import { TAG_MARKS } from './tag-handlers';
import type {
  ChildrenTransformProcessor,
  HtmlTransformProcessor,
  NodeTransformProcessor,
} from '../typings';
import { mergeAdjacentTextNodes } from '../utils/node-helpers';

// HTML transformation processor
export const htmlTransformProcessor: HtmlTransformProcessor = (
  html,
  context,
) => {
  const { parseDocument, transformChildren } = context;
  const document = parseDocument(html);
  let nodes = transformChildren(document.children);

  // Apply top-level node post processor
  const nodePostProcessors = pluginManager.getNodePostProcessors();
  nodes = nodes.map((node) => {
    let processedNode = node;
    for (const processor of nodePostProcessors) {
      processedNode = processor(processedNode);
    }
    return processedNode;
  });

  // Merge top-level adjacent text nodes
  return mergeAdjacentTextNodes(nodes);
};

// Children transformation processor
export const childrenTransformProcessor: ChildrenTransformProcessor = (
  nodes,
  parentMarks = {},
  context,
) => {
  const { transformNode } = context;
  const result: LynxNode[] = [];

  for (const node of nodes) {
    const transformed = transformNode(node, parentMarks);
    if (!transformed) continue;

    result.push(transformed);
  }

  return result;
};

// Node transformation processor
export const nodeTransformProcessor: NodeTransformProcessor = (
  node,
  parentMarks = {},
  context,
) => {
  const { getTagHandlers, getNodePostProcessors, transformChildren } = context;

  // Text node processing
  if (node.type === 'text') {
    const content = node.data;
    if (!content?.trim()) return null;

    let result = {
      kind: 'text',
      content: content || '',
    };

    // Only add marks field when there are marks, maintain compatibility with existing tests
    const hasMarks = Object.values(parentMarks).some(Boolean);
    if (hasMarks) {
      result.marks = { ...parentMarks };
    }

    // Apply node post processor
    for (const processor of getNodePostProcessors()) {
      result = processor(result);
    }

    return result;
  }

  // Tag node processing
  if (node.type === 'tag') {
    const tag = node.name?.toLowerCase() || '';

    // Get all processors for this tag
    const tagHandlers = getTagHandlers(tag);

    // Accumulate marks from this tag
    const tagMarks = TAG_MARKS[tag] || {};
    const accumulatedMarks = { ...parentMarks, ...tagMarks };

    // Try using plugin processor
    for (const handler of tagHandlers) {
      const result = handler(node, {
        defaultTransform: () => null,
        transformChildren: (nodes) => transformChildren(nodes, accumulatedMarks),
      });

      if (result !== null) {
        // Apply node post processor
        let processedNode = result;
        for (const processor of getNodePostProcessors()) {
          processedNode = processor(processedNode);
        }

        return processedNode;
      }
    }
  }

  return null;
};
