import { parseDocument } from 'htmlparser2';
import type { LynxNode } from './typings.js';

const TAG_MAP: Record<
  string,
  {
    lynxTag: string;
    defaultStyle?: Record<string, any>;
  }
> = {
  div: { lynxTag: 'view', defaultStyle: { flexDirection: 'column' } },
  section: { lynxTag: 'view', defaultStyle: { flexDirection: 'column' } },

  p: { lynxTag: 'text', defaultStyle: { marginBottom: '1em' } },
  span: { lynxTag: 'text' },

  strong: { lynxTag: 'text', defaultStyle: { fontWeight: 'bold' } },
  b: { lynxTag: 'text', defaultStyle: { fontWeight: 'bold' } },
  em: { lynxTag: 'text', defaultStyle: { fontStyle: 'italic' } },

  img: { lynxTag: 'image' },

  br: { lynxTag: '__BR__' },
};

function parseStyle(style?: string): Record<string, any> {
  if (!style) return {};

  const res: Record<string, any> = {};

  style.split(';').forEach((item) => {
    const [rawKey, rawValue] = item.split(':');
    if (!rawKey || !rawValue) return;

    const key = rawKey.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = rawValue.trim();

    res[key] = value;
  });

  return res;
}

function transformChildren(
  nodes: ReturnType<typeof parseDocument>['children'],
): LynxNode[] {
  const result: LynxNode[] = [];

  for (const node of nodes) {
    const transformed = transformNode(node);
    if (!transformed) continue;

    // 合并相邻文本节点
    const last = result[result.length - 1];
    if (
      last?.kind === 'text' &&
      transformed.kind === 'text' &&
      !transformed.props
    ) {
      last.content += transformed.content;
    } else {
      result.push(transformed);
    }
  }

  return result;
}

function transformNode(node: any): LynxNode | null {
  // 文本节点
  if (node.type === 'text') {
    const content = node.data;
    if (!content || !content.trim()) return null;

    return {
      kind: 'text',
      content,
    };
  }

  // 只处理 element
  if (node.type !== 'tag') return null;

  const tag = node.name.toLowerCase();
  const mapping = TAG_MAP[tag];

  // 不支持的标签直接 drop
  if (!mapping) return null;

  // br 特殊处理
  if (mapping.lynxTag === '__BR__') {
    return {
      kind: 'text',
      content: '\n',
      meta: { source: 'br' },
    };
  }

  const styleFromAttr = parseStyle(node.attribs?.style);
  const style = {
    ...(mapping.defaultStyle ?? {}),
    ...styleFromAttr,
  };

  // image 特殊
  if (mapping.lynxTag === 'image') {
    return {
      kind: 'element',
      tag: 'image',
      props: {
        src: node.attribs?.src,
        style,
      },
      children: [],
      meta: { sourceTag: tag },
    };
  }

  // text 容器（p / span / strong 等）
  if (mapping.lynxTag === 'text') {
    return {
      kind: 'element',
      tag: 'text',
      props: Object.keys(style).length ? { style } : {},
      children: transformChildren(node.children ?? []),
      meta: { sourceTag: tag },
    };
  }

  // 普通 view
  return {
    kind: 'element',
    tag: mapping.lynxTag,
    props: Object.keys(style).length ? { style } : {},
    children: transformChildren(node.children ?? []),
    meta: { sourceTag: tag },
  };
}

export function transformHTML(html: string): LynxNode[] {
  const document = parseDocument(html);
  return transformChildren(document.children);
}
