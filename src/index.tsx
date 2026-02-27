import React, { memo, useMemo } from 'react';
import { transformHTML } from './html-parser';
import { AdapterRegistry, setGlobalRegistry } from './render/adapter-registry';
import type {
  LynxElementNode,
  LynxNode,
  LynxRenderAdapter,
  RenderContext,
  RenderResult,
} from './render/types';
import { extractInheritableStyles } from './transform/utils/inheritable-properties';

// 内置适配器实现
class ViewAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode, ctx: RenderContext) {
    return <view {...node.props}>{ctx.renderChildren(node)}</view>;
  }
}

class TextAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode, ctx: RenderContext) {
    // Special handling for text elements with className or style and single text child
    // This unwraps redundant <text class/style="..."><text>content</text></text> structures
    // e.g., when h1 maps to <text>, we get: <text style="..."><text>Title</text></text>
    // We should render only the inner text with its inheritableStyles/inheritableClasses
    if (
      (node.props.className || node.props.style) &&
      node.children.length === 1 &&
      node.children[0].kind === 'text'
    ) {
      const textNode = node.children[0];

      // For CSS-class mode, merge element className with inheritableClasses
      // Element className has container properties (margin, etc.)
      // inheritableClasses has text-only properties (fontSize, color, etc.)
      if (textNode.inheritableClasses) {
        const mergedClassName = node.props.className
          ? `${node.props.className} ${textNode.inheritableClasses}`.trim()
          : textNode.inheritableClasses;

        const mergedTextNode = {
          ...textNode,
          inheritableClasses: mergedClassName,
        };
        return renderNode(mergedTextNode, ctx);
      } else if (node.props.className) {
        // Has element className but no inheritableClasses
        const mergedTextNode = {
          ...textNode,
          inheritableClasses: node.props.className,
        };
        return renderNode(mergedTextNode, ctx);
      }

      // For inline mode, check if element has style that should override inheritableStyles
      if (node.props.style) {
        // Element has inline/merged style - this is the source of truth
        // Extract only inheritable properties from the element's style
        const inheritableStyle = extractInheritableStyles(
          node.props.style as Record<string, unknown>,
        );

        if (Object.keys(inheritableStyle).length > 0) {
          const mergedTextNode = {
            ...textNode,
            inheritableStyles: inheritableStyle,
          };
          return renderNode(mergedTextNode, ctx);
        }
      }

      // Fall back to inheritableStyles if set
      if (textNode.inheritableStyles) {
        const mergedTextNode = {
          ...textNode,
          inheritableStyles: textNode.inheritableStyles,
        };
        return renderNode(mergedTextNode, ctx);
      }

      // If neither, render as-is (text node without styles)
      return renderNode(textNode, ctx);
    }

    // Special handling for nested text elements (text inside text)
    // This happens when both outer and inner tags map to <text>, e.g., <h1><p>Text</p></h1>
    // We should merge styles/classes and render only the inner text content directly
    if (
      (node.props.className || node.props.style) &&
      node.children.length === 1 &&
      node.children[0].kind === 'element' &&
      node.children[0].tag === 'text'
    ) {
      const childElement = node.children[0];

      // Recursively find the innermost text content and accumulate all classNames
      const findInnermostTextWithInheritance = (
        parent: LynxElementNode,
        accumulatedClassNames: string[],
      ): { textNode: { kind: 'text' }; classNames: string[] } | null => {
        // Accumulate className from current element if it has one
        if (parent.props.className) {
          accumulatedClassNames.push(parent.props.className);
        }

        // Check for nested text element
        if (
          parent.children.length === 1 &&
          parent.children[0].kind === 'element' &&
          parent.children[0].tag === 'text'
        ) {
          const child = parent.children[0];
          return findInnermostTextWithInheritance(child, accumulatedClassNames);
        }

        // Base case: look for direct text children
        const textChild = parent.children.find(
          (child): child is { kind: 'text' } => child.kind === 'text',
        );

        if (textChild) {
          return {
            textNode: textChild,
            classNames: accumulatedClassNames,
          };
        }

        return null;
      };

      const result = findInnermostTextWithInheritance(childElement, []);

      if (result) {
        // Merge all accumulated classNames with inheritableClasses
        const mergedClassName = result.textNode.inheritableClasses
          ? [...result.classNames, result.textNode.inheritableClasses]
              .join(' ')
              .trim()
          : result.classNames.join(' ').trim();

        const mergedTextNode = {
          ...result.textNode,
          inheritableClasses: mergedClassName || undefined,
        };
        return renderNode(mergedTextNode, ctx);
      }
    }

