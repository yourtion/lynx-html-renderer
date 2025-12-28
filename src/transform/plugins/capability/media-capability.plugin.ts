import type { LynxElementNode, LynxNode, TransformPlugin } from '../../types';

/**
 * 媒体能力插件
 * 职责：处理媒体元素（img），提取 src 属性
 */
export const mediaCapabilityPlugin: TransformPlugin = {
  name: 'media-capability',
  phase: 'capability',
  order: 100, // 确保在 style-capability 之后执行

  apply(ctx) {
    // 遍历所有节点，处理媒体元素
    processMediaElements(ctx.root);
  },
};

/**
 * 递归处理媒体元素
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

/**
 * 解析 CSS style 字符串为对象
 */
function parseStyleString(style: string): Record<string, string> {
  const result: Record<string, string> = {};

  style.split(';').forEach((item) => {
    const [rawKey, rawValue] = item.split(':');
    if (!rawKey || !rawValue) return;

    const key = rawKey.trim();
    const value = rawValue.trim();

    result[key] = value;
  });

  return result;
}
