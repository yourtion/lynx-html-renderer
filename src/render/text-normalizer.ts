import { extractInheritableStyles } from '../transform/utils/inheritable-properties';
import type { LynxElementNode, LynxNode, LynxTextNode } from './types';

function mergeClassNames(
  ...classNames: Array<string | undefined>
): string | undefined {
  const merged = classNames.filter(Boolean).join(' ').trim();
  return merged || undefined;
}

function mergeTextNodeWithParentProps(
  textNode: LynxTextNode,
  parent: LynxElementNode,
): LynxTextNode {
  const mergedClassName = mergeClassNames(
    parent.props.className as string | undefined,
    textNode.inheritableClasses,
  );
  const inheritableStyles = extractInheritableStyles(
    parent.props.style as Record<string, unknown> | undefined,
  );

  return {
    ...textNode,
    inheritableClasses: mergedClassName,
    inheritableStyles:
      Object.keys(inheritableStyles).length > 0
        ? inheritableStyles
        : textNode.inheritableStyles,
  };
}

function mergeTextElementWithParentProps(
  child: LynxElementNode,
  parent: LynxElementNode,
): LynxElementNode {
  const mergedClassName = mergeClassNames(
    parent.props.className as string | undefined,
    child.props.className as string | undefined,
  );

  return {
    ...child,
    props: {
      ...child.props,
      ...(parent.props.style
        ? {
            style: {
              ...(child.props.style as Record<string, unknown> | undefined),
              ...(parent.props.style as Record<string, unknown>),
            },
          }
        : {}),
      ...(mergedClassName ? { className: mergedClassName } : {}),
    },
  };
}

export function normalizeTextTreeForRender(node: LynxNode): LynxNode {
  if (node.kind !== 'element') {
    return node;
  }

  const element = {
    ...node,
    children: node.children.map(normalizeTextTreeForRender),
  };

  if (
    element.tag === 'text' &&
    element.children.length === 1 &&
    (element.props.className || element.props.style)
  ) {
    const child = element.children[0];

    if (child.kind === 'text') {
      return mergeTextNodeWithParentProps(child, element);
    }

    if (child.kind === 'element' && child.tag === 'text') {
      return normalizeTextTreeForRender(
        mergeTextElementWithParentProps(child, element),
      );
    }
  }

  return element;
}
