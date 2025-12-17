export interface LynxElementNode {
  kind: 'element';

  /** Lynx 原生标签名 */
  tag: 'view' | 'text' | 'image' | 'frame' | string;

  /** Lynx props（已归一化） */
  props: LynxProps;

  /** 子节点 */
  children: LynxNode[];

  /** 调试 / 扩展用（MVP 可选） */
  meta?: {
    sourceTag?: string;   // 原 HTML tag
    sourceAttrs?: Record<string, string>;
  };
}

export interface LynxTextNode {
  kind: 'text';

  /** 文本内容 */
  content: string;

  /** text 专用 props（fontSize / color 等） */
  props?: LynxTextProps;

  meta?: {
    source?: 'text' | 'br';
  };
}

export type LynxProps = {
  style?: LynxStyle;
  className?: string;

  // image
  src?: string;

  // frame
  url?: string;

  // 事件（MVP 可不支持）
  onTap?: () => void;

  [key: string]: any;
};

export type LynxTextProps = {
  style?: LynxTextStyle;
};

export type LynxStyle = {
  // layout
  display?: 'flex' | 'none';
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  flex?: number;

  // box
  width?: number | string;
  height?: number | string;
  margin?: number | string;
  padding?: number | string;

  // background
  backgroundColor?: string;

  // border
  borderRadius?: number | string;

  // misc
  opacity?: number;

  [key: string]: any;
};

export type LynxTextStyle = {
  fontSize?: number | string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  color?: string;
  lineHeight?: number | string;
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: string;
};