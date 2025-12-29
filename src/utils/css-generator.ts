import type { CSSProperties } from '../lynx/types';
import { BLOCK_TAG_MAP } from '../transform/plugins/structure/tag-config';
import {
  generateAllCSSVariables,
  resolveCSSVariables,
} from './css-variables';

/**
 * 将camelCase转换为kebab-case
 * @example camelToKebab('flexDirection') => 'flex-direction'
 */
function camelToKebab(camel: string): string {
  return camel.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * 不需要单位的CSS属性列表（使用 camelCase）
 */
const UNITLESS_PROPERTIES = new Set([
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'opacity',
  'zIndex',
  'order',
  'fontWeight',
  'lineHeight',
]);

/**
 * 将CSS属性值转换为CSS字符串
 * 数字值添加px单位（除了某些特殊属性）
 */
function styleValueToString(
  value: string | number,
  key: string,
): string {
  if (typeof value === 'number') {
    // 检查属性是否需要单位
    if (UNITLESS_PROPERTIES.has(key)) {
      return `${value}`;
    }
    return `${value}px`;
  }
  return value;
}

/**
 * 将CSSProperties对象转换为CSS字符串
 * @param props - CSS属性对象
 * @param mode - 'light' 或 'dark'，用于解析 CSS 变量
 */
function cssPropertiesToString(
  props: CSSProperties,
  mode: 'light' | 'dark' = 'light',
): string {
  return Object.entries(props)
    .map(([key, value]) => {
      const cssKey = camelToKebab(key);
      // 处理 CSS 变量
      let cssValue = styleValueToString(value, key);
      if (typeof cssValue === 'string' && cssValue.includes('var(')) {
        cssValue = resolveCSSVariables(cssValue, mode);
      }
      return `  ${cssKey}: ${cssValue};`;
    })
    .join('\n');
}

/**
 * 生成CSS类规则
 * @param tag - HTML标签名
 * @param style - CSS样式对象
 * @param rootClass - 根容器class名
 * @param mode - 'light' 或 'dark'
 */
function generateClassRule(
  tag: string,
  style: CSSProperties,
  rootClass: string,
  mode: 'light' | 'dark' = 'light',
): string {
  const className = `lhr-${tag}`;
  const styleString = cssPropertiesToString(style, mode);
  return `.${rootClass}${mode === 'dark' ? '.lhr-dark' : ''} .${className} {\n${styleString}\n}`;
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
 * // .lynx-html-renderer {
 * //   --lhr-border-color: #dee2e6;
 * //   ...
 * // }
 * // .lynx-html-renderer .lhr-p {
 * //   margin-bottom: 1em;
 * // }
 * // .lynx-html-renderer.lhr-dark .lhr-p {
 * //   margin-bottom: 1em;
 * // }
 * // ...
 * ```
 */
export function generateCSS(rootClass: string = 'lynx-html-renderer'): string {
  const rules: string[] = [];

  // 添加 CSS 变量定义（保留用于参考）
  rules.push(generateAllCSSVariables(rootClass));

  // 找出所有使用 CSS 变量的标签
  const tagsWithVariables: string[] = [];
  for (const [tag, mapping] of Object.entries(BLOCK_TAG_MAP)) {
    if (mapping.defaultStyle && Object.keys(mapping.defaultStyle).length > 0) {
      const styleString = JSON.stringify(mapping.defaultStyle);
      if (styleString.includes('var(')) {
        tagsWithVariables.push(tag);
      }
    }
  }

  // 生成 light 模式规则
  for (const [tag, mapping] of Object.entries(BLOCK_TAG_MAP)) {
    if (mapping.defaultStyle && Object.keys(mapping.defaultStyle).length > 0) {
      const rule = generateClassRule(tag, mapping.defaultStyle, rootClass, 'light');
      rules.push(rule);
    }
  }

  // 为使用 CSS 变量的标签生成 dark 模式规则
  for (const tag of tagsWithVariables) {
    const mapping = BLOCK_TAG_MAP[tag];
    if (mapping.defaultStyle && Object.keys(mapping.defaultStyle).length > 0) {
      const rule = generateClassRule(tag, mapping.defaultStyle, rootClass, 'dark');
      rules.push(rule);
    }
  }

  // 添加文件头注释
  const header = `/*
 * Lynx HTML Renderer - Default Styles
 * Generated from TAG_MAP defaultStyle definitions
 * Root class: .${rootClass}
 * Dark mode class: .${rootClass}.lhr-dark
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
