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
    const plugins = resolver.getPluginsByPhase(phase);

    for (const plugin of plugins) {
      plugin.apply(ctx);
    }
  }

  // 7. 返回根节点的子节点
  return root.children;
}
