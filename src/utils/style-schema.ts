export const TEXT_ONLY_PROPERTIES: ReadonlySet<string> = new Set([
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'direction',
  'textShadow',
  'textStroke',
  'textIndent',
  'whiteSpace',
  'wordBreak',
] as const);

export const INHERITABLE_PROPERTIES: ReadonlySet<string> = new Set([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'color',
  'textAlign',
  'textIndent',
  'letterSpacing',
  'wordSpacing',
  'direction',
  'textDecoration',
  'textShadow',
  'textStroke',
  'whiteSpace',
  'wordBreak',
] as const);

export const UNITLESS_PROPERTIES: ReadonlySet<string> = new Set([
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'opacity',
  'zIndex',
  'order',
  'fontWeight',
  'lineHeight',
] as const);

export function isTextOnlyProperty(prop: string): boolean {
  return TEXT_ONLY_PROPERTIES.has(prop);
}

export function isInheritableProperty(prop: string): boolean {
  return INHERITABLE_PROPERTIES.has(prop);
}

export function isUnitlessProperty(prop: string): boolean {
  return UNITLESS_PROPERTIES.has(prop);
}
