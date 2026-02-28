import type { LynxElementNode, LynxNode, TransformPlugin } from '../../types';

function isTransparentTextWrapper(node: LynxElementNode): boolean {
  if (node.tag !== 'text') return false;
  const propKeys = Object.keys(node.props);
  return propKeys.length === 0;
}

function normalizeTextNode(node: LynxNode): LynxNode {
  if (node.kind !== 'element') return node;

  const element = node as LynxElementNode;
  element.children = element.children.map(normalizeTextNode);

  // Collapse transparent nested <text> wrappers produced by inline mark tags.
  while (
    isTransparentTextWrapper(element) &&
    element.children.length === 1 &&
    element.children[0].kind === 'element' &&
    isTransparentTextWrapper(element.children[0] as LynxElementNode)
  ) {
    const child = element.children[0] as LynxElementNode;
    element.children = child.children;
  }

  // If a transparent <text> wrapper only contains one text node, unwrap it.
  if (
    isTransparentTextWrapper(element) &&
    element.children.length === 1 &&
    element.children[0].kind === 'text'
  ) {
    return element.children[0];
  }

  return element;
}

export const textNormalizeFinalizePlugin: TransformPlugin = {
  name: 'text-normalize-finalize',
  phase: 'finalize',
  order: 10,

  apply(ctx) {
    ctx.root = normalizeTextNode(ctx.root);
  },
};
