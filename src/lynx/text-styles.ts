import type { CSSProperties, LynxTextNode } from './types';

export function getMarkStyles(marks?: LynxTextNode['marks']): CSSProperties {
  const style: CSSProperties = {};
  if (marks?.bold) style.fontWeight = 'bold';
  if (marks?.italic) style.fontStyle = 'italic';
  if (marks?.underline) style.textDecoration = 'underline';
  if (marks?.code) {
    style.fontFamily = 'monospace';
  }
  return style;
}

/**
 * PAPI 直绘与 React 渲染两条路径共用的文本样式合并
 * （marks + 继承样式/类名），保证两条输出不会漂移。
 */
export function getMergedTextStyle(node: LynxTextNode): {
  style: CSSProperties;
  className?: string;
} {
  return {
    style: { ...getMarkStyles(node.marks), ...node.inheritableStyles },
    className: node.inheritableClasses,
  };
}
