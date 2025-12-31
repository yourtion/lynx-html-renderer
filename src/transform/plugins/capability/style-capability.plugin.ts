import { parseStyleString } from '../../../utils/style-parser';
import type {
  CSSProperties,
  LynxElementNode,
  LynxNode,
  NodeCapabilityHandler,
  TransformPlugin,
} from '../../types';

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

    // 为 "view" 节点注册处理器（div, p, span 等）
    handlers.set('view', (node) => {
      // CRITICAL: 提前检查，不符合条件立即 return
      // 这避免了不必要的处理，是性能优化的关键
      const element = node as LynxElementNode;
      const sourceAttrs = element.meta?.sourceAttrs as
        | Record<string, string>
        | undefined;

      // 快速跳过没有 style 和 class 的节点
      if (!sourceAttrs || (!sourceAttrs.style && !sourceAttrs.class)) return;

      // 处理 style 属性
      if (!removeAllStyle && sourceAttrs.style) {
        const styleFromAttr = parseStyleString(sourceAttrs.style);
        // 合并到现有 style
        element.props.style = {
          ...(element.props.style as CSSProperties),
          ...styleFromAttr,
        } as CSSProperties;
      }

      // 处理 class 属性
      if (!removeAllClass && sourceAttrs.class) {
        // 如果已经有className（来自defaultStyle的CSS类），需要合并
        const existingClass = (element.props as { className?: string })
          .className;
        if (existingClass) {
          // 合并defaultStyle的className和HTML的class属性
          (element.props as { className: string }).className =
            `${existingClass} ${sourceAttrs.class}`;
        } else {
          (element.props as { className: string }).className =
            sourceAttrs.class;
        }
      }
    });

    // 为 "text" 节点注册处理器
    handlers.set('text', (node) => {
      const element = node as LynxElementNode;
      const sourceAttrs = element.meta?.sourceAttrs as
        | Record<string, string>
        | undefined;

      if (!sourceAttrs || (!sourceAttrs.style && !sourceAttrs.class)) return;

      if (!removeAllStyle && sourceAttrs.style) {
        const styleFromAttr = parseStyleString(sourceAttrs.style);
        element.props.style = {
          ...(element.props.style as CSSProperties),
          ...styleFromAttr,
        } as CSSProperties;
      }

      if (!removeAllClass && sourceAttrs.class) {
        const existingClass = (element.props as { className?: string })
          .className;
        if (existingClass) {
          (element.props as { className: string }).className =
            `${existingClass} ${sourceAttrs.class}`;
        } else {
          (element.props as { className: string }).className =
            sourceAttrs.class;
        }
      }
    });

    // 为 "image" 节点注册处理器
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

    // 为 "frame" 节点注册处理器（table 等）
    handlers.set('frame', (node) => {
      const element = node as LynxElementNode;
      const sourceAttrs = element.meta?.sourceAttrs as
        | Record<string, string>
        | undefined;

      if (!sourceAttrs || (!sourceAttrs.style && !sourceAttrs.class)) return;

      if (!removeAllStyle && sourceAttrs.style) {
        const styleFromAttr = parseStyleString(sourceAttrs.style);
        element.props.style = {
          ...(element.props.style as CSSProperties),
          ...styleFromAttr,
        } as CSSProperties;
      }

      if (!removeAllClass && sourceAttrs.class) {
        const existingClass = (element.props as { className?: string })
          .className;
        if (existingClass) {
          (element.props as { className: string }).className =
            `${existingClass} ${sourceAttrs.class}`;
        } else {
          (element.props as { className: string }).className =
            sourceAttrs.class;
        }
      }
    });

    return handlers;
  },

  // OLD: 传统 apply() 方法（向后兼容）
  apply(ctx) {
    const removeAllStyle = (ctx.metadata.removeAllStyle as boolean) ?? false;
    const removeAllClass = (ctx.metadata.removeAllClass as boolean) ?? true;
    const styleMode =
      (ctx.metadata.styleMode as 'inline' | 'css-class') ?? 'inline';

    // 遍历所有节点，处理样式
    processStyles(ctx.root, { removeAllStyle, removeAllClass, styleMode });
  },
};

/**
 * 递归处理节点样式（传统方式，保留作为向后兼容）
 */
function processStyles(
  lynxNode: LynxNode,
  options: {
    removeAllStyle: boolean;
    removeAllClass: boolean;
    styleMode: 'inline' | 'css-class';
  },
): void {
  if (lynxNode.kind === 'element') {
    const element = lynxNode as LynxElementNode;
    const sourceAttrs = element.meta?.sourceAttrs as
      | Record<string, string>
      | undefined;

    // 处理 style 属性
    if (!options.removeAllStyle && sourceAttrs?.style) {
      const styleFromAttr = parseStyleString(sourceAttrs.style);
      // 合并到现有 style
      element.props.style = {
        ...(element.props.style as CSSProperties),
        ...styleFromAttr,
      } as CSSProperties;
    }

    // 处理 class 属性
    if (!options.removeAllClass && sourceAttrs?.class) {
      // 如果已经有className（来自defaultStyle的CSS类），需要合并
      const existingClass = (element.props as { className?: string }).className;
      if (existingClass) {
        // 合并defaultStyle的className和HTML的class属性
        (element.props as { className: string }).className =
          `${existingClass} ${sourceAttrs.class}`;
      } else {
        (element.props as { className: string }).className = sourceAttrs.class;
      }
    }

    // 递归处理子节点
    for (const child of element.children) {
      processStyles(child, options);
    }
  }
}
