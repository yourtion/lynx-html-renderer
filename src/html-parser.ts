import { parseDocument } from 'htmlparser2';
import { pluginManager } from './plugin-system';
import type { Capabilities, ElementRole, LynxNode } from './typings';

// 定义 htmlparser2 节点类型接口
interface HtmlParserNode {
  type: string;
  data?: string;
  name?: string;
  attribs?: Record<string, string>;
  children?: HtmlParserNode[];
}

const TAG_MAP: Record<
  string,
  {
    lynxTag: string;
    role: ElementRole;
    capabilities: Capabilities;
    defaultStyle?: Record<string, string | number>;
  }
> = {
  // Block elements
  div: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  section: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  article: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  header: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  footer: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  nav: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  aside: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },

  // Text elements
  p: {
    lynxTag: 'text',
    role: 'textContainer',
    capabilities: { layout: 'block', textContainer: true, isVoid: false },
    defaultStyle: { marginBottom: '1em' },
  },
  span: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
  },

  // Text formatting
  strong: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { fontWeight: 'bold' },
  },
  b: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { fontWeight: 'bold' },
  },
  em: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { fontStyle: 'italic' },
  },
  i: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { fontStyle: 'italic' },
  },
  u: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { textDecoration: 'underline' },
  },
  code: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { fontFamily: 'monospace' },
  },

  // Image
  img: {
    lynxTag: 'image',
    role: 'image',
    capabilities: { layout: 'inline', isVoid: true },
  },

  // Line break
  br: {
    lynxTag: '__BR__',
    role: 'inline',
    capabilities: { layout: 'inline', isVoid: true },
  },

  // Table elements
  table: {
    lynxTag: 'view',
    role: 'table',
    capabilities: { layout: 'flex', isVoid: false },
  },
  thead: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
  },
  tbody: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
  },
  tfoot: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
  },
  tr: {
    lynxTag: 'view',
    role: 'row',
    capabilities: { layout: 'flex', isVoid: false },
  },
  th: {
    lynxTag: 'view',
    role: 'cell',
    capabilities: { layout: 'flex', isVoid: false },
  },
  td: {
    lynxTag: 'view',
    role: 'cell',
    capabilities: { layout: 'flex', isVoid: false },
  },
};

function parseStyle(style?: string): Record<string, string | number> {
  if (!style) return {};

  const res: Record<string, string | number> = {};

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
  parentMarks: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
  } = {},
): LynxNode[] {
  const result: LynxNode[] = [];

  for (const node of nodes) {
    const transformed = transformNode(node, parentMarks);
    if (!transformed) continue;

    // 合并相邻文本节点
    const last = result[result.length - 1];
    if (last?.kind === 'text' && transformed.kind === 'text') {
      // 合并文本内容
      last.content += transformed.content;

      // 只在有标记时才合并和保留 marks
      if (last.marks || transformed.marks) {
        last.marks = {
          ...last.marks,
          ...transformed.marks,
        };
      }
    } else {
      result.push(transformed);
    }
  }

  return result;
}

function transformNode(
  node: HtmlParserNode,
  parentMarks: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
  } = {},
): LynxNode | null {
  // 文本节点
  if (node.type === 'text') {
    const content = node.data;
    if (!content.trim()) return null;

    const result = {
      kind: 'text',
      content: content || '',
    };

    // 只有当有标记时才添加 marks 字段，保持与原有测试兼容
    const hasMarks = Object.values(parentMarks).some(Boolean);
    if (hasMarks) {
      result.marks = { ...parentMarks };
    }

    // 应用节点后处理器
    let processedNode = result;
    for (const processor of pluginManager.getNodePostProcessors()) {
      processedNode = processor(processedNode);
    }

    return processedNode;
  }

  // 只处理 element
  if (node.type !== 'tag') return null;

  const tag = node.name.toLowerCase();
  const mapping = TAG_MAP[tag];

  // 获取该标签的所有处理器
  const tagHandlers = pluginManager.getTagHandlers(tag);

  // 如果标签不在 TAG_MAP 中且没有处理器，直接 drop
  if (!mapping && tagHandlers.length === 0) return null;

  // 默认转换函数
  const defaultTransform = (): LynxNode | null => {
    // 如果标签不在 TAG_MAP 中，默认转换不处理
    if (!mapping) return null;
    // br 特殊处理
    if (mapping.lynxTag === '__BR__') {
      return {
        kind: 'text',
        content: '\n',
        meta: { source: 'br' },
      };
    }

    // 解析内联样式
    let styleFromAttr = parseStyle(node.attribs?.style);

    // 应用样式处理器
    for (const styleHandler of pluginManager.getStyleHandlers()) {
      styleFromAttr = styleHandler(styleFromAttr, node);
    }

    // 处理文本标记样式
    const textMarkStyle: Record<string, string | number> = {};
    if (tag === 'strong' || tag === 'b') {
      textMarkStyle.fontWeight = 'bold';
    } else if (tag === 'em' || tag === 'i') {
      textMarkStyle.fontStyle = 'italic';
    } else if (tag === 'u') {
      textMarkStyle.textDecoration = 'underline';
    } else if (tag === 'code') {
      textMarkStyle.fontFamily = 'monospace';
    }

    const style = {
      ...(mapping.defaultStyle ?? {}),
      ...textMarkStyle,
      ...styleFromAttr,
    };

    // 基础元素节点结构
    const baseNode = {
      kind: 'element',
      tag: mapping.lynxTag,
      props: {},
      children: mapping.capabilities.isVoid
        ? []
        : transformChildren(node.children ?? [], parentMarks),
      meta: { sourceTag: tag },
    };

    // 处理图片元素，始终添加 style 属性（即使是空对象）以匹配测试用例
    if (mapping.lynxTag === 'image') {
      baseNode.props.style = style;
      baseNode.props.src = node.attribs?.src;
    }
    // 其他元素只有当 style 对象有属性时才添加 style
    else if (Object.keys(style).length > 0) {
      baseNode.props.style = style;
    }

    // 处理其他 void 元素
    if (mapping.capabilities.isVoid && mapping.lynxTag !== 'image') {
      return baseNode;
    }

    // 返回基础节点，暂不包含 role 和 capabilities，保持与原有测试兼容
    return baseNode;
  };

  // 尝试使用插件处理器
  for (const handler of tagHandlers) {
    const result = handler(node, {
      defaultTransform,
      transformChildren: (nodes) => transformChildren(nodes, parentMarks),
    });

    if (result !== null) {
      // 应用节点后处理器
      let processedNode = result;
      for (const processor of pluginManager.getNodePostProcessors()) {
        processedNode = processor(processedNode);
      }

      return processedNode;
    }
  }

  // 使用默认转换
  const result = defaultTransform();

  // 应用节点后处理器
  if (result !== null) {
    let processedNode = result;
    for (const processor of pluginManager.getNodePostProcessors()) {
      processedNode = processor(processedNode);
    }

    return processedNode;
  }

  return null;
}

export function transformHTML(html: string): LynxNode[] {
  const document = parseDocument(html);
  return transformChildren(document.children);
}
