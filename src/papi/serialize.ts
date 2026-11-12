/**
 * LynxNode → PapiTree 序列化。
 *
 * 在 background 线程完成所有样式合并与 CSS 字符串化，
 * 使主线程 builder 拿到的数据可以直接下发，无需任何转换。
 */
import { getMarkStyles } from '../lynx/text-styles';
import type { CSSProperties, LynxNode } from '../lynx/types';
import type { PapiNode, PapiTree } from './types';

/**
 * 将 camelCase 样式对象转换为 kebab-case CSS 字符串。
 *
 * 值保持原样（HTML style 属性与内置样式均为字符串），
 * 数字值由 `String()` 兜底转换。
 */
export function styleToCssString(
  style: CSSProperties | undefined,
): string | undefined {
  if (!style) return undefined;
  let css = '';
  for (const key in style) {
    const prop = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    css += `${prop}:${style[key]};`;
  }
  return css.length > 0 ? css : undefined;
}

function serializeNode(node: LynxNode): PapiNode {
  if (node.kind === 'text') {
    // 与 ReactLynx 渲染路径（renderNodeWithRegistry）保持一致的样式合并顺序
    const style: CSSProperties = {
      ...getMarkStyles(node.marks),
      ...node.inheritableStyles,
    };
    return {
      kind: 'text',
      v: node.content,
      st: styleToCssString(style),
      cl: node.inheritableClasses,
    };
  }

  const { style, className, ...rest } = node.props;
  const at: Record<string, string> = {};
  for (const key in rest) {
    const value = rest[key];
    if (typeof value === 'string' || typeof value === 'number') {
      at[key] = String(value);
    }
  }

  return {
    kind: 'element',
    tg: node.tag,
    st: styleToCssString(style),
    cl: className,
    at: Object.keys(at).length > 0 ? at : undefined,
    k: node.children.length > 0 ? serializeNodes(node.children) : undefined,
  };
}

/** 将转换管道产出的 LynxNode 数组序列化为 PapiTree */
export function serializeNodes(nodes: LynxNode[]): PapiTree {
  return nodes.map(serializeNode);
}
