import { parseStyleString } from '../../../utils/style-parser';
import type {
  CSSProperties,
  LynxElementNode,
  NodeCapabilityHandler,
  TransformPlugin,
} from '../../types';

/**
 * 处理元素的 style 和 class 属性
 */
function processElementStyleAndClass(
  element: LynxElementNode,
  options: { removeAllStyle: boolean; removeAllClass: boolean },
): void {
  const sourceAttrs = element.meta?.sourceAttrs as
    | Record<string, string>
    | undefined;

  // 快速跳过没有 style 和 class 的节点
  if (!sourceAttrs || (!sourceAttrs.style && !sourceAttrs.class)) return;

  // 处理 style 属性
  if (!options.removeAllStyle && sourceAttrs.style) {
    const styleFromAttr = parseStyleString(sourceAttrs.style);
    element.props.style = {
      ...(element.props.style as CSSProperties),
      ...styleFromAttr,
    } as CSSProperties;
  }

  // 处理 class 属性
  if (!options.removeAllClass && sourceAttrs.class) {
    const existingClass = (element.props as { className?: string }).className;
    if (existingClass) {
      (element.props as { className: string }).className =
        `${existingClass} ${sourceAttrs.class}`;
    } else {
      (element.props as { className: string }).className = sourceAttrs.class;
    }
  }
}

/**
 * 样式能力插件
 * 职责：解析 HTML style 属性并转换为 Lynx style props
 */
export const styleCapabilityPlugin: TransformPlugin = {
  name: 'style-capability',
  phase: 'capability',
  order: 10,

  // NEW: 注册处理器（推荐方式，性能优化）
  registerCapabilityHandlers(ctx) {
    const handlers = new Map<string, NodeCapabilityHandler>();

    const removeAllStyle = (ctx.metadata.removeAllStyle as boolean) ?? false;
    const removeAllClass = (ctx.metadata.removeAllClass as boolean) ?? true;
    const options = { removeAllStyle, removeAllClass };

    // 为 "view"、"text"、"frame" 节点注册处理器（共享相同逻辑）
    for (const tag of ['view', 'text', 'frame']) {
      handlers.set(tag, (node) => {
        processElementStyleAndClass(node as LynxElementNode, options);
      });
    }

    // 为 "image" 节点注册处理器（只处理 style）
    handlers.set('image', (node) => {
      const element = node as LynxElementNode;
      const sourceAttrs = element.meta?.sourceAttrs as
        | Record<string, string>
        | undefined;

      if (!sourceAttrs || !sourceAttrs.style) return;

      if (!removeAllStyle && sourceAttrs.style) {
        const styleFromAttr = parseStyleString(sourceAttrs.style);
        element.props.style = {
          ...(element.props.style as CSSProperties),
          ...styleFromAttr,
        } as CSSProperties;
      }
    });

    return handlers;
  },
};
