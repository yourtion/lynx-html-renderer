import { parseDocument } from 'htmlparser2';
import { createRootNode } from '../lynx/factory';
import { createTransformContext } from './context';
import { TransformPluginResolver } from './resolver';
import type {
  HtmlAstNode,
  LynxNode,
  TransformOptions,
  TransformPhase,
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

/**
 * 遍历 LynxNode 树
 * 用于批量处理能力阶段
 */
function walkLynxNodeTree(
  node: LynxNode,
  callback: (node: LynxNode) => void,
): void {
  callback(node);

  // 只有元素节点有子节点
  if (node.kind === 'element' && node.children) {
    for (const child of node.children) {
      walkLynxNodeTree(child, callback);
    }
  }
}

/**
 * 执行能力阶段（批量处理优化）
 *
 * 如果插件实现了 registerCapabilityHandlers，则使用批量处理：
 * - 所有处理器在一次遍历中调用
 * - 减少树遍历次数从 3 次到 1 次
 *
 * 否则回退到传统方式：调用每个插件的 apply() 方法
 */
function executeCapabilityPhaseWithBatching(
  plugins: typeof TransformPluginResolver.prototype.getPluginsByPhase,
  ctx: typeof import('./context').TransformContextImpl,
): void {
  const capabilityPlugins = plugins('capability');

  // 步骤 1: 注册所有处理器
  for (const plugin of capabilityPlugins) {
    if (plugin.registerCapabilityHandlers) {
      const handlers = plugin.registerCapabilityHandlers(ctx);
      for (const [nodeKind, handler] of handlers) {
        ctx.utils.registerHandler(nodeKind, handler);
      }
    } else {
      // 回退：使用传统 apply() 方法
      plugin.apply(ctx);
    }
  }

  // 步骤 2: 单次遍历执行所有处理器
  if (ctx._handlerRegistry && ctx._handlerRegistry.size > 0) {
    walkLynxNodeTree(ctx.root, (node) => {
      // 对于元素节点，使用 tag 来匹配处理器
      // 对于文本节点，使用 'text' 来匹配
      const key =
        node.kind === 'element' ? (node as { tag: string }).tag : node.kind;
      const handlers = ctx._handlerRegistry?.get(key) || [];

      for (const handler of handlers) {
        const result = handler(node, ctx);
        if (result && result !== node) {
          // Handler 返回了替换节点
          ctx.utils.replaceNode(node, result);
        }
      }
    });

    // 清理 handler registry（为下次 transform 准备）
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
    ctx.metadata.rootClassName = options.rootClassName ?? 'lynx-html-renderer';
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
        plugin.apply(ctx);
      }
    }
  }

  // 7. 返回根节点的子节点
  return root.children;
}
