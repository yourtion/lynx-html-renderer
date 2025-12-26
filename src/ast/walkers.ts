import type { HtmlAstNode } from './types';

/**
 * 深度优先遍历 AST 树
 * @param node AST 根节点
 * @param callback 访问每个节点时的回调函数
 */
export function walkAst(
  node: HtmlAstNode,
  callback: (node: HtmlAstNode) => void,
): void {
  callback(node);

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      walkAst(child, callback);
    }
  }
}

/**
 * 深度优先遍历 AST 树（带停止条件）
 * @param node AST 根节点
 * @param callback 访问每个节点时的回调函数，返回 true 停止遍历
 * @returns 是否提前停止遍历
 */
export function walkAstUntil(
  node: HtmlAstNode,
  callback: (node: HtmlAstNode) => boolean,
): boolean {
  if (callback(node)) {
    return true;
  }

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (walkAstUntil(child, callback)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 查找匹配条件的所有 AST 节点
 * @param node AST 根节点
 * @param predicate 匹配条件函数
 * @returns 匹配的节点数组
 */
export function findAstNodes(
  node: HtmlAstNode,
  predicate: (node: HtmlAstNode) => boolean,
): HtmlAstNode[] {
  const results: HtmlAstNode[] = [];

  walkAst(node, (n) => {
    if (predicate(n)) {
      results.push(n);
    }
  });

  return results;
}

/**
 * 查找第一个匹配条件的 AST 节点
 * @param node AST 根节点
 * @param predicate 匹配条件函数
 * @returns 匹配的节点或 undefined
 */
export function findFirstAstNode(
  node: HtmlAstNode,
  predicate: (node: HtmlAstNode) => boolean,
): HtmlAstNode | undefined {
  let result: HtmlAstNode | undefined;

  walkAstUntil(node, (n) => {
    if (predicate(n)) {
      result = n;
      return true;
    }
    return false;
  });

  return result;
}
