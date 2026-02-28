import { parseDocument } from 'htmlparser2';
import { createRootNode } from '../lynx/factory';
import { createTransformContext, type TransformContextImpl } from './context';
import { TransformPluginResolver } from './resolver';
import type {
  HtmlAstNode,
  LynxNode,
  TransformOptions,
  TransformPhase,
  TransformPlugin,
} from './types';

/**
 * 转换阶段执行顺序
 */
const PHASES: TransformPhase[] = [
  'normalize',
  'structure',
  'capability',
  'finalize',
];

function nowMs(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}

function recordPluginTiming(
  ctx: TransformContextImpl,
  pluginName: string,
  durationMs: number,
): void {
  if (!ctx.metrics) return;

  const current = ctx.metrics.pluginTimings.get(pluginName) ?? 0;
  ctx.metrics.pluginTimings.set(pluginName, current + durationMs);
}

function countLynxNodes(node: LynxNode): number {
  if (node.kind !== 'element') return 1;

  let total = 1;
  for (const child of node.children) {
    total += countLynxNodes(child);
  }
  return total;
}

/**
 * 遍历 LynxNode 树
 * 用于批量处理能力阶段
 */
function walkLynxNodeTree(
  node: LynxNode,
  callback: (node: LynxNode, parent: LynxNode | null, index: number) => void,
  parent: LynxNode | null = null,
  index = -1,
): void {
  callback(node, parent, index);

  // 只有元素节点有子节点
  if (node.kind === 'element' && node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      walkLynxNodeTree(child, callback, node, i);
    }
  }
}

/**
 * 执行能力阶段（批量处理优化）
 *
 * capability 阶段使用 registerCapabilityHandlers 批量处理：
 * - 所有处理器在一次遍历中调用
 * - 减少树遍历次数从 3 次到 1 次
 */
function executeCapabilityPhaseWithBatching(
  getPlugins: (phase: TransformPhase) => TransformPlugin[],
  ctx: TransformContextImpl,
): void {
  const capabilityPlugins = getPlugins('capability');

  // 步骤 1: 注册所有处理器
  for (const plugin of capabilityPlugins) {
    if (!plugin.registerCapabilityHandlers) {
      throw new Error(
        `Capability plugin "${plugin.name}" must implement registerCapabilityHandlers()`,
      );
    }

    const registerStart = nowMs();
    const handlers = plugin.registerCapabilityHandlers(ctx);
    recordPluginTiming(ctx, plugin.name, nowMs() - registerStart);
    for (const [nodeKind, handler] of handlers) {
      ctx.utils.registerHandler(nodeKind, (node, context) => {
        const handlerStart = nowMs();
        const result = handler(node, context);
        recordPluginTiming(ctx, plugin.name, nowMs() - handlerStart);
        return result;
      });
    }
  }

  // 步骤 2: 收集替换操作（延迟应用）
  const replacementOps: Array<() => void> = [];

  if (ctx._handlerRegistry && ctx._handlerRegistry.size > 0) {
    walkLynxNodeTree(ctx.root, (node, parent, index) => {
      // 对于元素节点，使用 tag 来匹配处理器
      // 对于文本节点，使用 'text' 来匹配
      const key = node.kind === 'element' ? node.tag : node.kind;
      const handlers = ctx._handlerRegistry?.get(key) || [];

      for (const handler of handlers) {
        const result = handler(node, ctx);
        if (result && result !== node) {
          // 收集替换操作，不立即执行
          replacementOps.push(() => {
            if (!parent) {
              ctx.root = result;
              return;
            }

            if (parent.kind === 'element' && index >= 0) {
              parent.children[index] = result;
            }
          });
        }
      }
    });

    // 步骤 3: 遍历完成后统一应用替换
    for (const applyReplacement of replacementOps) {
      applyReplacement();
    }

    ctx._handlerRegistry.clear();
  }
}

/**
 * transformHTML 主函数
 * 完全基于新的插件系统实现
 */
export function transformHTML(
  html: string,
  options?: TransformOptions,
): LynxNode[] {
  // 1. 解析 HTML 为 AST
  const ast = parseDocument(html) as unknown as HtmlAstNode;

  // 2. 创建初始根节点（容器）
  const root = createRootNode();

  // 3. 解析插件配置
  const resolver = new TransformPluginResolver(options?.plugins);

  // 4. 创建转换上下文
  const ctx = createTransformContext(ast, root);

  // 5. 传递转换选项到 metadata
  if (options) {
    ctx.metadata.removeAllClass = options.removeAllClass ?? true;
    ctx.metadata.removeAllStyle = options.removeAllStyle ?? false;
    ctx.metadata.styleMode = options.styleMode ?? 'inline';
    ctx.metadata.linkStyle = options.linkStyle;
  }

  if (options?.debug) {
    ctx.metrics = {
      pluginTimings: new Map(),
      nodeCount: 0,
    };
  }

  // 6. 按阶段执行插件
  for (const phase of PHASES) {
    // 特殊处理 capability 阶段：使用批量处理优化
    if (phase === 'capability') {
      executeCapabilityPhaseWithBatching(
        resolver.getPluginsByPhase.bind(resolver),
        ctx,
      );
    } else {
      // 其他阶段使用传统方式
      const plugins = resolver.getPluginsByPhase(phase);
      for (const plugin of plugins) {
        if (!plugin.apply) {
          throw new Error(
            `Plugin "${plugin.name}" in phase "${phase}" must implement apply()`,
          );
        }
        const applyStart = nowMs();
        plugin.apply(ctx);
        recordPluginTiming(ctx, plugin.name, nowMs() - applyStart);
      }
    }
  }

  if (ctx.metrics) {
    ctx.metrics.nodeCount = countLynxNodes(ctx.root);

    if (options?.debug) {
      const timingSummary = [...ctx.metrics.pluginTimings.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, duration]) => `${name}: ${duration.toFixed(3)}ms`)
        .join(', ');

      console.debug(
        `[lynx-html-renderer] transform completed, nodeCount=${ctx.metrics.nodeCount}, pluginTimings={${timingSummary}}`,
      );
    }
  }

  // 7. 返回根节点的子节点
  return ctx.root.kind === 'element' ? ctx.root.children : [];
}
