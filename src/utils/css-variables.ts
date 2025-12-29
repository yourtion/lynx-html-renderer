/**
 * CSS Variables System for Dark Mode Support
 *
 * Note: Lynx has limited support for CSS variables, so we use direct values
 * in dark mode rules instead of relying on CSS variables.
 */

/**
 * CSS 变量定义
 */
export interface CSSVariables {
  [name: string]: string;
}

/**
 * Light mode CSS 变量（作为颜色值的参考）
 */
export const LIGHT_MODE_VARS: CSSVariables = {
  '--lhr-border-color': '#dee2e6',
  '--lhr-bg-color-secondary': '#f8f9fa',
  '--lhr-bg-color-tertiary': '#f5f5f5',
  '--lhr-divider-color': '#ccc',
  '--lhr-blockquote-border': '#ddd',
};

/**
 * Dark mode CSS 变量（作为颜色值的参考）
 */
export const DARK_MODE_VARS: CSSVariables = {
  '--lhr-border-color': '#404040',
  '--lhr-bg-color-secondary': '#2d2d2d',
  '--lhr-bg-color-tertiary': '#1e1e1e',
  '--lhr-divider-color': '#3a3a3a',
  '--lhr-blockquote-border': '#555',
};

/**
 * 生成 CSS 变量规则（保留用于参考，但不实际使用）
 */
export function generateCSSVariables(
  rootClass: string,
  variables: CSSVariables,
): string {
  const entries = Object.entries(variables)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

  return `.${rootClass} {\n${entries}\n}`;
}

/**
 * 获取颜色值的映射关系（用于替换 var()）
 */
export function getVariableMapping(
  mode: 'light' | 'dark',
): Record<string, string> {
  const vars = mode === 'dark' ? DARK_MODE_VARS : LIGHT_MODE_VARS;
  const mapping: Record<string, string> = {};

  for (const [name, value] of Object.entries(vars)) {
    // 移除 -- 前缀，用于查找
    const key = name.replace(/^--/, '');
    mapping[key] = value;
  }

  return mapping;
}

/**
 * 将 CSS 值中的 var() 替换为实际值
 */
export function resolveCSSVariables(
  cssValue: string,
  mode: 'light' | 'dark',
): string {
  const mapping = getVariableMapping(mode);

  // 替换 var(--lhr-xxx) 为实际值
  return cssValue.replace(
    /var\(--lhr-[a-z-]+\)/g,
    (match) => {
      const key = match.match(/--lhr-[a-z-]+/)?.[0];
      if (key) {
        const value = mapping[key.replace(/^--/, '')];
        return value ?? match;
      }
      return match;
    },
  );
}

/**
 * 生成完整的 CSS 变量定义（包括 light 和 dark mode）
 * 注意：这里保留用于参考，但实际使用 resolveCSSVariables 来处理变量
 */
export function generateAllCSSVariables(
  rootClass: string = 'lynx-html-renderer',
): string {
  const lightVars = generateCSSVariables(rootClass, LIGHT_MODE_VARS);
  const darkVars = generateCSSVariables(
    `${rootClass}.lhr-dark`,
    DARK_MODE_VARS,
  );

  return `/* CSS Variables */
${lightVars}

/* Dark Mode CSS Variables */
${darkVars}`;
}
