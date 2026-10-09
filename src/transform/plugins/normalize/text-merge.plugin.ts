import { mergeAllTextNodes } from '../../../lynx/utils';
import type { LynxNode, TransformPlugin } from '../../types';

/** Merge text only after styles and inheritance have been resolved. */
export const textMergePlugin: TransformPlugin = {
  name: 'text-merge',
  phase: 'finalize',
  order: 20,

  apply(ctx) {
    // 递归合并所有文本节点
    ctx.root = mergeAllTextNodes(ctx.root) as LynxNode;
  },
};
