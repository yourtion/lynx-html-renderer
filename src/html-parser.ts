/**
 * HTML转换主函数
 * 使用插件系统将 HTML 字符串转换为 LynxNode 数组
 */
import { transformHTML } from './transform/engine';
import type { LynxNode, TransformOptions } from './typings';

// 重新导出以保持向后兼容
export { transformHTML };

export type { LynxNode, TransformOptions };
