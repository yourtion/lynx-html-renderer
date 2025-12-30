/**
 * 结构角色类型
 */
export type ElementRole =
  | 'block'
  | 'inline'
  | 'textContainer'
  | 'image'
  | 'table'
  | 'row'
  | 'cell';

/**
 * 能力描述接口
 */
export interface Capabilities {
  layout?: 'block' | 'inline' | 'flex' | 'table';
  isVoid?: boolean; // 如 img / br
  textContainer?: boolean; // 是否只能包含 text
}

/**
 * LynxNode 基础接口
 */
export interface LynxBaseNode {
  kind: string;
  meta?: Record<string, unknown>; // 调试、插件扩展、来源信息
}

/**
 * Lynx 元素节点
 */
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

/**
 * Lynx 文本节点
 */
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

  /** 从父元素继承的可继承样式（inline 模式） */
  inheritableStyles?: {
    fontFamily?: string;
    fontSize?: string | number;
    fontWeight?: string | number;
    fontStyle?: string;
    lineHeight?: string | number;
    color?: string;
  };

  /** 从父元素继承的 class 名称（css-class 模式） */
  inheritableClasses?: string;

  meta?: {
    source?: 'text' | 'br';
  };
}

/**
 * LynxNode 联合类型
 */
export type LynxNode = LynxElementNode | LynxTextNode;

/**
 * Lynx 属性类型
 */
export type LynxProps = {
  style?: CSSProperties;
  className?: string;

  // image
  src?: string;

  // frame
  url?: string;

  // 事件（MVP 可不支持）
  onTap?: () => void;

  [key: string]: unknown;
};

/**
 * CSS 属性类型
 */
export type CSSProperties = Record<string, string | number>;
