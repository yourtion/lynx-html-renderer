import { createLynxNode } from '../../../lynx/factory';
import { mergeAllTextNodes } from '../../../lynx/utils';
import type {
  Capabilities,
  HtmlAstNode,
  LynxNode,
  TransformPlugin,
} from '../../types';
import { BLOCK_TAG_MAP } from './tag-config';

/**
 * 块级结构插件
 * 职责：将 HTML AST 中的块级元素转换为 LynxNode
 */
export const blockStructurePlugin: TransformPlugin = {
  name: 'block-structure',
  phase: 'structure',
  order: 10,

  apply(ctx) {
    // 递归转换 AST 为 LynxNode
    const astChildren = ctx.ast.children ?? [];
    const lynxChildren = astChildren.map((astNode) =>
      convertAstNode(astNode, ctx),
    );
    ctx.root.children = lynxChildren.filter((n): n is LynxNode => n !== null);

    // 合并所有相邻的文本节点（包括 br 转换的换行符）
    ctx.root = mergeAllTextNodes(ctx.root) as LynxNode;
  },
};

/**
 * 递归转换 AST 节点为 LynxNode
 */
function convertAstNode(
  astNode: HtmlAstNode,
  ctx: { utils: unknown },
  parentMarks?: Record<string, boolean>,
): LynxNode | null {
  // 处理文本节点
  if (astNode.type === 'text') {
    const content = astNode.data ?? '';
    // 跳过被 html-normalize 标记的纯空白节点
    if ((astNode as unknown as Record<string, unknown>).isWhitespace === true) {
      return null;
    }
    // 跳过纯空白节点（只包含空白字符且 trim 后为空）
    if (content.trim().length === 0) {
      return null;
    }

    return createLynxNode({
      kind: 'text',
      content,
      marks: parentMarks,
      meta: { source: 'text' },
    });
  }

  // 处理标签节点
  if (astNode.type === 'tag') {
    const tag = astNode.name?.toLowerCase();
    if (!tag) return null;

    const mapping = BLOCK_TAG_MAP[tag];
    if (!mapping) return null; // 不支持的标签

    // 处理 br 标签
    if (mapping.lynxTag === '__BR__') {
      return createLynxNode({
        kind: 'text',
        content: '\n',
        meta: { source: 'br' },
      });
    }

    // 处理内联格式化标签（strong、em、u、code）
    const isInlineFormatting =
      tag === 'strong' ||
      tag === 'b' ||
      tag === 'em' ||
      tag === 'i' ||
      tag === 'u' ||
      tag === 'code';

    if (isInlineFormatting && mapping.lynxTag === 'text') {
      // 内联格式化标签不创建包装元素，只传递 marks
      const marks = getTagMarks(tag);
      const newMarks = { ...parentMarks, ...marks };

      // 转换子节点
      const astChildren = astNode.children ?? [];
      const lynxChildren = astChildren.map((child) =>
        convertAstNode(child, ctx, newMarks),
      );

      // 如果只有一个子节点，直接返回（展开）
      if (lynxChildren.length === 1) {
        return lynxChildren[0];
      }

      // 如果有多个子节点，包装在 text 节点中
      return createLynxNode({
        kind: 'element',
        tag: 'text',
        props: {},
        children: lynxChildren.filter((n): n is LynxNode => n !== null),
        meta: { sourceTag: tag },
      });
    }

    // 处理普通元素
    const astChildren = astNode.children ?? [];
    const lynxChildren = astChildren.map((child) =>
      convertAstNode(child, ctx, parentMarks),
    );

    const lynxNode = createLynxNode({
      kind: 'element',
      tag: mapping.lynxTag,
      props: {},
      children: lynxChildren.filter((n): n is LynxNode => n !== null),
      meta: {
        sourceTag: tag,
        // 保存原始 AST 属性，供后续插件使用
        sourceAttrs: astNode.attribs,
      },
    });

    // 添加 defaultStyle
    if (mapping.defaultStyle && Object.keys(mapping.defaultStyle).length > 0) {
      (lynxNode as LynxNode & { props: Record<string, unknown> }).props.style =
        { ...mapping.defaultStyle };
    }

    // 添加 capabilities
    if (mapping.capabilities) {
      (lynxNode as LynxNode & { capabilities: Capabilities }).capabilities =
        mapping.capabilities;
    }

    return lynxNode;
  }

  return null;
}

/**
 * 获取标签对应的 marks
 */
function getTagMarks(tag: string): Record<string, boolean> | undefined {
  const marks: Record<string, Record<string, boolean>> = {
    strong: { bold: true },
    b: { bold: true },
    em: { italic: true },
    i: { italic: true },
    u: { underline: true },
    code: { code: true },
  };
  return marks[tag];
}
