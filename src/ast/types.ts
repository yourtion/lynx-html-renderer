/**
 * HTML AST 节点类型（使用 htmlparser2 的类型）
 */
export interface HtmlAstNode {
  type: 'root' | 'text' | 'tag' | 'script' | 'style';
  data?: string;
  name?: string;
  attribs?: Record<string, string>;
  children?: HtmlAstNode[];
  /** 由 html-normalize 插件添加，标记为空白节点 */
  isWhitespace?: boolean;
}

/**
 * 检查节点是否为空白节点
 */
export function isWhitespaceNode(node: HtmlAstNode): boolean {
  return node.type === 'text' && node.isWhitespace === true;
}

/**
 * 检查节点是否为文本节点
 */
export function isTextNode(
  node: HtmlAstNode,
): node is HtmlAstNode & { type: 'text'; data: string } {
  return node.type === 'text';
}

/**
 * 检查节点是否为标签节点
 */
export function isTagNode(
  node: HtmlAstNode,
): node is HtmlAstNode & { type: 'tag'; name: string } {
  return node.type === 'tag';
}
