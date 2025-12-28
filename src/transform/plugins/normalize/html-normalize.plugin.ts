import type { HtmlAstNode, TransformPlugin } from '../../types';

/**
 * HTML 归一化插件
 * 职责：空白字符归一化、清理空白节点
 */
export const htmlNormalizePlugin: TransformPlugin = {
  name: 'html-normalize',
  phase: 'normalize',
  order: 10,

  apply(ctx) {
    // 遍历 AST，归一化空白字符
    ctx.utils.walkAst((node: HtmlAstNode) => {
      if (node.type === 'text' && node.data !== undefined) {
        // 归一化空白字符：将多个空格合并为一个，但保留换行
        // 这里我们只清理纯空白节点，不做激进的空白处理
        if (node.data.trim().length === 0) {
          // 标记为空白节点，后续处理
          (node as unknown as Record<string, unknown>).isWhitespace = true;
        }
      }
    });
  },
};
