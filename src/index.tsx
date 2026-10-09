import React, { memo, useMemo } from 'react';
import { transformHTML } from './html-parser';
import { getMarkStyles } from './lynx/text-styles';
import { AdapterRegistry, setGlobalRegistry } from './render/adapter-registry';
import { normalizeTextTreeForRender } from './render/text-normalizer';
import type {
  LynxElementNode,
  LynxNode,
  LynxRenderAdapter,
  RenderContext,
  RenderResult,
} from './render/types';
import type { TransformOptions } from './transform/types';
import { TEXT_ONLY_PROPERTIES } from './utils/style-schema';

// 内置适配器实现
class ViewAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode, ctx: RenderContext) {
    return <view {...node.props}>{ctx.renderChildren(node)}</view>;
  }
}

class TextAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode, ctx: RenderContext) {
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

    return (
      <view {...node.props} style={tableStyle}>
        {ctx.renderChildren(node)}
      </view>
    );
  }
}

class RowAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode, ctx: RenderContext) {
    const rowStyle = {
      ...node.props.style,
    };

    return (
      <view {...node.props} style={rowStyle}>
        {ctx.renderChildren(node)}
      </view>
    );
  }
}

class CellAdapter implements LynxRenderAdapter {
  render(node: LynxElementNode, ctx: RenderContext) {
    // 分离文本样式和其他样式
    const cellStyle: Record<string, unknown> = {};

    if (node.props.style) {
      for (const [key, value] of Object.entries(node.props.style)) {
        if (!TEXT_ONLY_PROPERTIES.has(key)) {
          cellStyle[key] = value;
        }
      }
    }

    // Text styles were resolved on the IR before rendering.
    return (
      <view {...node.props} style={cellStyle}>
        {ctx.renderChildren(node)}
      </view>
    );
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

  registry.registerDefaultByTag('view', viewAdapter);
  registry.registerDefaultByTag('text', new TextAdapter());
  registry.registerDefaultByTag('image', new ImageAdapter());
  registry.registerByRole('table', new TableAdapter());
  registry.registerByRole('row', new RowAdapter());
  registry.registerByRole('cell', new CellAdapter());

  return registry;
}

// 初始化全局适配器注册表（使用 createDefaultRegistry 减少重复代码）
const defaultAdapterRegistry = createDefaultRegistry();

// 设置全局注册表实例，供外部扩展使用
setGlobalRegistry(defaultAdapterRegistry);

function createRenderContext(registry: AdapterRegistry): RenderContext {
  const renderContext: RenderContext = {
    renderChildren(node: LynxElementNode) {
      return node.children.map((child, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: HTML 节点顺序固定，使用 index 作为 key 是安全的
        <React.Fragment key={index}>
          {renderContext.renderNode(child)}
        </React.Fragment>
      ));
    },

    renderNode(node: LynxNode) {
      return renderNodeWithRegistry(node, registry, renderContext);
    },
  };

  return renderContext;
}

// 主渲染函数
function renderNodeWithRegistry(
  node: LynxNode,
  registry: AdapterRegistry,
  ctx: RenderContext,
): RenderResult {
  if (node.kind === 'text') {
    const style = { ...getMarkStyles(node.marks), ...node.inheritableStyles };

    // 处理继承的类名（css-class 模式）
    const className = node.inheritableClasses;

    return (
      <text style={style} {...(className && { className })}>
        {node.content}
      </text>
    );
  }

  // 处理元素节点
  const adapter: LynxRenderAdapter = registry.resolve(node);
  return adapter.render(node, ctx);
}

/**
 * HTMLRenderer 组件属性
 */
export interface HTMLRendererProps
  extends Pick<
    TransformOptions,
    'plugins' | 'tagMappings' | 'unknownTagPolicy'
  > {
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
  /** 启用 transform 调试日志与指标采集（默认: false） */
  debug?: boolean;
  /** 可选：组件级适配器注册表，未提供时使用全局默认注册表 */
  adapterRegistry?: AdapterRegistry;
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
    debug = false,
    plugins,
    tagMappings,
    unknownTagPolicy,
    adapterRegistry: customAdapterRegistry,
  } = props;

  // Cache the transformed nodes to avoid re-parsing HTML on every render
  const nodes = useMemo(
    () =>
      transformHTML(html, {
        removeAllClass,
        removeAllStyle,
        styleMode,
        linkStyle,
        debug,
        plugins,
        tagMappings,
        unknownTagPolicy,
      }).map(normalizeTextTreeForRender),
    [
      html,
      removeAllClass,
      removeAllStyle,
      styleMode,
      linkStyle,
      debug,
      plugins,
      tagMappings,
      unknownTagPolicy,
    ],
  );
  const renderCtx = useMemo(
    () => createRenderContext(customAdapterRegistry ?? defaultAdapterRegistry),
    [customAdapterRegistry],
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
          <React.Fragment key={index}>
            {renderCtx.renderNode(node)}
          </React.Fragment>
        ))}
      </view>
    );
  }

  // 内联样式模式：直接返回节点数组（保持向后兼容）
  return nodes.map((node, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: HTML 节点顺序固定，使用 index 作为 key 是安全的
    <React.Fragment key={index}>{renderCtx.renderNode(node)}</React.Fragment>
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
    debug = false,
    plugins,
    tagMappings,
    unknownTagPolicy,
    adapterRegistry: customAdapterRegistry,
  } = props;

  const nodes = transformHTML(html, {
    removeAllClass,
    removeAllStyle,
    styleMode,
    linkStyle,
    debug,
    plugins,
    tagMappings,
    unknownTagPolicy,
  }).map(normalizeTextTreeForRender);
  const renderCtx = createRenderContext(
    customAdapterRegistry ?? defaultAdapterRegistry,
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
          <React.Fragment key={index}>
            {renderCtx.renderNode(node)}
          </React.Fragment>
        ))}
      </view>
    );
  }

  return nodes.map((node, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: HTML 节点顺序固定，使用 index 作为 key 是安全的
    <React.Fragment key={index}>{renderCtx.renderNode(node)}</React.Fragment>
  ));
}

// 为向后兼容，将 HTMLRenderer 也作为函数导出（允许直接调用）
// 使用类型断言避免 @ts-expect-error
type HTMLRendererType = typeof HTMLRenderer & {
  render: typeof renderHTMLDirect;
};

(HTMLRenderer as HTMLRendererType).render = renderHTMLDirect;

// 导出公共类型
export type { LynxElementNode, LynxNode, LynxTextNode } from './lynx/types';
// 导出适配器扩展 API
export {
  AdapterRegistry,
  getAdapterRegistry,
  registerAdapterByRole,
  registerAdapterByTag,
} from './render/adapter-registry';
export type { LynxRenderAdapter, RenderContext } from './render/types';
export { generateCSS, getClassNameForTag } from './styles';
export type { TagMapping } from './transform/plugins/structure/tag-config';
export type {
  PluginConfig,
  TransformOptions,
  TransformPlugin,
} from './transform/types';
