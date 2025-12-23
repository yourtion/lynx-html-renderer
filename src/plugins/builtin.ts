import { pluginManager } from '../plugin-system';
import type {
  ChildrenTransformProcessor,
  HtmlParserNode,
  HtmlToLynxPlugin,
  HtmlTransformProcessor,
  LynxNode,
  NodePostProcessor,
  NodeTransformProcessor,
  StyleHandler,
  TagHandler,
  TopLevelMergeProcessor,
} from '../typings';

/**
 * 内置处理器类型枚举
 * 用于标识不同的内置处理流程，方便用户禁用或插入自定义处理器
 */
export enum BuiltinProcessorType {
  /** 基础标签转换处理器 */
  BASE_TAG_TRANSFORM = 'baseTagTransform',
  /** 文本节点处理器 */
  TEXT_NODE_HANDLER = 'textNodeHandler',
  /** 相邻文本节点合并处理器 */
  MERGE_ADJACENT_TEXT_NODES = 'mergeAdjacentTextNodes',
  /** 样式解析处理器 */
  STYLE_PARSER = 'styleParser',
}

// 定义 htmlparser2 节点类型接口
interface ExtendedHtmlParserNode extends HtmlParserNode {
  name?: string;
  attribs?: Record<string, string>;
  children?: ExtendedHtmlParserNode[];
}

// 定义共享配置对象以减少冗余
const BLOCK_ELEMENT_CONFIG = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
  defaultStyle: { flexDirection: 'column' },
};

const INLINE_TEXT_CONFIG = {
  lynxTag: 'text',
  role: 'inline',
  capabilities: { layout: 'inline', textContainer: true, isVoid: false },
};

const TEXT_CONTAINER_CONFIG = {
  lynxTag: 'text',
  role: 'textContainer',
  capabilities: { layout: 'block', textContainer: true, isVoid: false },
};

const PRE_ELEMENT_CONFIG = {
  lynxTag: 'text',
  role: 'block',
  capabilities: { layout: 'block', textContainer: true, isVoid: false },
};

const LINK_CONFIG = {
  lynxTag: 'text',
  role: 'inline',
  capabilities: { layout: 'inline', textContainer: true, isVoid: false },
};

const HEADING_CONFIG = {
  lynxTag: 'text',
  role: 'textContainer',
  capabilities: { layout: 'block', textContainer: true, isVoid: false },
};

const LIST_ELEMENT_CONFIG = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
  defaultStyle: { flexDirection: 'column', paddingLeft: '40px' },
};

const TABLE_ELEMENT_CONFIG = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
};

const TABLE_CELL_CONFIG = {
  lynxTag: 'view',
  role: 'cell',
  capabilities: { layout: 'flex', isVoid: false },
};

const BLOCK_QUOTE_CONFIG = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
  defaultStyle: {
    flexDirection: 'column',
    marginLeft: '40px',
    marginRight: '40px',
    paddingLeft: '16px',
    borderLeft: '4px solid #ddd',
  },
};

// 标签映射配置
export const TAG_MAP: Record<
  string,
  {
    lynxTag: string;
    role: ElementRole;
    capabilities: Capabilities;
    defaultStyle?: Record<string, string | number>;
  }
