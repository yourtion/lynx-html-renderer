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
