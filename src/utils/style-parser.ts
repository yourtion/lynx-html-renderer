import type { CSSProperties } from '../transform/types';
import { isInheritableProperty } from './style-schema';

const KEBAB_REGEX = /-([a-z])/g;
const IMPORTANT_REGEX = /!\s*important\s*$/i;

/**
 * Read inline declarations without splitting strings, escapes or functions.
 * Values remain Lynx CSS values: this does not implement browser CSS layout,
 * shorthand expansion, variable resolution or property support detection.
 */
export function parseStyleString(style: string): CSSProperties {
  const result: CSSProperties = {};
  const importantKeys = new Set<string>();
  const closing: string[] = [];
  let declaration = '';
  let colon = -1;
  let quote = '';
  let invalid = false;

  function commit() {
    if (!invalid && colon !== -1) {
      const rawKey = declaration.slice(0, colon).trim();
      const value = declaration.slice(colon + 1).trim();
      if (rawKey && value && !/\s/.test(rawKey)) {
        // Custom properties are case sensitive and must keep their -- prefix.
        const key = rawKey.startsWith('--')
          ? rawKey
          : rawKey
              .toLowerCase()
              .replace(KEBAB_REGEX, (_, c: string) => c.toUpperCase());
        const important = IMPORTANT_REGEX.test(value);
        if (important || !importantKeys.has(key)) {
          result[key] = value;
          if (important) importantKeys.add(key);
        }
      }
    }
    declaration = '';
    colon = -1;
    invalid = false;
  }

  for (let i = 0; i < style.length; i++) {
    const char = style[i];
    if (char === '\\') {
      declaration += char;
      if (i + 1 < style.length) declaration += style[++i];
      continue;
    }
    if (quote) {
      declaration += char;
      if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && style[i + 1] === '*') {
      const end = style.indexOf('*/', i + 2);
      declaration += ' ';
      if (end === -1) break;
      i = end + 1;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '(') closing.push(')');
    else if (char === '[') closing.push(']');
    else if (char === '{') closing.push('}');
    else if (char === ')' || char === ']' || char === '}') {
      if (closing.pop() !== char) invalid = true;
    } else if (closing.length === 0) {
      if (char === ';') {
        commit();
        continue;
      }
      if (char === ':' && colon === -1) colon = declaration.length;
    }
    declaration += char;
  }
  // Discard an unterminated string/function rather than emitting a partial value.
  if (!quote && closing.length === 0) commit();
  return result;
}

export { isInheritableProperty };
