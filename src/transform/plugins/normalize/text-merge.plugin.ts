import { mergeAllTextNodes } from '../../../lynx/utils';
import type { LynxNode, TransformPlugin } from '../../types';

/**
 * 文本合并插件
 * 职责：递归合并所有相邻的文本节点
 *
 * 注意：此插件必须在 structure phase 之后执行
 * 因此放在 structure phase 的最后（order: 999）
 * 这样可以合并 structure phase 创建的所有文本节点（包括 br 转换的换行符）
 */
export const textMergePlugin: TransformPlugin = {
  name: 'text-merge',
  phase: 'structure',
  order: 999, // 在所有 structure 插件之后执行

  apply(ctx) {
    // 递归合并所有文本节点
    ctx.root = mergeAllTextNodes(ctx.root) as LynxNode;
  },
};
