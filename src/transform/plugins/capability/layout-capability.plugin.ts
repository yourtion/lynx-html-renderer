import type { LynxElementNode, LynxNode, TransformPlugin } from '../../types';

/**
 * 布局能力插件
 * 职责：确保所有节点都有合理的布局能力
 */
export const layoutCapabilityPlugin: TransformPlugin = {
  name: 'layout-capability',
  phase: 'capability',
  order: 20,

  apply(ctx) {
    // 确保所有元素节点都有 capabilities
    ensureCapabilities(ctx.root);
  },
};

/**
 * 递归确保节点有 capabilities
 */
function ensureCapabilities(node: LynxNode): void {
  if (node.kind === 'element') {
    const element = node as LynxElementNode;

    // 如果没有 capabilities，添加默认值
    if (!element.capabilities) {
      element.capabilities = {
        layout: 'flex',
        isVoid: false,
      };
    }

    // 递归处理子节点
    for (const child of element.children) {
      ensureCapabilities(child);
    }
  }
}
