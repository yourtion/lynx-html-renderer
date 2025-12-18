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

  // 转换子节点
  let transformedNodes: LynxNode[] = [];

  // 获取HTML转换处理器
  const htmlTransformProcessors = pluginManager.getHtmlTransformProcessors();

  if (htmlTransformProcessors.length > 0) {
    // 如果有注册的HTML转换处理器，使用第一个
    transformedNodes = htmlTransformProcessors[0](html, {
      parseDocument,
      transformChildren: (nodes: HtmlParserNode[]) => transformChildren(nodes),
    });
  } else {
    // 否则使用默认转换逻辑
    transformedNodes = transformChildren(rootNodes);
  }

  return transformedNodes;
}

/**
 * 转换子节点
 * 使用插件系统的节点转换处理器
 */
function transformChildren(
  nodes: HtmlParserNode[],
  parentMarks: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
  } = {},
): LynxNode[] {
  const result: LynxNode[] = [];

  for (const node of nodes) {
    const transformed = transformNode(node, parentMarks);
    if (transformed) {
      result.push(transformed);
    }
  }

  return result;
}

/**
 * 转换单个节点
 * 使用插件系统的节点转换处理器
 */
function transformNode(
  node: HtmlParserNode,
  parentMarks: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
  } = {},
): LynxNode | null {
  // 获取节点转换处理器
  const nodeTransformProcessors = pluginManager.getNodeTransformProcessors();

  if (nodeTransformProcessors.length > 0) {
    // 使用第一个节点转换处理器
    return nodeTransformProcessors[0](node, parentMarks, {
      getTagHandlers: pluginManager.getTagHandlers.bind(pluginManager),
      getNodePostProcessors:
        pluginManager.getNodePostProcessors.bind(pluginManager),
      transformChildren: (nodes) => transformChildren(nodes, parentMarks),
    });
  }

  // 默认转换逻辑
  // 文本节点处理
  if (node.type === 'text') {
    const content = node.data;
    if (!content?.trim()) return null;

    let result = {
      kind: 'text',
      content: content || '',
      marks: { ...parentMarks },
    };

    // 应用节点后处理器
    for (const processor of pluginManager.getNodePostProcessors()) {
      result = processor(result);
    }

    return result;
  }

  // 标签节点处理
  if (node.type === 'tag') {
    const tag = node.name?.toLowerCase() || '';

    // 获取该标签的所有处理器
    const tagHandlers = pluginManager.getTagHandlers(tag);

    // 尝试使用插件处理器
    for (const handler of tagHandlers) {
      const result = handler(node, {
        defaultTransform: () => null,
        transformChildren: (nodes) => transformChildren(nodes, parentMarks),
      });

      if (result !== null) {
        // 应用节点后处理器
        let processedNode = result;
        for (const processor of pluginManager.getNodePostProcessors()) {
          processedNode = processor(processedNode);
        }

        return processedNode;
      }
    }
  }

  return null;
}
