/**
 * Element PAPI 直绘路线的序列化树类型。
 *
 * 该结构是 `LynxNode` 的精简投影：只保留构建原生元素树所需的数据，
 * 且必须可被结构化克隆（通过 `runOnMainThread` 跨线程传递）。
 */

/** 元素节点（view / text / image 等） */
export interface PapiElementNode {
  kind: 'element';
  /** Lynx 原生标签名 */
  tg: string;
  /** 内联样式 CSS 字符串（kebab-case，分号结尾），主线程零转换直接下发 */
  st?: string;
  /** class 列表（空格分隔） */
  cl?: string;
  /** 元素 id（CSS 选择器锚点，走引擎 __SetID 专用通道） */
  id?: string;
  /** 除 style/class 外的属性（如 image 的 src） */
  at?: Record<string, string>;
  /** 子节点 */
  k?: PapiNode[];
}

/** 文本节点（渲染为 text 元素 + raw-text 子元素） */
export interface PapiTextNode {
  kind: 'text';
  /** 文本内容 */
  v: string;
  /** 文本内联样式（marks + 继承样式合并后的 CSS 字符串） */
  st?: string;
  /** 继承的 class 列表 */
  cl?: string;
}

export type PapiNode = PapiElementNode | PapiTextNode;

/** 序列化后的整棵树（挂载到宿主元素下的根节点列表） */
export type PapiTree = PapiNode[];
