import { isTagNode, isTextNode, isWhitespaceNode } from '../../../ast/types';
import { createLynxNode } from '../../../lynx/factory';
import type {
  HtmlAstNode,
  LynxNode,
  LynxTextNode,
  TransformContext,
  TransformPlugin,
} from '../../types';
import { BLOCK_TAG_MAP, type TagMapping } from './tag-config';

const TAG_MARKS: Record<string, LynxTextNode['marks']> = {
  strong: { bold: true },
  b: { bold: true },
  em: { italic: true },
  i: { italic: true },
  u: { underline: true },
  code: { code: true },
};

export const blockStructurePlugin: TransformPlugin = {
  name: 'block-structure',
  phase: 'structure',
  order: 10,
  apply(ctx) {
    if (ctx.root.kind !== 'element') return;
    ctx.root.children = convertChildren(ctx.ast.children ?? [], ctx);
  },
};

function convertChildren(
  children: HtmlAstNode[],
  ctx: TransformContext,
  marks?: LynxTextNode['marks'],
): LynxNode[] {
  return children.flatMap((child, index) =>
    convertAstNode(child, ctx, marks, children, index),
  );
}

function convertAstNode(
  astNode: HtmlAstNode,
  ctx: TransformContext,
  parentMarks?: LynxTextNode['marks'],
  siblings: HtmlAstNode[] = [],
  siblingIndex = -1,
): LynxNode[] {
  if (isTextNode(astNode)) {
    const content = astNode.data ?? '';
    if (
      (isWhitespaceNode(astNode) || content.trim().length === 0) &&
      !shouldPreserveInlineWhitespace(siblings, siblingIndex, ctx)
    )
      return [];
    return [
      createLynxNode({
        kind: 'text',
        content: content.trim().length === 0 ? ' ' : content,
        marks: parentMarks,
        meta: { source: 'text' },
      }),
    ];
  }

  if (!isTagNode(astNode)) return [];
  const tag = astNode.name.toLowerCase().trim();
  // Document wrappers carry content, while head and executable/style content
  // are excluded even when unknown tags use a fallback.
  if (tag === 'head' || tag === 'script' || tag === 'style') return [];
  const isDocumentWrapper = tag === 'html' || tag === 'body';
  if (isDocumentWrapper && !astNode.attribs?.style && !astNode.attribs?.class) {
    return convertChildren(astNode.children ?? [], ctx, parentMarks);
  }

  const customMappings = ctx.metadata.tagMappings;
  const isCustom = !!customMappings && Object.hasOwn(customMappings, tag);
  let mapping: TagMapping | undefined = isCustom
    ? customMappings?.[tag]
    : isDocumentWrapper
      ? BLOCK_TAG_MAP.div
      : Object.hasOwn(BLOCK_TAG_MAP, tag)
        ? BLOCK_TAG_MAP[tag]
        : undefined;
  if (!mapping) {
    if (ctx.metadata.unknownTagPolicy === 'unwrap') {
      return convertChildren(astNode.children ?? [], ctx, parentMarks);
    }
    if (ctx.metadata.unknownTagPolicy !== 'fallback') return [];
    mapping = {
      lynxTag: tag,
      role: 'block',
      capabilities: { layout: 'flex', isVoid: false },
    };
  }

  if (mapping.lynxTag === '__BR__') {
    return [
      createLynxNode({
        kind: 'text',
        content: '\n',
        marks: parentMarks,
        meta: { source: 'br' },
      }),
    ];
  }

  const marks = isCustom ? parentMarks : { ...parentMarks, ...TAG_MARKS[tag] };
  const node = createLynxNode({
    kind: 'element',
    tag: mapping.lynxTag,
    role: mapping.role,
    capabilities: { ...mapping.capabilities },
    props: {},
    children: convertChildren(
      astNode.children ?? [],
      ctx,
      marks && Object.keys(marks).length ? marks : undefined,
    ),
    meta: {
      sourceTag: tag,
      sourceAttrs: astNode.attribs,
      ...(isCustom && { customMapping: true }),
    },
  });
  if (node.kind !== 'element') return [node];

  const styleMode = ctx.metadata.styleMode;
  const defaultStyle = { ...mapping.defaultStyle };
  // Formatting tags inherit color instead of resetting it to the theme default.
  if (!isCustom && TAG_MARKS[tag]) delete defaultStyle.color;
  if (
    !isCustom &&
    styleMode === 'css-class' &&
    Object.keys(defaultStyle).length
  ) {
    node.props.className = `lhr-${isDocumentWrapper ? 'div' : tag}`;
  } else if (Object.keys(defaultStyle).length) {
    node.props.style = defaultStyle;
  }
  if (tag === 'a') {
    node.props['data-href'] = astNode.attribs?.href;
    if (styleMode === 'inline') {
      node.props.style = { ...node.props.style, ...ctx.metadata.linkStyle };
    }
  }
  if (tag === 'td' || tag === 'th') {
    for (const [attr, prop] of [
      ['rowspan', 'rowSpan'],
      ['colspan', 'colSpan'],
    ]) {
      const value = astNode.attribs?.[attr];
      if (value) node.props[prop] = Number.parseInt(value, 10);
    }
  }
  if (isCustom || !Object.hasOwn(BLOCK_TAG_MAP, tag)) {
    for (const [key, value] of Object.entries(astNode.attribs ?? {})) {
      if (key !== 'style' && key !== 'class') node.props[key] = value;
    }
  }
  return [node];
}

function findRenderableSibling(
  siblings: HtmlAstNode[],
  startIndex: number,
  step: -1 | 1,
  ctx: TransformContext,
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
      if (tag && resolveMapping(tag, ctx)) {
        return sibling;
      }
    }
  }

  return null;
}

function isInlineRenderableNode(
  node: HtmlAstNode | null,
  ctx: TransformContext,
): boolean {
  if (!node) return false;

  if (isTextNode(node)) {
    return (node.data ?? '').trim().length > 0;
  }

  if (!isTagNode(node)) {
    return false;
  }

  const tag = node.name?.toLowerCase().trim();
  if (!tag) return false;

  const mapping = resolveMapping(tag, ctx);
  if (!mapping) return false;

  return mapping.role === 'inline' || mapping.role === 'image';
}

function shouldPreserveInlineWhitespace(
  siblings: HtmlAstNode[],
  siblingIndex: number,
  ctx: TransformContext,
): boolean {
  if (siblingIndex < 0) return false;

  const previous = findRenderableSibling(siblings, siblingIndex - 1, -1, ctx);
  const next = findRenderableSibling(siblings, siblingIndex + 1, 1, ctx);

  return (
    isInlineRenderableNode(previous, ctx) && isInlineRenderableNode(next, ctx)
  );
}

function resolveMapping(
  tag: string,
  ctx: TransformContext,
): TagMapping | undefined {
  const custom = ctx.metadata.tagMappings;
  if (custom && Object.hasOwn(custom, tag)) return custom[tag];
  return Object.hasOwn(BLOCK_TAG_MAP, tag) ? BLOCK_TAG_MAP[tag] : undefined;
}
