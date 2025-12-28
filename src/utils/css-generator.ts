import type { CSSProperties } from '../lynx/types';
import { BLOCK_TAG_MAP } from '../transform/plugins/structure/tag-config';

/**
 * 将camelCase转换为kebab-case
 * @example camelToKebab('flexDirection') => 'flex-direction'
 */
function camelToKebab(camel: string): string {
  return camel.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * 将CSS属性值转换为CSS字符串
 * 数字值添加px单位（除了某些特殊属性）
 */
function styleValueToString(value: string | number): string {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}

/**
 * 将CSSProperties对象转换为CSS字符串
 */
function cssPropertiesToString(props: CSSProperties): string {
  return Object.entries(props)
    .map(([key, value]) => {
      const cssKey = camelToKebab(key);
      const cssValue = styleValueToString(value);
      return `  ${cssKey}: ${cssValue};`;
    })
    .join('\n');
}

/**
 * 生成CSS类规则
 */
function generateClassRule(
  tag: string,
  style: CSSProperties,
  rootClass: string,
): string {
  const className = `lhr-${tag}`;
  const styleString = cssPropertiesToString(style);
  return `.${rootClass} .${className} {\n${styleString}\n}`;
}

/**
 * 为所有defaultStyle生成CSS
 * @param rootClass 根容器class名，默认 'lynx-html-renderer'
 * @returns 完整的CSS字符串
 *
 * @example
 * ```ts
 * const css = generateCSS();
 * console.log(css);
 * // .lynx-html-renderer .lhr-p {
 * //   margin-bottom: 1em;
 * // }
 * // ...
 * ```
 */
export function generateCSS(rootClass: string = 'lynx-html-renderer'): string {
  const rules: string[] = [];

  // 遍历所有标签配置
  for (const [tag, mapping] of Object.entries(BLOCK_TAG_MAP)) {
    if (mapping.defaultStyle && Object.keys(mapping.defaultStyle).length > 0) {
      const rule = generateClassRule(tag, mapping.defaultStyle, rootClass);
      rules.push(rule);
    }
  }

  // 添加文件头注释
  const header = `/*
 * Lynx HTML Renderer - Default Styles
 * Generated from TAG_MAP defaultStyle definitions
 * Root class: .${rootClass}
 */`;

  return `${header}\n\n${rules.join('\n\n')}\n`;
}

/**
 * 获取CSS类名（供运行时使用）
 * @param tag HTML标签名
 * @returns CSS类名，如果标签没有defaultStyle则返回null
 *
 * @example
 * ```ts
 * getClassNameForTag('p'); // => 'lhr-p'
 * getClassNameForTag('h1'); // => 'lhr-h1'
 * getClassNameForTag('unknown'); // => null
 * ```
 */
export function getClassNameForTag(tag: string): string | null {
  const mapping = BLOCK_TAG_MAP[tag];
  if (
    !mapping ||
    !mapping.defaultStyle ||
    Object.keys(mapping.defaultStyle).length === 0
  ) {
    return null;
  }
  return `lhr-${tag}`;
}
