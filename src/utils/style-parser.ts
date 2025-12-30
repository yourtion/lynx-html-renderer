import type { CSSProperties } from '../transform/types';

/**
 * Pre-compiled regex for kebab-case to camelCase conversion
 * Compiled once at module load for better performance
 */
const KEBAB_REGEX = /-([a-z])/g;

/**
 * Parse CSS style string into CSSProperties object
 * Optimized version that minimizes string allocations
 *
 * @example
 * parseStyleString("font-size: 14px; color: red;")
 * // Returns: { fontSize: "14px", color: "red" }
 *
 * Performance optimizations:
 * - Manual string iteration instead of split/forEach
 * - Single pass through the string
 * - Minimized substring allocations
 * - Pre-compiled regex
 */
export function parseStyleString(style: string): CSSProperties {
  const result: CSSProperties = {};
  let start = 0;
  const length = style.length;

  while (start < length) {
    // Find next semicolon (end of declaration)
    let end = style.indexOf(';', start);
    if (end === -1) end = length;

    // Find colon (separator between key and value)
    const colonIndex = style.indexOf(':', start);
    if (colonIndex === -1 || colonIndex > end) {
      start = end + 1;
      continue;
    }

    // Extract key (manual trim by skipping whitespace)
    let keyStart = start;
    while (keyStart < colonIndex && style.charCodeAt(keyStart) <= 32)
      keyStart++;
    let keyEnd = colonIndex;
    while (keyEnd > keyStart && style.charCodeAt(keyEnd - 1) <= 32) keyEnd--;

    const rawKey = style.substring(keyStart, keyEnd);

    // Extract value (manual trim)
    let valueStart = colonIndex + 1;
    while (valueStart < end && style.charCodeAt(valueStart) <= 32) valueStart++;
    let valueEnd = end;
    while (valueEnd > valueStart && style.charCodeAt(valueEnd - 1) <= 32)
      valueEnd--;

    const rawValue = style.substring(valueStart, valueEnd);

    if (rawKey && rawValue) {
      // Convert kebab-case to camelCase using pre-compiled regex
      const key = rawKey.replace(KEBAB_REGEX, (_, c) => c.toUpperCase());
      result[key] = rawValue;
    }

    start = end + 1;
  }

  return result;
}

/**
 * Check if a CSS property value is inheritable
 * Used for optimizing style inheritance propagation
 */
const INHERITABLE_PROPERTIES: Set<string> = new Set([
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
]);

export function isInheritableProperty(prop: string): boolean {
  return INHERITABLE_PROPERTIES.has(prop);
}
