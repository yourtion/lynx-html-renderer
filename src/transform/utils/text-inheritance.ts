import { getMarkStyles } from '../../lynx/text-styles';
import type { CSSProperties, LynxNode } from '../../lynx/types';
import { getTextClassNameForTag } from '../../utils/css-generator';
import { hasOwn } from '../../utils/has-own-property';
import { parseStyleString } from '../../utils/style-parser';
import { extractInheritableStyles } from './inheritable-properties';

/** Resolve inheritance once all capability plugins have finished styling. */
export function inheritTextStyles(
  root: LynxNode,
  styleMode: 'inline' | 'css-class',
  removeAllStyle = false,
): void {
  const stack: Array<{
    node: LynxNode;
    styles: CSSProperties;
    classes?: string;
  }> = [{ node: root, styles: {} }];
  while (stack.length) {
    const entry = stack.pop();
    if (!entry) break;
    const { node, styles, classes } = entry;
    if (node.kind === 'text') {
      const resolved = { ...styles, ...node.inheritableStyles };
      // Marks supply these same defaults at render time. Keep explicit overrides.
      for (const [key, value] of Object.entries(getMarkStyles(node.marks))) {
        if (resolved[key] === value) delete resolved[key];
      }
      if (Object.keys(resolved).length) node.inheritableStyles = resolved;
      else delete node.inheritableStyles;
      const textClasses = [classes, node.inheritableClasses]
        .filter(Boolean)
        .join(' ');
      if (textClasses) node.inheritableClasses = textClasses;
      continue;
    }

    const own = extractInheritableStyles(node.props.style);
    // The shared theme color is a fallback; it must not reset an ancestor's color.
    if (styles.color && own.color === 'var(--lhr-text-color)') {
      const inlineColor =
        !removeAllStyle && node.meta?.sourceAttrs?.style
          ? parseStyleString(node.meta.sourceAttrs.style).color
          : undefined;
      if (!inlineColor) delete own.color;
    }
    const resolved = { ...styles, ...own };
    if (node.tag === 'text' && Object.keys(resolved).length) {
      node.props.style = { ...resolved, ...node.props.style, ...own };
      if (!hasOwn(own, 'color') && styles.color)
        node.props.style.color = styles.color;
    }
    const ownClass =
      styleMode === 'css-class' &&
      node.meta?.sourceTag &&
      !node.meta.customMapping
        ? getTextClassNameForTag(node.meta.sourceTag)
        : undefined;
    const nextClasses =
      [classes, ownClass].filter(Boolean).join(' ') || undefined;
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push({
        node: node.children[i],
        styles: resolved,
        classes: nextClasses,
      });
    }
  }
}