    return <text {...node.props}>{ctx.renderChildren(node)}</text>;
  }
}

class ImageAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode) {
    return <image {...node.props} />;
  }
}

class TableAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode, ctx: RenderContext) {
    const tableStyle = {
      ...node.props.style,
    };

    return <view style={tableStyle}>{ctx.renderChildren(node)}</view>;
  }
}

class RowAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode, ctx: RenderContext) {
    const rowStyle = {
      ...node.props.style,
    };

    return <view style={rowStyle}>{ctx.renderChildren(node)}</view>;
  }
}

/**
 * 只在 text 元素上有效的 CSS 属性
 * 参考: https://lynxjs.org/api/elements/built-in/text
 */
const TEXT_ONLY_PROPERTIES = new Set([
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'direction',
  // Lynx-specific text properties
  'textShadow',
  'textStroke',
  'textIndent',
  'whiteSpace',
  'wordBreak',
]);

class CellAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode, ctx: RenderContext) {
    // 分离文本样式和其他样式
    const cellStyle: Record<string, unknown> = {};
    const textStyles: Record<string, unknown> = {};

    if (node.props.style) {
      for (const [key, value] of Object.entries(node.props.style)) {
        if (TEXT_ONLY_PROPERTIES.has(key)) {
          textStyles[key] = value;
        } else {
          cellStyle[key] = value;
        }
      }
    }

    // 渲染子节点，如果子节点是 text，应用文本样式
    const children = ctx.renderChildren(node).map((child) => {
      if (React.isValidElement(child) && child.type === 'text') {
        // 应用文本样式到 text 元素
        return React.cloneElement(child, {
          style: {
            ...(child.props.style as Record<string, unknown> | undefined),
            ...textStyles,
          },
        });
      }
      return child;
    });

    return <view style={cellStyle}>{children}</view>;
  }
}

/**
 * Create a new adapter registry with all default adapters registered
 *
 * Use this to create an isolated registry instance for advanced use cases
 * like testing, SSR, or micro-frontends.
 *
 * @returns A new AdapterRegistry with all default adapters
 *
 * @example
 * ```typescript
 * import { createDefaultRegistry } from 'lynx-html-renderer';
 *
 * const registry = createDefaultRegistry();
 * registry.registerByTag('custom', myAdapter);
 * ```
 */
export function createDefaultRegistry(): AdapterRegistry {
  const viewAdapter = new ViewAdapter();
  const registry = new AdapterRegistry(viewAdapter);

  registry.registerByTag('view', viewAdapter);
  registry.registerByTag('text', new TextAdapter());
  registry.registerByTag('image', new ImageAdapter());
  registry.registerByRole('table', new TableAdapter());
  registry.registerByRole('row', new RowAdapter());
  registry.registerByRole('cell', new CellAdapter());

  return registry;
}

// 初始化全局适配器注册表（使用 createDefaultRegistry 减少重复代码）
const adapterRegistry = createDefaultRegistry();

// 设置全局注册表实例，供外部扩展使用
setGlobalRegistry(adapterRegistry);

// 适配器解析函数 - 使用注册表实现 O(1) 查找
function resolveAdapter(node: LynxElementNode): LynxRenderAdapter {
  return adapterRegistry.resolve(node);
}

// 共享的 RenderContext 单例，减少 GC 压力
const sharedRenderContext: RenderContext = {
  renderChildren(node: LynxElementNode) {
    return node.children.map((child, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: HTML 节点顺序固定，使用 index 作为 key 是安全的
      <React.Fragment key={index}>
        {renderNode(child, sharedRenderContext)}
      </React.Fragment>
    ));
  },
};

// 主渲染函数
function renderNode(
  node: LynxNode,
  ctx: RenderContext = sharedRenderContext,
): RenderResult {
  if (node.kind === 'text') {
    // 处理继承的样式（inline 模式）
    const style: Record<string, string | number> = {
      ...(node.inheritableStyles ?? {}),
    };

    // Marks 样式覆盖继承样式（更高优先级）
    if (node.marks?.bold) style.fontWeight = 'bold';
    if (node.marks?.italic) style.fontStyle = 'italic';
    if (node.marks?.underline) style.textDecoration = 'underline';
    if (node.marks?.code) {
      style.fontFamily = 'monospace';
      style.backgroundColor = '#f0f0f0';
      style.padding = '2px 4px';
      style.borderRadius = '3px';
    }

    // 处理继承的类名（css-class 模式）
    const className = node.inheritableClasses;

    return (
      <text style={style} {...(className && { className })}>
        {node.content}
      </text>
    );
  }

  // 处理元素节点
  const adapter = resolveAdapter(node);
  return adapter.render(node, ctx);
}

