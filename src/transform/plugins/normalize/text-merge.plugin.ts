import type { TransformPlugin, LynxNode } from '../../types';
import { mergeAllTextNodes } from '../../../lynx/utils';

/**
 * 文本合并插件
 * 职责：递归合并所有相邻的文本节点
 */
export const textMergePlugin: TransformPlugin = {
  name: 'text-merge',
  phase: 'normalize',
  order: 20,

  apply(ctx) {
    // 递归合并所有文本节点
    ctx.root = mergeAllTextNodes(ctx.root) as LynxNode;
  },
};
