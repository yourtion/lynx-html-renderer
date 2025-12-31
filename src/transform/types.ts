/**
 * 转换阶段枚举
 */
export type TransformPhase =
  | 'normalize' // AST 预处理：实体解码、空白归一化
  | 'structure' // HTML 结构语义：块级、列表、表格
  | 'capability' // LynxNode 能力建模：样式、布局、媒体
  | 'finalize'; // 收尾处理

// 从 ast/types 导入 HtmlAstNode
import type { HtmlAstNode } from '../ast/types';

// 从 lynx/types 导入所有 LynxNode 相关类型
import type {
  Capabilities,
  CSSProperties,
  ElementRole,
  LynxElementNode,
  LynxNode,
  LynxProps,
  LynxTextNode,
} from '../lynx/types';

// 重新导出类型
export type {
  HtmlAstNode,
  LynxNode,
  LynxElementNode,
  LynxTextNode,
  LynxProps,
  CSSProperties,
  ElementRole,
  Capabilities,
};

/**
 * 节点能力处理器类型
 * 用于批量处理能力阶段的节点访问
 */
export type NodeCapabilityHandler = (
  node: LynxNode,
  ctx: TransformContext,
) => undefined | LynxNode;

/**
 * 转换插件接口
 */
export interface TransformPlugin {
  /** 插件唯一标识（用于禁用/替换） */
  name: string;

  /** 所属执行阶段 */
  phase: TransformPhase;

  /** 同 phase 内执行顺序（数字越小越先执行） */
  order?: number;

  /** 是否默认启用 */
  enabledByDefault?: boolean;

  /** 可选：注册能力处理器（推荐用于 capability 阶段）
   *
   * 返回一个 Map，key 是节点类型（kind），value 是对应的处理器
   * 引擎会在一次遍历中调用所有相关的处理器，提高性能
   *
   * 如果此方法存在，将优先于 apply() 使用
   */
  registerCapabilityHandlers?: (
    ctx: TransformContext,
  ) => Map<string, NodeCapabilityHandler>;

  /** 插件执行入口（传统方式，向后兼容） */
  apply(ctx: TransformContext): void;
}

/**
 * 转换上下文接口
 */
export interface TransformContext {
  /** 原始 HTML AST（只读） */
  readonly ast: HtmlAstNode;

  /** 转换结果根节点（可修改） */
  root: LynxNode;

  /** 工具函数集合 */
  utils: {
    /** 遍历 AST 树 */
    walkAst(cb: (node: HtmlAstNode) => void): void;

    /** 创建 LynxNode */
    createNode(partial: Partial<LynxElementNode | LynxTextNode>): LynxNode;

    /** 替换节点 */
    replaceNode(target: LynxNode, next: LynxNode): void;

    /** 注册能力处理器（用于批量处理优化） */
    registerHandler(nodeKind: string, handler: NodeCapabilityHandler): void;
  };

  /** 插件间传递元数据 */
  metadata: Record<string, unknown>;

  /** 性能指标收集（可选） */
  metrics?: {
    /** 插件执行时间（毫秒） */
    pluginTimings: Map<string, number>;
    /** 节点计数 */
    nodeCount: number;
  };

  /** 内部：处理器注册表（用于批量处理） */
  _handlerRegistry?: Map<string, NodeCapabilityHandler[]>;
}

/**
 * 插件配置接口
 */
export interface PluginConfig {
  /** 禁用的插件名称列表 */
  disable?: string[];

  /** 替换的插件映射（key 为插件名） */
  replace?: Record<string, TransformPlugin>;

  /** 额外的插件列表 */
  extra?: TransformPlugin[];
}

/**
 * 转换选项（向后兼容）
 */
export interface TransformOptions {
  /** 删除所有 HTML class 属性 */
  removeAllClass?: boolean;

  /** 删除所有 HTML style 属性 */
  removeAllStyle?: boolean;

  /** 样式模式：'inline'（默认）使用内联样式，'css-class' 使用CSS类 */
  styleMode?: 'inline' | 'css-class';

  /** CSS类模式下的根容器class名，默认 'lynx-html-renderer' */
  rootClassName?: string;

  /** 新增：插件配置 */
  plugins?: PluginConfig;

  /** 启用调试模式（输出插件执行日志和性能指标） */
  debug?: boolean;
}
