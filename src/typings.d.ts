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

export type LynxNode = LynxElementNode | LynxTextNode;

export interface LynxBaseNode {
  kind: string;
  meta?: Record<string, unknown>; // 调试、插件扩展、来源信息
}

export interface LynxElementNode extends LynxBaseNode {
  kind: 'element';

  /** Lynx 原生标签名 */
  tag: 'view' | 'text' | 'image' | 'frame' | string;

  /** Lynx props（已归一化） */
  props: LynxProps;

  /** 子节点 */
  children: LynxNode[];

  /** 结构语义 */
  role?: ElementRole;

  /** 能力描述 */
  capabilities?: Capabilities;

  /** 调试 / 扩展用 */
  meta?: {
    sourceTag?: string; // 原 HTML tag
    sourceAttrs?: Record<string, string>;
  };
}

export interface LynxTextNode extends LynxBaseNode {
  kind: 'text';

  /** 文本内容 */
  content: string;

  /** 文本标记（bold, italic, underline, code） */
  marks?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
  };

  meta?: {
    source?: 'text' | 'br';
  };
}

export type LynxProps = {
  style?: CSSProperties;
  className?: string;

  // image
  src?: string;

  // frame
  url?: string;

  // 事件（MVP 可不支持）
  onTap?: () => void;

  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | Record<string, unknown>;
};

// 定义渲染结果类型
export type RenderResult = unknown; // Lynx 组件类型，实际为内部类型

// 渲染适配器接口
export interface LynxRenderAdapter {
  match(node: LynxElementNode): boolean;
  render(node: LynxElementNode, ctx: RenderContext): RenderResult;
}

// 渲染上下文接口
export interface RenderContext {
  renderChildren(node: LynxElementNode): RenderResult[];
}

// 插件系统类型定义

export interface HtmlToLynxPlugin {
  name: string;
  priority?: number;
  setup(ctx: TransformContext): void;
}

export interface TransformContext {
  registerTagHandler(tag: string, handler: TagHandler): void;
  registerStyleHandler(handler: StyleHandler): void;
  registerNodePostProcessor(processor: NodePostProcessor): void;
}

// 定义 htmlparser2 节点类型
export interface HtmlParserNode {
  type: string;
  data?: string;
  name?: string;
  attribs?: Record<string, string>;
  children?: HtmlParserNode[];
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
