import { parseStyleString } from '../../../utils/style-parser';
import type {
  LynxElementNode,
  LynxNode,
  NodeCapabilityHandler,
  TransformPlugin,
} from '../../types';

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

      // 优先级 1: 使用 HTML 属性中的 width/height
      if (sourceAttrs.width) {
        style.width = sourceAttrs.width;
      }
      if (sourceAttrs.height) {
        style.height = sourceAttrs.height;
      }

      // 优先级 2: 如果 HTML 属性中没有，从 style 属性中提取 width/height
      // 即使 removeAllStyle = true，也要保留图片的原始尺寸
      if (!style.width || !style.height) {
        // 使用共享的 parseStyleString，正确处理 kebab-case → camelCase 转换
        const styleFromAttr = sourceAttrs.style
          ? parseStyleString(sourceAttrs.style)
          : {};

        if (!style.width && styleFromAttr.width) {
          style.width = styleFromAttr.width;
        }
        if (!style.height && styleFromAttr.height) {
          style.height = styleFromAttr.height;
        }
      }

      // 优先级 3: 如果还是没有，设置默认值
      if (!style.width) {
        style.width = '100%';
      }
      if (!style.height) {
        style.height = 'auto';
      }

      // 确保图片的 style 始终包含 width 和 height
      // 这样即使 removeAllStyle = true，图片也能正常显示
      element.props.style = style;
    });

    return handlers;
  },

  // OLD: 传统 apply() 方法（向后兼容）
  apply(ctx) {
    // 遍历所有节点，处理媒体元素
    processMediaElements(ctx.root);
  },
};

/**
 * 递归处理媒体元素（传统方式，保留作为向后兼容）
 */
function processMediaElements(lynxNode: LynxNode): void {
  if (lynxNode.kind === 'element') {
    const element = lynxNode as LynxElementNode;
    const sourceAttrs = element.meta?.sourceAttrs as
      | Record<string, string>
      | undefined;

    // 处理 img 元素
    if (element.meta?.sourceTag === 'img' && sourceAttrs?.src) {
      element.props.src = sourceAttrs.src;

      // 确保 img 有 style 对象
      if (!element.props.style) {
        element.props.style = {};
      }

      const style = element.props.style as Record<string, string | number>;

      // 优先级 1: 使用 HTML 属性中的 width/height
      if (sourceAttrs.width) {
        style.width = sourceAttrs.width;
      }
      if (sourceAttrs.height) {
        style.height = sourceAttrs.height;
      }

      // 优先级 2: 如果 HTML 属性中没有，从 style 属性中提取 width/height
      // 即使 removeAllStyle = true，也要保留图片的原始尺寸
      if (!style.width || !style.height) {
        // Now using shared parseStyleString with proper kebab-case → camelCase conversion
        const styleFromAttr = sourceAttrs.style
          ? parseStyleString(sourceAttrs.style)
          : {};

        if (!style.width && styleFromAttr.width) {
          style.width = styleFromAttr.width;
        }
        if (!style.height && styleFromAttr.height) {
          style.height = styleFromAttr.height;
        }
      }

      // 优先级 3: 如果还是没有，设置默认值
      if (!style.width) {
        style.width = '100%';
      }
      if (!style.height) {
        style.height = 'auto';
      }

      // 确保图片的 style 始终包含 width 和 height
      // 这样即使 removeAllStyle = true，图片也能正常显示
      element.props.style = style;
    }

    // 递归处理子节点
    for (const child of element.children) {
      processMediaElements(child);
    }
  }
}
