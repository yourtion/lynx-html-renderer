import { parseStyleString } from '../../../utils/style-parser';
import type {
  LynxElementNode,
  NodeCapabilityHandler,
  TransformPlugin,
} from '../../types';

/** HTML numeric dimensions are CSS pixels, not unitless Lynx CSS strings. */
function dimension(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  // Keep existing explicit units/percentages for backwards compatibility.
  return trimmed;
}

/**
 * 媒体能力插件
 * 职责：处理媒体元素（img），提取 src 属性
 */
export const mediaCapabilityPlugin: TransformPlugin = {
  name: 'media-capability',
  phase: 'capability',
  order: 100, // 确保在 style-capability 之后执行

  // NEW: 注册处理器（推荐方式，性能优化）
  registerCapabilityHandlers(_ctx) {
    const handlers = new Map<string, NodeCapabilityHandler>();

    // 为 "image" 节点注册处理器
    handlers.set('image', (node) => {
      const element = node as LynxElementNode;

      // CRITICAL: 提前检查
      // 只有来自 img 标签的节点才需要处理
      if (element.meta?.sourceTag !== 'img') return;

      const sourceAttrs = element.meta?.sourceAttrs as
        | Record<string, string>
        | undefined;

      // 快速跳过没有 src 的节点
      if (!sourceAttrs?.src) return;

      // 设置 src 属性
      element.props.src = sourceAttrs.src;

      // 确保 img 有 style 对象
      if (!element.props.style) {
        element.props.style = {};
      }

      const style = element.props.style as Record<string, string | number>;

      // Resolved styles (including custom plugin styles) win over HTML attrs.
      // Preserve the existing removeAllStyle exception for image dimensions.
      const sourceStyle =
        sourceAttrs.style && (style.width == null || style.height == null)
          ? parseStyleString(sourceAttrs.style)
          : {};
      style.width =
        style.width ??
        sourceStyle.width ??
        dimension(sourceAttrs.width) ??
        '100%';
      style.height =
        style.height ??
        sourceStyle.height ??
        dimension(sourceAttrs.height) ??
        'auto';

      // 确保图片的 style 始终包含 width 和 height
      // 这样即使 removeAllStyle = true，图片也能正常显示
      element.props.style = style;
    });

    return handlers;
  },
};
