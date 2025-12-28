import type { TransformPlugin } from '../types';
import { layoutCapabilityPlugin } from './capability/layout-capability.plugin';
import { mediaCapabilityPlugin } from './capability/media-capability.plugin';
// Capability Phase
import { styleCapabilityPlugin } from './capability/style-capability.plugin';
// Normalize Phase
import { htmlNormalizePlugin } from './normalize/html-normalize.plugin';
import { textMergePlugin } from './normalize/text-merge.plugin';
// Structure Phase
import { blockStructurePlugin } from './structure/block-structure.plugin';
import { listStructurePlugin } from './structure/list-structure.plugin';
import { tableStructurePlugin } from './structure/table-structure.plugin';

/**
 * 内建插件列表
 * 按阶段和顺序排列
 */
export const builtinPlugins: TransformPlugin[] = [
  // Normalize Phase
  htmlNormalizePlugin,
  textMergePlugin,

  // Structure Phase
  blockStructurePlugin,
  listStructurePlugin,
  tableStructurePlugin,

  // Capability Phase
  styleCapabilityPlugin,
  layoutCapabilityPlugin,
  mediaCapabilityPlugin,
];

// 导出所有插件
export {
  htmlNormalizePlugin,
  textMergePlugin,
  blockStructurePlugin,
  listStructurePlugin,
  tableStructurePlugin,
  styleCapabilityPlugin,
  layoutCapabilityPlugin,
  mediaCapabilityPlugin,
};

/**
 * Get all builtin plugins
 * Used by plugin-info.ts for introspection
 */
export function getBuiltinPlugins(): TransformPlugin[] {
  return builtinPlugins;
}
