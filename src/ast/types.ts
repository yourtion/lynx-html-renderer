/**
 * HTML AST 节点类型（使用 htmlparser2 的类型）
 */
export interface HtmlAstNode {
  type: 'root' | 'text' | 'tag' | 'script' | 'style';
  data?: string;
  name?: string;
  attribs?: Record<string, string>;
  children?: HtmlAstNode[];
}
