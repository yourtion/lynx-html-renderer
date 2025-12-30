import React, { memo, useCallback, useMemo } from 'react';
import { transformHTML } from './html-parser';
import { AdapterRegistry } from './render/adapter-registry';
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
  match(node: LynxElementNode): boolean {
    return node.tag === 'view';
  }

  render(node: LynxElementNode, ctx: RenderContext) {
    return <view {...node.props}>{ctx.renderChildren(node)}</view>;
  }
}

class TextAdapter implements LynxRenderAdapter {
  match(node: LynxElementNode): boolean {
    return node.tag === 'text';
  }

  render(node: LynxElementNode, ctx: RenderContext) {
    // Special handling for transparent text wrappers with single text child with marks
    // These are created by inline formatting tags to avoid nested <text> elements
    if (hasTextChildWithMarks(node) && !node.props.style) {
      const innermostText = getInnermostTextWithMarks(node);
      if (
        innermostText &&
        innermostText.kind === 'text' &&
        innermostText.marks
      ) {
        // Render the innermost text child directly with its marks converted to styles
        return renderNode(innermostText);
      }
    }

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
        return renderNode(mergedTextNode);
      } else if (node.props.className) {
        // Has element className but no inheritableClasses
        const mergedTextNode = {
          ...textNode,
          inheritableClasses: node.props.className,
        };
        return renderNode(mergedTextNode);
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
          return renderNode(mergedTextNode);
        }
      }

      // Fall back to inheritableStyles if set
      if (textNode.inheritableStyles) {
        const mergedTextNode = {
          ...textNode,
          inheritableStyles: textNode.inheritableStyles,
        };
        return renderNode(mergedTextNode);
      }

      // If neither, render as-is (text node without styles)
      return renderNode(textNode);
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
        return renderNode(mergedTextNode);
      }
    }

    return <text {...node.props}>{ctx.renderChildren(node)}</text>;
  }
}

class ImageAdapter implements LynxRenderAdapter {
  match(node: LynxElementNode): boolean {
    return node.tag === 'image';
  }

  render(node: LynxElementNode) {
    return <image {...node.props} />;
  }
}

class TableAdapter implements LynxRenderAdapter {
  match(node: LynxElementNode): boolean {
    return node.role === 'table';
  }

  render(node: LynxElementNode, ctx: RenderContext) {
    const tableStyle = {
      ...node.props.style,
    };

    return <view style={tableStyle}>{ctx.renderChildren(node)}</view>;
  }
}

class RowAdapter implements LynxRenderAdapter {
  match(node: LynxElementNode): boolean {
    return node.role === 'row';
  }

  render(node: LynxElementNode, ctx: RenderContext) {
    const rowStyle = {
      ...node.props.style,
    };

    return <view style={rowStyle}>{ctx.renderChildren(node)}</view>;
  }
}