> = {
  // Block elements (使用共享配置)
  div: BLOCK_ELEMENT_CONFIG,
  section: BLOCK_ELEMENT_CONFIG,
  article: BLOCK_ELEMENT_CONFIG,
  header: BLOCK_ELEMENT_CONFIG,
  footer: BLOCK_ELEMENT_CONFIG,
  nav: BLOCK_ELEMENT_CONFIG,
  aside: BLOCK_ELEMENT_CONFIG,

  // Text elements
  p: { ...TEXT_CONTAINER_CONFIG, defaultStyle: { marginBottom: '1em' } },
  span: INLINE_TEXT_CONFIG,

  // Heading elements (h1-h6)
  h1: { ...HEADING_CONFIG, defaultStyle: { fontSize: '2em', fontWeight: 'bold', margin: '0.67em 0' } },
  h2: { ...HEADING_CONFIG, defaultStyle: { fontSize: '1.5em', fontWeight: 'bold', margin: '0.83em 0' } },
  h3: { ...HEADING_CONFIG, defaultStyle: { fontSize: '1.17em', fontWeight: 'bold', margin: '1em 0' } },
  h4: { ...HEADING_CONFIG, defaultStyle: { fontSize: '1em', fontWeight: 'bold', margin: '1.33em 0' } },
  h5: { ...HEADING_CONFIG, defaultStyle: { fontSize: '0.83em', fontWeight: 'bold', margin: '1.67em 0' } },
  h6: { ...HEADING_CONFIG, defaultStyle: { fontSize: '0.67em', fontWeight: 'bold', margin: '2.33em 0' } },

  // Text formatting (简化重复配置)
  strong: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontWeight: 'bold' },
  },
  b: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontWeight: 'bold' },
  },
  em: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontStyle: 'italic' },
  },
  i: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontStyle: 'italic' },
  },
  u: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { textDecoration: 'underline' },
  },
  code: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontFamily: 'monospace' },
  },

  // List elements
  ul: LIST_ELEMENT_CONFIG,
  ol: LIST_ELEMENT_CONFIG,
  li: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { display: 'list-item' },
  },

  // Other common elements
  a: {
    ...LINK_CONFIG,
    defaultStyle: { color: 'blue', textDecoration: 'underline' },
  },
  hr: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'block', isVoid: true },
    defaultStyle: { height: '1px', backgroundColor: '#ccc', margin: '1em 0' },
  },
  blockquote: BLOCK_QUOTE_CONFIG,
  pre: {
    ...PRE_ELEMENT_CONFIG,
    defaultStyle: {
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      padding: '16px',
      overflow: 'auto',
    },
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
  thead: TABLE_ELEMENT_CONFIG,
  tbody: TABLE_ELEMENT_CONFIG,
  tfoot: TABLE_ELEMENT_CONFIG,
  tr: {
    lynxTag: 'view',
    role: 'row',
    capabilities: { layout: 'flex', isVoid: false },
  },
  th: TABLE_CELL_CONFIG,
  td: TABLE_CELL_CONFIG,
};

// 结构角色类型
export type ElementRole =
  | 'block'
  | 'inline'
  | 'textContainer'
  | 'image'
  | 'table'
  | 'row'
  | 'cell';

// 能力描述接口
export interface Capabilities {
  layout?: 'block' | 'inline' | 'flex' | 'table';
  isVoid?: boolean; // 如 img / br
  textContainer?: boolean; // 是否只能包含 text
}

