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
        ? { ...textNode.inheritableStyles, ...inheritableStyles }
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

  const {
    style: parentStyle,
    className: _parentClassName,
    ...passthroughProps
  } = parent.props as Record<string, unknown>;

  return {
    ...child,
    props: {
      ...passthroughProps,
      ...child.props,
      ...(parentStyle
        ? {
            style: {
              ...(parentStyle as Record<string, unknown>),
              ...(child.props.style as Record<string, unknown> | undefined),
            },
          }
        : {}),
      ...(mergedClassName ? { className: mergedClassName } : {}),
    },
  };
}

function hasPassthroughProps(props: Record<string, unknown>): boolean {
  return Object.keys(props).some(
    (key) => key !== 'style' && key !== 'className',
  );
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
    const elementProps = element.props as Record<string, unknown>;

    if (child.kind === 'text') {
      // 如果父元素有 data-href 等非 style/class 属性，保留父元素包装
      if (hasPassthroughProps(elementProps)) {
        return element;
      }
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
