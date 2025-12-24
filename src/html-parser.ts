import { parseDocument } from 'htmlparser2';
import { pluginManager } from './plugin-system';
import type { LynxNode } from './typings';

// 定义 htmlparser2 节点类型接口
interface HtmlParserNode {
  type: string;
  data?: string;
  name?: string;
  attribs?: Record<string, string>;
  children?: HtmlParserNode[];
}

/**
 * HTML转换主函数
 * 完全基于插件系统执行转换流程
 */
export function transformHTML(html: string): LynxNode[] {
  const document = parseDocument(html);

  // 获取文档子节点
  const rootNodes = document.children;

  // 获取HTML转换处理器
  const htmlTransformProcessors = pluginManager.getHtmlTransformProcessors();

  if (htmlTransformProcessors.length > 0) {
    // 如果有注册的HTML转换处理器，使用第一个
    return htmlTransformProcessors[0](html, {
      parseDocument,
      transformChildren: (nodes: HtmlParserNode[], parentMarks?: Record<string, boolean>) => transformChildren(nodes, parentMarks),
    });
  }

  // 否则返回空数组
  return [];
}

/**
 * 转换子节点
 * 使用插件系统的子节点转换处理器
 */
function transformChildren(
  nodes: HtmlParserNode[],
  parentMarks: Record<string, boolean> = {},
): LynxNode[] {
  // 获取子节点转换处理器
  const childrenTransformProcessors = pluginManager.getChildrenTransformProcessors();

  if (childrenTransformProcessors.length > 0) {
    // 使用第一个子节点转换处理器
    return childrenTransformProcessors[0](nodes, parentMarks, {
      transformNode: (node: HtmlParserNode, nodeParentMarks?: Record<string, boolean>) => transformNode(node, nodeParentMarks),
    });
  }

  // 否则返回空数组
  return [];
}

/**
 * 转换单个节点
 * 使用插件系统的节点转换处理器
 */
function transformNode(
  node: HtmlParserNode,
  parentMarks: Record<string, boolean> = {},
): LynxNode | null {
  // 获取节点转换处理器
  const nodeTransformProcessors = pluginManager.getNodeTransformProcessors();

  if (nodeTransformProcessors.length > 0) {
    // 使用第一个节点转换处理器
    return nodeTransformProcessors[0](node, parentMarks, {
      getTagHandlers: pluginManager.getTagHandlers.bind(pluginManager),
      getNodePostProcessors: pluginManager.getNodePostProcessors.bind(pluginManager),
      transformChildren: (nodes: HtmlParserNode[], childrenParentMarks?: Record<string, boolean>) => transformChildren(nodes, childrenParentMarks),
    });
  }

  return null;
}