// 解析样式字符串为对象
function parseStyleString(style?: string): Record<string, string | number> {
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

// 样式处理器（空实现，保持类型兼容）
export const defaultStyleHandler: StyleHandler = (
  style: Record<string, string | number>,
): Record<string, string | number> => {
  return style;
};

// 合并相邻文本节点处理器（内部实现）
const mergeAdjacentTextNodesImpl: NodePostProcessor = (
  node: LynxNode,
): LynxNode => {
  // 处理文本节点数组的合并
  const mergeTextNodes = (nodes: LynxNode[]): LynxNode[] => {
    const merged: LynxNode[] = [];

    for (const child of nodes) {
      const processedChild = mergeAdjacentTextNodesImpl(child);
      const last = merged[merged.length - 1];

      if (last?.kind === 'text' && processedChild.kind === 'text') {
        // 合并文本内容
        last.content += processedChild.content;

        // 只在有标记时才合并和保留 marks
        if (last.marks || processedChild.marks) {
          last.marks = {
            ...last.marks,
            ...processedChild.marks,
          };
        }
      } else {
        merged.push(processedChild);
      }
    }

    return merged;
  };

  if (node.kind === 'element') {
    return {
      ...node,
      children: mergeTextNodes(node.children),
    };
  }

  return node;
};

// 带类型标识的导出版本
export const mergeAdjacentTextNodes: NodePostProcessor =
  mergeAdjacentTextNodesImpl as any;
// 添加处理器类型标识
(mergeAdjacentTextNodes as any).type =
  BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES;
(mergeAdjacentTextNodes as any).priority = 50;

// 基础标签处理器
export const createBaseTagHandler = (): TagHandler => {
  const handler = (node: ExtendedHtmlParserNode, context) => {
    if (node.type !== 'tag') return null;

    const tag = node.name?.toLowerCase() || '';
    const mapping = TAG_MAP[tag];

    if (!mapping) return null;

    // br 特殊处理
    if (mapping.lynxTag === '__BR__') {
      return {
        kind: 'text',
        content: '\n',
        meta: { source: 'br' },
      };
    }

    // 解析内联样式字符串为对象
    let styleFromAttr = parseStyleString(node.attribs?.style);

    // 应用全局样式处理器
    const styleHandlers = pluginManager.getStyleHandlers();
    for (const styleHandler of styleHandlers) {
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
        : context.transformChildren(node.children ?? []),
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

    return baseNode;
  };

  // 添加处理器类型标识
  (handler as any).type = BuiltinProcessorType.BASE_TAG_TRANSFORM;
  (handler as any).priority = 100;

  return handler;
};

// 文本节点处理器
export const createTextHandler = (): TagHandler => {
  const handler = (node: ExtendedHtmlParserNode) => {
    if (node.type === 'text') {
      const content = node.data;
      if (!content?.trim()) return null;

      return {
        kind: 'text',
        content: content || '',
      };
    }

    return null;
  };

  // 添加处理器类型标识
  (handler as any).type = BuiltinProcessorType.TEXT_NODE_HANDLER;
  (handler as any).priority = 200;

  return handler;
};

// HTML转换处理器
export const htmlTransformProcessor: HtmlTransformProcessor = (
  html,
  context,
) => {
  const { parseDocument, transformChildren } = context;
  const document = parseDocument(html);
  let nodes = transformChildren(document.children);

  // 应用顶层节点后处理器
  const nodePostProcessors = pluginManager.getNodePostProcessors();
  nodes = nodes.map((node) => {
    let processedNode = node;
    for (const processor of nodePostProcessors) {
      processedNode = processor(processedNode);
    }
    return processedNode;
  });

  // 合并顶层相邻文本节点
  const mergedNodes: LynxNode[] = [];
  for (const node of nodes) {
    const last = mergedNodes[mergedNodes.length - 1];
    if (last?.kind === 'text' && node.kind === 'text') {
      // 合并文本内容
      last.content += node.content;

      // 只在有标记时才合并和保留 marks
      if (last.marks || node.marks) {
        last.marks = {
          ...last.marks,
          ...node.marks,
        };
      }
    } else {
      mergedNodes.push(node);
    }
  }

  return mergedNodes;
};

// 子节点转换处理器
export const childrenTransformProcessor: ChildrenTransformProcessor = (
  nodes,
  parentMarks = {},
  context,
) => {
  const { transformNode } = context;
  const result: LynxNode[] = [];

  for (const node of nodes) {
    const transformed = transformNode(node, parentMarks);
    if (!transformed) continue;

    result.push(transformed);
  }

  return result;
};

// 节点转换处理器
export const nodeTransformProcessor: NodeTransformProcessor = (
  node,
  parentMarks = {},
  context,
) => {
  const { getTagHandlers, getNodePostProcessors, transformChildren } = context;

  // 文本节点处理
  if (node.type === 'text') {
    const content = node.data;
    if (!content?.trim()) return null;

    let result = {
      kind: 'text',
      content: content || '',
    };

    // 只有当有标记时才添加 marks 字段，保持与原有测试兼容
    const hasMarks = Object.values(parentMarks).some(Boolean);
    if (hasMarks) {
      result.marks = { ...parentMarks };
    }

    // 应用节点后处理器
    for (const processor of getNodePostProcessors()) {
      result = processor(result);
    }

    return result;
  }

  // 标签节点处理
  if (node.type === 'tag') {
    const tag = node.name?.toLowerCase() || '';

    // 获取该标签的所有处理器
    const tagHandlers = getTagHandlers(tag);

    // 尝试使用插件处理器
    for (const handler of tagHandlers) {
      const result = handler(node, {
        defaultTransform: () => null,
        transformChildren: (nodes) => transformChildren(nodes, parentMarks),
      });

      if (result !== null) {
        // 应用节点后处理器
        let processedNode = result;
        for (const processor of getNodePostProcessors()) {
          processedNode = processor(processedNode);
        }

        return processedNode;
      }
    }
  }

  return null;
};

// 内置插件定义
export const builtinPlugin: HtmlToLynxPlugin = {
  name: 'builtin',
  priority: 100,
  setup(ctx) {
    // 注册基础标签处理器，处理所有支持的标签
    Object.keys(TAG_MAP).forEach((tag) => {
      const baseHandler = createBaseTagHandler();
      ctx.registerTagHandler(tag, baseHandler);
    });

    // 注册文本节点处理器
    ctx.registerTagHandler('text', createTextHandler());

    // 注册相邻文本节点合并处理器
    ctx.registerNodePostProcessor(mergeAdjacentTextNodes);

    // 注册HTML转换处理器
    ctx.registerHtmlTransformProcessor(htmlTransformProcessor);

    // 注册子节点转换处理器
    ctx.registerChildrenTransformProcessor(childrenTransformProcessor);

    // 注册节点转换处理器
    ctx.registerNodeTransformProcessor(nodeTransformProcessor);
  },
};
