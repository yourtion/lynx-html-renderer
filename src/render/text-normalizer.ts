import { extractInheritableStyles } from '../transform/utils/inheritable-properties';
import { isInheritableProperty } from '../utils/style-schema';
import type { LynxElementNode, LynxNode } from './types';

function canCollapse(element: LynxElementNode): boolean {
  if (element.meta?.customMapping) return false;
  if (element.tag !== 'text' || (element.role && element.role !== 'inline'))
    return false;
  // A class can carry layout or interaction styling; its container is observable.
  if (Object.keys(element.props).some((key) => key !== 'style')) return false;
  return Object.keys(element.props.style ?? {}).every(isInheritableProperty);
}

export function normalizeTextTreeForRender(node: LynxNode): LynxNode {
  if (node.kind !== 'element') return node;
  const element = {
    ...node,
    children: node.children.map(normalizeTextTreeForRender),
  };
  if (!canCollapse(element) || element.children.length !== 1) return element;
  const child = element.children[0];
  const inherited = extractInheritableStyles(element.props.style);
  if (child.kind === 'text') {
    return {
      ...child,
      inheritableStyles: Object.keys(inherited).length
        ? { ...inherited, ...child.inheritableStyles }
        : child.inheritableStyles,
    };
  }
  // Preserve the child's container and give its explicit style priority.
  if (child.tag === 'text') {
    return {
      ...child,
      props: { ...child.props, style: { ...inherited, ...child.props.style } },
    };
  }
  return element;
}
