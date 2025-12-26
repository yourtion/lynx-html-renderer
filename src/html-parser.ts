/**
 * HTML转换主函数
 * 使用新的插件系统实现
 */
import { transformHTML as newTransformHTML } from './transform/engine';
import type { LynxNode, TransformOptions } from './typings';

/**
 * HTML转换主函数
 * 兼容旧 API，内部调用新的插件系统
 * @deprecated 使用新的 transform/engine.ts 中的 transformHTML
 */
export function transformHTML(
  html: string,
  options?: TransformOptions,
): LynxNode[] {
  return newTransformHTML(html, options);
}

// 重新导出新的 transformHTML
export { transformHTML as transformHTMLNew } from './transform/engine';
