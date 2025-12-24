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
      display: 'flex',
      flexDirection: 'column',
      borderCollapse: 'collapse',
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
      display: 'flex',
      flexDirection: 'row',
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
      display: 'flex',
      padding: '8px',
      border: '1px solid #e0e0e0',
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

export function HTMLRenderer(props: { html: string }) {
  const nodes = transformHTML(props.html);
  return nodes.map(renderNode);
}
