import { parseDocument } from 'htmlparser2';
import { createParseError, createPluginError, PluginError } from '../errors';
import { createRootNode } from '../lynx/factory';
import { validateLynxNodes } from '../validate/lynx-node';
import { createTransformContext, type TransformContextImpl } from './context';
import { TransformPluginResolver } from './resolver';
import type {
  HtmlAstNode,
  LynxNode,
  NodeCapabilityHandler,
  TransformOptions,
  TransformPhase,
  TransformPlugin,
} from './types';
import { inheritTextStyles } from './utils/text-inheritance';

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

/** Consecutive handler plugins share a preorder walk. apply is a batch boundary. */
function executeCapabilityPhaseWithBatching(
  getPlugins: (phase: TransformPhase) => TransformPlugin[],
  ctx: TransformContextImpl,
): void {
  const groups: Array<Map<string, NodeCapabilityHandler[]>> = [];

  function flush() {
    if (!groups.length) return;
    const stack: Array<{
      node: LynxNode;
      parent: LynxNode | null;
      index: number;
    }> = [{ node: ctx.root, parent: null, index: -1 }];
    while (stack.length) {
      const entry = stack.pop();
      if (!entry) break;
      let current = entry.node;
      for (const handlers of groups) {
        const key = current.kind === 'element' ? current.tag : current.kind;
        for (const handler of [
          ...(handlers.get(key) ?? []),
          ...(handlers.get('*') ?? []),
        ]) {
          const result = handler(current, ctx);
          if (result) current = result;
        }
      }
      if (!entry.parent) ctx.root = current;
      else if (entry.parent.kind === 'element')
        entry.parent.children[entry.index] = current;
      // Visit the replacement's children, never the discarded subtree.
      if (current.kind === 'element') {
        for (let i = current.children.length - 1; i >= 0; i--) {
          stack.push({ node: current.children[i], parent: current, index: i });
        }
      }
    }
    groups.length = 0;
  }

  if (ctx._handlerRegistry.size) {
    groups.push(new Map(ctx._handlerRegistry));
    ctx._handlerRegistry.clear();
  }
  for (const plugin of getPlugins('capability')) {
    if (!plugin.registerCapabilityHandlers) {
      if (!plugin.apply) {
        throw createPluginError(
          plugin.name,
          'Capability plugins must implement registerCapabilityHandlers() or apply()',
          'capability',
        );
      }
      flush();
      const start = ctx.metrics ? nowMs() : 0;
      try {
        plugin.apply(ctx);
      } catch (error) {
        if (error instanceof PluginError) throw error;
        throw createPluginError(
          plugin.name,
          error instanceof Error ? error.message : 'Plugin apply() failed',
          'capability',
          error instanceof Error ? error : undefined,
        );
      }
      if (ctx.metrics) recordPluginTiming(ctx, plugin.name, nowMs() - start);
      continue;
    }

    const start = ctx.metrics ? nowMs() : 0;
    let registered: Map<string, NodeCapabilityHandler>;
    try {
      registered = plugin.registerCapabilityHandlers(ctx);
    } catch (error) {
      if (error instanceof PluginError) throw error;
      throw createPluginError(
        plugin.name,
        error instanceof Error
          ? error.message
          : 'registerCapabilityHandlers() failed',
        'capability',
        error instanceof Error ? error : undefined,
      );
    }
    if (ctx.metrics) recordPluginTiming(ctx, plugin.name, nowMs() - start);
    for (const [key, handler] of registered) {
      ctx.utils.registerHandler(key, (node, context) => {
        const handlerStart = ctx.metrics ? nowMs() : 0;
        try {
          return handler(node, context);
        } catch (error) {
          if (error instanceof PluginError) throw error;
          throw createPluginError(
            plugin.name,
            error instanceof Error
              ? error.message
              : 'capability handler failed',
            'capability',
            error instanceof Error ? error : undefined,
          );
        } finally {
          if (ctx.metrics)
            recordPluginTiming(ctx, plugin.name, nowMs() - handlerStart);
        }
      });
    }
    groups.push(new Map(ctx._handlerRegistry));
    ctx._handlerRegistry.clear();
  }
  flush();
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
  let ast: HtmlAstNode;
  try {
    ast = parseDocument(html) as unknown as HtmlAstNode;
  } catch (error) {
    throw createParseError(
      error instanceof Error ? error.message : 'Failed to parse HTML',
      html,
      error instanceof Error ? error : undefined,
    );
  }

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
    ctx.metadata.tagMappings = options.tagMappings;
    ctx.metadata.unknownTagPolicy = options.unknownTagPolicy ?? 'drop';
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
      inheritTextStyles(
        ctx.root,
        ctx.metadata.styleMode,
        ctx.metadata.removeAllStyle,
      );
    } else {
      // 其他阶段使用传统方式
      const plugins = resolver.getPluginsByPhase(phase);
      for (const plugin of plugins) {
        if (!plugin.apply) {
          throw createPluginError(
            plugin.name,
            `Plugins in phase "${phase}" must implement apply()`,
            phase,
          );
        }
        const applyStart = ctx.metrics ? nowMs() : 0;
        try {
          plugin.apply(ctx);
        } catch (error) {
          if (error instanceof PluginError) {
            throw error;
          }
          throw createPluginError(
            plugin.name,
            error instanceof Error ? error.message : 'Plugin apply() failed',
            phase,
            error instanceof Error ? error : undefined,
          );
        }
        if (ctx.metrics)
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
  const result = ctx.root.kind === 'element' ? ctx.root.children : [ctx.root];

  if (options?.debug) {
    validateLynxNodes(result);
  }

  return result;
}
