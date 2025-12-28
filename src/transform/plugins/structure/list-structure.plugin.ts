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

      // 尝试合并标记与第一个文本子节点
      if (
        liElement.children.length > 0 &&
        liElement.children[0].kind === 'text'
      ) {
        const firstText = liElement.children[0] as LynxTextNode;
        return {
          ...liElement,
          children: [
            {
              ...firstText,
              content: marker + firstText.content,
            },
            ...liElement.children.slice(1),
          ],
        };
      }

      // 如果没有文本子节点，添加标记作为新文本节点
      return {
        ...liElement,
        children: [
          {
            kind: 'text',
            content: marker,
            meta: { source: 'li-marker' },
          },
          ...liElement.children,
        ],
      };
    }

    return child;
  });
}
