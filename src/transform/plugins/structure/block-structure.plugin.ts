import { isTagNode, isTextNode, isWhitespaceNode } from '../../../ast/types';
import { createElementNode, createLynxNode } from '../../../lynx/factory';
import { getTextClassNameForTag } from '../../../utils/css-generator';
import type {
  CSSProperties,
  HtmlAstNode,
  LynxElementNode,
  LynxNode,
  TransformPlugin,
} from '../../types';
import { extractInheritableStyles } from '../../utils/inheritable-properties';
import { BLOCK_TAG_MAP } from './tag-config';

/**
 * 检查节点是否为元素节点
 */
function isElementNode(node: LynxNode): node is LynxElementNode {
  return node.kind === 'element';
}

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
    const lynxChildren = astChildren.map(
      (astNode, index) =>
        convertAstNode(
          astNode,
          ctx,
          undefined,
          undefined,
          undefined,
          astChildren,
          index,
        ), // 无父级样式/类名
    );
    ctx.root.children = lynxChildren.filter((n): n is LynxNode => n !== null);

    // Note: Text merging is now ONLY handled by text-merge.plugin in normalize phase
    // This avoids redundant tree traversals while maintaining plugin modularity
    // The br->\n conversions will be merged when normalize phase runs
  },
};

/**
 * 递归转换 AST 节点为 LynxNode
 */
function convertAstNode(
  astNode: HtmlAstNode,
  ctx: { metadata: Record<string, unknown> },
  parentMarks?: Record<string, boolean>,
  parentInheritableStyles?: CSSProperties, // inline 模式：继承的样式
  parentInheritableClasses?: string, // css-class 模式：继承的类名
  siblings: HtmlAstNode[] = [],
  siblingIndex = -1,
): LynxNode | null {
  // Extract styleMode once at the beginning (optimization: avoid repeated property access)
  const styleMode =
    (ctx.metadata.styleMode as 'inline' | 'css-class') ?? 'inline';

  // 处理文本节点
  if (isTextNode(astNode)) {
    const content = astNode.data ?? '';
    if (
      (isWhitespaceNode(astNode) || content.trim().length === 0) &&
      !shouldPreserveInlineWhitespace(siblings, siblingIndex)
    ) {
      return null;
    }

    return createLynxNode({
      kind: 'text',
      content: content.trim().length === 0 ? ' ' : content,
      marks: parentMarks,
      inheritableStyles: parentInheritableStyles, // inline 模式
      inheritableClasses: parentInheritableClasses, // css-class 模式
      meta: { source: 'text' },
    });
  }

  // 处理标签节点
  if (isTagNode(astNode)) {
    const tag = astNode.name?.toLowerCase().trim();
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
      const lynxChildren = astChildren.map((child, index) =>
        convertAstNode(
          child,
          ctx,
          newMarks,
          parentInheritableStyles, // 保持原样传递
          parentInheritableClasses, // 保持原样传递
          astChildren,
          index,
        ),
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

    // 根据模式收集继承信息
    let currentInheritableStyles: CSSProperties = {};
    let currentInheritableClasses = '';

    if (styleMode === 'inline') {
      // Inline 模式：提取可继承样式
      const currentDefaultStyle = mapping.defaultStyle;
      currentInheritableStyles = extractInheritableStyles(currentDefaultStyle);
    } else {
      // CSS-Class 模式：使用 text class
      currentInheritableClasses = getTextClassNameForTag(tag) ?? '';
    }

    // 合并父元素的继承信息
    const mergedInheritableStyles: CSSProperties = {
      ...parentInheritableStyles,
      ...currentInheritableStyles,
    };

    const mergedInheritableClasses = parentInheritableClasses
      ? `${parentInheritableClasses} ${currentInheritableClasses}`.trim()
      : currentInheritableClasses;

    // 过滤掉空字符串
    const finalInheritableClasses = mergedInheritableClasses || undefined;

    // 处理链接标签（在合并继承信息之后）
    if (tag === 'a' && mapping.lynxTag === 'text') {
      const href = astNode.attribs?.href;

      // 获取自定义链接样式
      const linkStyle =
        (ctx.metadata.linkStyle as
          | Record<string, string | number>
          | undefined) ?? {};

      // 合并默认样式和自定义样式
      const props: Record<string, unknown> = {
        'data-href': href,
        style: { ...mapping.defaultStyle, ...linkStyle },
      };

      const linkChildren = astChildren.map((child, index) =>
        convertAstNode(
          child,
          ctx,
          parentMarks,
          mergedInheritableStyles,
          finalInheritableClasses,
          astChildren,
          index,
        ),
      );

      return createElementNode(
        'text',
        props,
        linkChildren.filter((n): n is LynxNode => n !== null),
      );
    }

    const lynxChildren = astChildren.map((child, index) =>
      convertAstNode(
        child,
        ctx,
        parentMarks,
        mergedInheritableStyles, // inline 模式
        finalInheritableClasses, // css-class 模式（过滤空值）
        astChildren,
        index,
      ),
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

    // 添加 defaultStyle 和 capabilities
    if (isElementNode(lynxNode)) {
      if ((tag === 'td' || tag === 'th') && astNode.attribs) {
        const rowSpan = astNode.attribs.rowspan;
        const colSpan = astNode.attribs.colspan;

        if (rowSpan) {
          lynxNode.props.rowSpan = Number.parseInt(rowSpan, 10);
        }
        if (colSpan) {
          lynxNode.props.colSpan = Number.parseInt(colSpan, 10);
        }
      }

      // 添加 defaultStyle
      if (
        mapping.defaultStyle &&
        Object.keys(mapping.defaultStyle).length > 0
      ) {
        if (styleMode === 'css-class') {
          // CSS类模式：添加className
          lynxNode.props.className = `lhr-${tag}`;
        } else {
          // 内联样式模式：添加inline style
          lynxNode.props.style = { ...mapping.defaultStyle };
        }
      }

      // 添加 capabilities
      if (mapping.capabilities) {
        lynxNode.capabilities = mapping.capabilities;
      }
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

function findRenderableSibling(
  siblings: HtmlAstNode[],
  startIndex: number,
  step: -1 | 1,
): HtmlAstNode | null {
  for (
    let index = startIndex;
    index >= 0 && index < siblings.length;
    index += step
  ) {
    const sibling = siblings[index];

    if (isTextNode(sibling)) {
      if ((sibling.data ?? '').trim().length > 0) {
        return sibling;
      }
      continue;
    }

    if (isTagNode(sibling)) {
      const tag = sibling.name?.toLowerCase().trim();
      if (tag && BLOCK_TAG_MAP[tag]) {
        return sibling;
      }
    }
  }

  return null;
}

function isInlineRenderableNode(node: HtmlAstNode | null): boolean {
  if (!node) return false;

  if (isTextNode(node)) {
    return (node.data ?? '').trim().length > 0;
  }

  if (!isTagNode(node)) {
    return false;
  }

  const tag = node.name?.toLowerCase().trim();
  if (!tag) return false;

  const mapping = BLOCK_TAG_MAP[tag];
  if (!mapping) return false;

  return mapping.role === 'inline' || mapping.role === 'image';
}

function shouldPreserveInlineWhitespace(
  siblings: HtmlAstNode[],
  siblingIndex: number,
): boolean {
  if (siblingIndex < 0) return false;

  const previous = findRenderableSibling(siblings, siblingIndex - 1, -1);
  const next = findRenderableSibling(siblings, siblingIndex + 1, 1);

  return isInlineRenderableNode(previous) && isInlineRenderableNode(next);
}
