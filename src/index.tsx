import { transformHTML } from './html-parser';
import type {
  LynxElementNode,
  LynxNode,
  LynxRenderAdapter,
  RenderContext,
  RenderResult,
} from './typings';

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

// 适配器映射
const builtinAdapters: LynxRenderAdapter[] = [
  new TableAdapter(),
  new RowAdapter(),
  new CellAdapter(),
  new ViewAdapter(),
  new TextAdapter(),
  new ImageAdapter(),
];

// 适配器解析函数
function resolveAdapter(node: LynxElementNode): LynxRenderAdapter {
  // 查找匹配的适配器
  for (const adapter of builtinAdapters) {
    if (adapter.match(node)) {
      return adapter;
    }
  }
  // 默认使用 ViewAdapter
  return new ViewAdapter();
}

// 渲染上下文实现
const createRenderContext = (
  renderNode: (node: LynxNode) => RenderResult,
): RenderContext => {
  return {
    renderChildren(node: LynxElementNode) {
      return node.children.map(renderNode);
    },
  };
};

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
  const ctx = createRenderContext(renderNode);
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

export function HTMLRenderer(props: {
  html: string;
  removeAllClass?: boolean;
  removeAllStyle?: boolean;
}) {
  const { html, removeAllClass = true, removeAllStyle = false } = props;
  const nodes = transformHTML(html, { removeAllClass, removeAllStyle });
  return nodes.map(renderNode);
}
