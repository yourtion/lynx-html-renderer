import { createLynxNode } from '../../../lynx/factory';
import type {
  LynxElementNode,
  LynxNode,
  LynxTextNode,
  TransformPlugin,
} from '../../types';

/**
 * 列表结构插件
 * 职责：处理列表结构（ul/ol/li），添加列表标记
 */
export const listStructurePlugin: TransformPlugin = {
  name: 'list-structure',
  phase: 'structure',
  order: 20,

  apply(ctx) {
    // 遍历所有节点，查找列表
    processListMarkers(ctx.root);
  },
};

/**
 * 递归处理列表标记
 */
function processListMarkers(node: LynxNode): void {
  if (node.kind === 'element') {
    const element = node as LynxElementNode;

    // 检查是否是 ul 或 ol
    if (element.meta?.sourceTag === 'ul' || element.meta?.sourceTag === 'ol') {
      addListMarkers(element);
    }

    // 递归处理子节点
    for (const child of element.children) {
      processListMarkers(child);
    }
  }
}

/**
 * 为列表项添加标记
 */
function addListMarkers(listElement: LynxElementNode): void {
  const isOrdered = listElement.meta?.sourceTag === 'ol';
  let counter = 1;

  listElement.children = listElement.children.map((child) => {
    // 只处理 li 元素
    if (child.kind === 'element' && child.meta?.sourceTag === 'li') {
      const liElement = child as LynxElementNode;

      // 生成列表标记
      const marker = isOrdered ? `${counter}. ` : '• ';
      counter++;

      const firstText = liElement.children.map(findInlineText).find(Boolean);

      // 有文本子节点：把标记合并进首个文本，保证标记与内容在同一 <text> 内（同行渲染）
      if (firstText) {
        firstText.content = marker + firstText.content;
        return liElement;
      }

      // 无文本子节点：标记作为独立文本节点（携带 li 可继承样式）
      return {
        ...liElement,
        children: [
          createLynxNode({
            kind: 'text',
            content: marker,
            meta: { source: 'li-marker' },
          }),
          ...liElement.children,
        ],
      };
    }

    return child;
  });
}

function findInlineText(node: LynxNode): LynxTextNode | undefined {
  if (node.kind === 'text') return node;
  if (node.tag !== 'text' || node.role !== 'inline') return undefined;
  return node.children.map(findInlineText).find(Boolean);
}
