import type {
  LynxElementNode,
  LynxNode,
  NodeCapabilityHandler,
  TransformPlugin,
} from '../../types';

/**
 * 布局能力插件
 * 职责：确保所有节点都有合理的布局能力
 */
export const layoutCapabilityPlugin: TransformPlugin = {
  name: 'layout-capability',
  phase: 'capability',
  order: 20,

  // NEW: 注册处理器（推荐方式，性能优化）
  registerCapabilityHandlers(_ctx) {
    const handlers = new Map<string, NodeCapabilityHandler>();

    // 通用的 element 节点处理器
    const layoutHandler = (node: LynxNode) => {
      if (node.kind !== 'element') return;

      const element = node as LynxElementNode;

      // CRITICAL: 提前检查
      // 如果已经有 capabilities，直接跳过
      if (element.capabilities) return;

      // 添加默认 capabilities
      element.capabilities = {
        layout: 'flex',
        isVoid: false,
      };
    };

    // 为所有可能的元素类型注册相同的处理器
    handlers.set('view', layoutHandler);
    handlers.set('text', layoutHandler);
    handlers.set('image', layoutHandler);
    handlers.set('frame', layoutHandler);

    return handlers;
  },

  // OLD: 传统 apply() 方法（向后兼容）
  apply(ctx) {
    // 确保所有元素节点都有 capabilities
    ensureCapabilities(ctx.root);
  },
};

/**
 * 递归确保节点有 capabilities（传统方式，保留作为向后兼容）
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
