import { walkAst } from '../ast/walkers';
import { createLynxNode, replaceLynxNode } from '../lynx/factory';
import type {
  HtmlAstNode,
  TransformContext as ITransformContext,
  LynxNode,
  NodeCapabilityHandler,
} from './types';

/**
 * TransformContext 实现
 */
export class TransformContextImpl implements ITransformContext {
  readonly ast: HtmlAstNode;
  root: LynxNode;
  metadata: Record<string, unknown> = {};

  // 内部：处理器注册表（用于批量处理优化）
  _handlerRegistry: Map<string, NodeCapabilityHandler[]> = new Map();

  utils = {
    walkAst: (cb: (node: HtmlAstNode) => void) => {
      walkAst(this.ast, cb);
    },

    createNode: (partial: Partial<LynxNode>) => {
      return createLynxNode(partial);
    },

    replaceNode: (target: LynxNode, next: LynxNode) => {
      replaceLynxNode(this.root, target, next);
    },

    registerHandler: (nodeKind: string, handler: NodeCapabilityHandler) => {
      if (!this._handlerRegistry.has(nodeKind)) {
        this._handlerRegistry.set(nodeKind, []);
      }
      this._handlerRegistry.get(nodeKind)?.push(handler);
    },
  };

  constructor(ast: HtmlAstNode, root: LynxNode) {
    this.ast = ast;
    this.root = root;
  }
}

/**
 * 创建 TransformContext
 */
export function createTransformContext(
  ast: HtmlAstNode,
  root: LynxNode,
): TransformContextImpl {
  return new TransformContextImpl(ast, root);
}
