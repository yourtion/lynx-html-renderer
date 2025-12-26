import type { HtmlAstNode, LynxNode, TransformContext as ITransformContext } from './types';
import { walkAst } from '../ast/walkers';
import { createLynxNode, replaceLynxNode } from '../lynx/factory';

/**
 * TransformContext 实现
 */
export class TransformContextImpl implements ITransformContext {
  readonly ast: HtmlAstNode;
  root: LynxNode;
  metadata: Record<string, unknown> = {};

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
