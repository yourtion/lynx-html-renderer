/**
 * Type definitions re-exports
 *
 * This file re-exports all public types from their source modules
 * to provide a unified import interface and maintain backward compatibility.
 */

// LynxNode types - re-export from core types
export type {
  LynxNode,
  LynxElementNode,
  LynxTextNode,
  LynxProps,
  CSSProperties,
  ElementRole,
  Capabilities,
} from './lynx/types';

// Transform types - re-export from transform system
export type {
  HtmlAstNode,
  TransformPlugin,
  TransformContext,
  TransformOptions,
  PluginConfig,
  TransformPhase,
} from './transform/types';

// Renderer types - re-export from render layer
export type {
  RenderResult,
  LynxRenderAdapter,
  RenderContext,
} from './render/types';

// Legacy types - kept for backward compatibility
// These will be deprecated in future versions

export interface HtmlToLynxPlugin {
  name: string;
  priority?: number;
  setup(ctx: TransformContext): void;
}

// 定义 htmlparser2 节点类型
export interface HtmlParserNode {
  type: string;
  data?: string;
  name?: string;
  attribs?: Record<string, string>;
  children?: HtmlParserNode[];
}

/**
 * 处理器基础接口
 * 用于标识处理器的类型和优先级
 */
export interface ProcessorBase {
  /** 处理器类型，用于标识和管理 */
  type?: string;
  /** 处理器优先级，值越高越先执行 */
  priority?: number;
}

/**
 * HTML转换上下文接口
 * @deprecated Use TransformContext from './transform/types' instead
 */
export interface LegacyTransformContext {
  /** 注册标签处理器 */
  registerTagHandler: (tag: string, handler: TagHandler) => void;
  /** 注册样式处理器 */
  registerStyleHandler: (handler: StyleHandler) => void;
  /** 注册节点后处理器 */
  registerNodePostProcessor: (processor: NodePostProcessor) => void;
  /** 注册HTML转换处理器 */
  registerHtmlTransformProcessor: (processor: HtmlTransformProcessor) => void;
  /** 注册子节点转换处理器 */
  registerChildrenTransformProcessor: (
    processor: ChildrenTransformProcessor,
  ) => void;
  /** 注册节点转换处理器 */
  registerNodeTransformProcessor: (processor: NodeTransformProcessor) => void;
  /** 注册顶层节点合并处理器 */
  registerTopLevelMergeProcessor: (processor: TopLevelMergeProcessor) => void;
}

export type TagHandler = (
  node: HtmlParserNode,
  context: {
    defaultTransform: () => LynxNode | null;
    transformChildren: (nodes: HtmlParserNode[]) => LynxNode[];
  },
) => LynxNode | null;

export type StyleHandler = (
  style: Record<string, string | number>,
  node: HtmlParserNode,
) => Record<string, string | number>;

export type NodePostProcessor = (node: LynxNode) => LynxNode;

/**
 * HTML转换处理器
 * 负责将HTML字符串转换为LynxNode数组
 */
export type HtmlTransformProcessor = (
  html: string,
  context: {
    parseDocument: typeof import('htmlparser2').parseDocument;
    transformChildren: (
      nodes: HtmlParserNode[],
      parentMarks?: Record<string, boolean>,
    ) => LynxNode[];
  },
) => LynxNode[];

/**
 * 子节点转换处理器
 * 负责转换节点的子节点
 */
export type ChildrenTransformProcessor = (
  nodes: HtmlParserNode[],
  parentMarks?: Record<string, boolean>,
  context: {
    transformNode: (
      node: HtmlParserNode,
      parentMarks?: Record<string, boolean>,
    ) => LynxNode | null;
  },
) => LynxNode[];

/**
 * 节点转换处理器
 * 负责转换单个节点
 */
export type NodeTransformProcessor = (
  node: HtmlParserNode,
  parentMarks?: Record<string, boolean>,
  context: {
    getTagHandlers: (tag: string) => TagHandler[];
    getNodePostProcessors: () => NodePostProcessor[];
    transformChildren: (
      nodes: HtmlParserNode[],
      parentMarks?: Record<string, boolean>,
    ) => LynxNode[];
  },
) => LynxNode | null;

/**
 * 顶层节点合并处理器
 * 负责合并顶层相邻文本节点
 */
export type TopLevelMergeProcessor = (nodes: LynxNode[]) => LynxNode[];

export type TaggedTagHandler = TagHandler & ProcessorBase;
export type TaggedStyleHandler = StyleHandler & ProcessorBase;
export type TaggedNodePostProcessor = NodePostProcessor & ProcessorBase;
export type TaggedHtmlTransformProcessor = HtmlTransformProcessor &
  ProcessorBase;
export type TaggedChildrenTransformProcessor = ChildrenTransformProcessor &
  ProcessorBase;
export type TaggedNodeTransformProcessor = NodeTransformProcessor &
  ProcessorBase;
export type TaggedTopLevelMergeProcessor = TopLevelMergeProcessor &
  ProcessorBase;
