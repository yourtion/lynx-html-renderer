/**
 * React 树渲染（共享实现）。
 *
 * 从主入口抽出，供 HTMLRenderer 与 PapiHTMLRenderer（适配器 Portal 桥接）
 * 共用，避免两份实现漂移。
 */
import React from 'react';
import { getMergedTextStyle } from '../lynx/text-styles';
import type { AdapterRegistry } from './adapter-registry';
import type {
  LynxElementNode,
  LynxNode,
  LynxRenderAdapter,
  RenderContext,
} from './types';

export function createRenderContext(registry: AdapterRegistry): RenderContext {
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

function renderNodeWithRegistry(
  node: LynxNode,
  registry: AdapterRegistry,
  ctx: RenderContext,
): React.ReactNode {
  if (node.kind === 'text') {
    const { style, className } = getMergedTextStyle(node);

    return (
      <text style={style} {...(className && { className })}>
        {node.content}
      </text>
    );
  }

  const adapter: LynxRenderAdapter = registry.resolve(node);
  return adapter.render(node, ctx);
}