/**
 * 只在 text 元素上有效的 CSS 属性
 * 参考: https://github.com/context7/lynxjs/blob/main/api/elements/built-in/text.md
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
]);

class CellAdapter implements LynxRenderAdapter {
  match(node: LynxElementNode): boolean {
    return node.role === 'cell';
  }

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
      if (
        React.isValidElement(child) &&
        (child.type === 'text' || child.type === text)
      ) {
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

// 适配器注册表 - O(1) 查找性能
const adapterRegistry = new AdapterRegistry(new ViewAdapter());

// 注册所有内置适配器
adapterRegistry.registerByTag('view', new ViewAdapter());
adapterRegistry.registerByTag('text', new TextAdapter());
adapterRegistry.registerByTag('image', new ImageAdapter());
adapterRegistry.registerByRole('table', new TableAdapter());
adapterRegistry.registerByRole('row', new RowAdapter());
adapterRegistry.registerByRole('cell', new CellAdapter());

// 适配器解析函数 - 使用注册表实现 O(1) 查找
function resolveAdapter(node: LynxElementNode): LynxRenderAdapter {
  return adapterRegistry.resolve(node);
}

// 渲染上下文 - 模块级别单例，减少对象创建
let cachedContext: RenderContext | null = null;

function getRenderContext(
  renderNodeFn: (node: LynxNode) => RenderResult,
): RenderContext {
  if (!cachedContext) {
    cachedContext = {
      renderChildren(node: LynxElementNode) {
        return node.children.map(renderNodeFn);
      },
    };
  }
  return cachedContext;
}

// 主渲染函数
function renderNode(node: LynxNode): RenderResult {
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
  const ctx = getRenderContext(renderNode);
  return adapter.render(node, ctx);
}

// 辅助函数：检查是否有带 marks 的文本子节点
function hasTextChildWithMarks(node: LynxElementNode): boolean {
  if (node.children.length === 1 && node.children[0].kind === 'text') {
    const textNode = node.children[0];
    return (
      textNode.marks !== undefined && Object.keys(textNode.marks).length > 0
    );
  }
  // Also check if there's a single child which is another text wrapper (transparent wrapper from inline formatting)
  if (
    node.children.length === 1 &&
    node.children[0].kind === 'element' &&
    node.children[0].tag === 'text'
  ) {
    const childElement = node.children[0];
    // Check if this is a transparent wrapper (no props.style)
    if (!childElement.props.style && hasTextChildWithMarks(childElement)) {
      return true;
    }
  }
  return false;
}

// 辅助函数：获取最内层的带 marks 的文本节点
function getInnermostTextWithMarks(node: LynxElementNode): LynxNode | null {
  if (node.children.length === 1) {
    const child = node.children[0];
    // Direct text child with marks
    if (
      child.kind === 'text' &&
      child.marks &&
      Object.keys(child.marks).length > 0
    ) {
      return child;
    }
    // Transparent wrapper (element with tag 'text', no style)
    if (
      child.kind === 'element' &&
      child.tag === 'text' &&
      !child.props.style
    ) {
      return getInnermostTextWithMarks(child);
    }
  }
  return null;
}

export const HTMLRenderer = memo(function HTMLRenderer(props: {
  html: string;
  removeAllClass?: boolean;
  removeAllStyle?: boolean;
  styleMode?: 'inline' | 'css-class';
  rootClassName?: string;
  darkMode?: boolean;
}) {
  const {
    html,
    removeAllClass = true,
    removeAllStyle = false,
    styleMode = 'inline',
    rootClassName = 'lynx-html-renderer',
    darkMode = false,
  } = props;

  // Cache the transformed nodes to avoid re-parsing HTML on every render
  const nodes = useMemo(
    () => transformHTML(html, { removeAllClass, removeAllStyle, styleMode }),
    [html, removeAllClass, removeAllStyle, styleMode],
  );

  // Cache the renderNode function to maintain stable references
  // Note: renderNode is defined below and contains the rendering logic
  const memoizedRenderNode = useCallback(renderNode, []);

  // CSS类模式：添加根容器
  if (styleMode === 'css-class') {
    const containerClass = darkMode
      ? `${rootClassName} lhr-dark`
      : rootClassName;
    return (
      <view className={containerClass}>{nodes.map(memoizedRenderNode)}</view>
    );
  }

  // 内联样式模式：直接返回节点数组（保持向后兼容）
  return nodes.map(memoizedRenderNode);
});

/**
 * 直接渲染HTML为React元素（用于测试和非React环境）
 * 这是一个纯函数，不使用React hooks
 */
export function renderHTMLDirect(props: {
  html: string;
  removeAllClass?: boolean;
  removeAllStyle?: boolean;
  styleMode?: 'inline' | 'css-class';
  rootClassName?: string;
  darkMode?: boolean;
}) {
  const {
    html,
    removeAllClass = true,
    removeAllStyle = false,
    styleMode = 'inline',
    rootClassName = 'lynx-html-renderer',
    darkMode = false,
  } = props;

  const nodes = transformHTML(html, {
    removeAllClass,
    removeAllStyle,
    styleMode,
  });

  // CSS类模式：添加根容器
  if (styleMode === 'css-class') {
    const containerClass = darkMode
      ? `${rootClassName} lhr-dark`
      : rootClassName;
    return <view className={containerClass}>{nodes.map(renderNode)}</view>;
  }

  return nodes.map(renderNode);
}
// 为向后兼容，将HTMLRenderer也作为函数导出（允许直接调用）
// @ts-expect-error - 将组件作为函数导出用于测试
(
  HTMLRenderer as typeof HTMLRenderer & {
    __callAsFunction?: typeof renderHTMLDirect;
  }
).__callAsFunction = renderHTMLDirect;
