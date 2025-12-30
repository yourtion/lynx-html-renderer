/**
 * CSS 继承属性工具
 *
 * 用于处理从父元素到 text 节点的样式继承
 */

/**
 * 核心字体可继承属性（仅 inline 模式）
 *
 * 这些属性会从父元素的 defaultStyle 中提取并应用到子 text 节点上
 */
export const INHERITABLE_PROPERTIES = new Set([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'color',
] as const);

export type InheritableProperty = typeof INHERITABLE_PROPERTIES extends Set<
  infer T
>
  ? T
  : never;

/**
 * 从样式中提取可继承属性
 *
 * @param style - CSS 样式对象
 * @returns 只包含可继承属性的样式对象
 *
 * @example
 * ```ts
 * extractInheritableStyles({
 *   fontSize: '16px',
 *   padding: '10px',
 *   color: 'red'
 * })
 * // => { fontSize: '16px', color: 'red' }
 * ```
 */
export function extractInheritableStyles(
  style?: Record<string, unknown>,
): Record<string, unknown> {
  if (!style) return {};

  const inheritable: Record<string, unknown> = {};
  for (const prop of INHERITABLE_PROPERTIES) {
    if (prop in style && style[prop] !== undefined) {
      inheritable[prop] = style[prop];
    }
  }
  return inheritable;
}
