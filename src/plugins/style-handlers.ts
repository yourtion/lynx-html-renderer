import type { StyleHandler } from '../typings';

// Style processor (empty implementation, maintain type compatibility)
export const defaultStyleHandler: StyleHandler = (
  style: Record<string, string | number>,
): Record<string, string | number> => {
  return style;
};