/**
 * HTMLRenderer 组件属性
 */
export interface HTMLRendererProps {
  /** HTML 字符串输入 */
  html: string;
  /** 是否移除所有 class 属性（默认: true） */
  removeAllClass?: boolean;
  /** 是否移除所有 style 属性（默认: false） */
  removeAllStyle?: boolean;
  /** 样式模式: 'inline' 内联样式 或 'css-class' CSS类模式（默认: 'inline'） */
  styleMode?: 'inline' | 'css-class';
  /** 根容器 class 名称（默认: 'lynx-html-renderer'） */
  rootClassName?: string;
  /** 是否启用暗色模式（默认: false） */
  darkMode?: boolean;
  /** 自定义链接样式（仅 inline 模式生效） */
  linkStyle?: Record<string, string | number>;
}

export const HTMLRenderer = memo(function HTMLRenderer(
  props: HTMLRendererProps,
) {
  const {
    html,
    removeAllClass = true,
    removeAllStyle = false,
    styleMode = 'inline',
    rootClassName = 'lynx-html-renderer',
    darkMode = false,
    linkStyle,
  } = props;

  // Cache the transformed nodes to avoid re-parsing HTML on every render
  const nodes = useMemo(
    () =>
      transformHTML(html, {
        removeAllClass,
        removeAllStyle,
        styleMode,
        linkStyle,
      }),
    [html, removeAllClass, removeAllStyle, styleMode, linkStyle],
  );

  // CSS类模式：添加根容器
  if (styleMode === 'css-class') {
    const containerClass = darkMode
      ? `${rootClassName} lhr-dark`
      : rootClassName;
    return (
      <view className={containerClass}>
        {nodes.map((node, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: HTML 节点顺序固定，使用 index 作为 key 是安全的
          <React.Fragment key={index}>{renderNode(node)}</React.Fragment>
        ))}
      </view>
    );
  }

  // 内联样式模式：直接返回节点数组（保持向后兼容）
  return nodes.map((node, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: HTML 节点顺序固定，使用 index 作为 key 是安全的
    <React.Fragment key={index}>{renderNode(node)}</React.Fragment>
  ));
});

/**
 * 直接渲染 HTML 为 React 元素
 *
 * 这是一个纯函数，不使用 React hooks，适用于：
 * - 测试环境
 * - 非 React 环境
 * - 需要直接获取渲染结果而非组件的场景
 *
 * @param props - 渲染参数
 * @returns Lynx React 元素数组或容器
 */
export function renderHTMLDirect(props: HTMLRendererProps) {
  const {
    html,
    removeAllClass = true,
    removeAllStyle = false,
    styleMode = 'inline',
    rootClassName = 'lynx-html-renderer',
    darkMode = false,
    linkStyle,
  } = props;

  const nodes = transformHTML(html, {
    removeAllClass,
    removeAllStyle,
    styleMode,
    linkStyle,
  });

  // CSS类模式：添加根容器
  if (styleMode === 'css-class') {
    const containerClass = darkMode
      ? `${rootClassName} lhr-dark`
      : rootClassName;
    return (
      <view className={containerClass}>
        {nodes.map((node, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: HTML 节点顺序固定，使用 index 作为 key 是安全的
          <React.Fragment key={index}>{renderNode(node)}</React.Fragment>
        ))}
      </view>
    );
  }

  return nodes.map((node, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: HTML 节点顺序固定，使用 index 作为 key 是安全的
    <React.Fragment key={index}>{renderNode(node)}</React.Fragment>
  ));
}

// 为向后兼容，将 HTMLRenderer 也作为函数导出（允许直接调用）
// 使用类型断言避免 @ts-expect-error
type HTMLRendererType = typeof HTMLRenderer & {
  render: typeof renderHTMLDirect;
};

(HTMLRenderer as HTMLRendererType).render = renderHTMLDirect;

// 导出公共类型
export type { HTMLRendererProps };
export type { LynxElementNode, LynxNode, LynxTextNode } from './lynx/types';
// 导出适配器扩展 API
export {
  AdapterRegistry,
  getAdapterRegistry,
  registerAdapterByRole,
  registerAdapterByTag,
} from './render/adapter-registry';
export type { LynxRenderAdapter, RenderContext } from './render/types';
export type { TransformOptions } from './transform/types';
