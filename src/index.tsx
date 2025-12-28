import { memo, useCallback, useMemo } from 'react';
import { transformHTML } from './html-parser';
import { AdapterRegistry } from './render/adapter-registry';
import type {
  LynxElementNode,
  LynxNode,
  LynxRenderAdapter,
  RenderContext,
  RenderResult,
} from './render/types';

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

class CellAdapter implements LynxRenderAdapter {
  match(node: LynxElementNode): boolean {
    return node.role === 'cell';
  }

  render(node: LynxElementNode, ctx: RenderContext) {
    const cellStyle = {
      ...node.props.style,
    };

    return <view style={cellStyle}>{ctx.renderChildren(node)}</view>;
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
    // 处理文本节点，将 marks 转换为样式
    const style: Record<string, string | number> = {};
    if (node.marks?.bold) style.fontWeight = 'bold';
    if (node.marks?.italic) style.fontStyle = 'italic';
    if (node.marks?.underline) style.textDecoration = 'underline';
    if (node.marks?.code) {
      style.fontFamily = 'monospace';
      style.backgroundColor = '#f0f0f0';
      style.padding = '2px 4px';
      style.borderRadius = '3px';
    }

    return <text style={style}>{node.content}</text>;
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
}) {
  const {
    html,
    removeAllClass = true,
    removeAllStyle = false,
    styleMode = 'inline',
    rootClassName = 'lynx-html-renderer',
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
    return (
      <view className={rootClassName}>{nodes.map(memoizedRenderNode)}</view>
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
}) {
  const {
    html,
    removeAllClass = true,
    removeAllStyle = false,
    styleMode = 'inline',
  } = props;

  const nodes = transformHTML(html, {
    removeAllClass,
    removeAllStyle,
    styleMode,
  });

  return nodes.map(renderNode);
}
// 为向后兼容，将HTMLRenderer也作为函数导出（允许直接调用）
// @ts-expect-error - 将组件作为函数导出用于测试
(
  HTMLRenderer as typeof HTMLRenderer & {
    __callAsFunction?: typeof renderHTMLDirect;
  }
).__callAsFunction = renderHTMLDirect;
