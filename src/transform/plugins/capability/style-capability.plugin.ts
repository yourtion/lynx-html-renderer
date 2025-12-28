import type {
  CSSProperties,
  LynxElementNode,
  LynxNode,
  TransformPlugin,
} from '../../types';

/**
 * 样式能力插件
 * 职责：解析 HTML style 属性并转换为 Lynx style props
 */
export const styleCapabilityPlugin: TransformPlugin = {
  name: 'style-capability',
  phase: 'capability',
  order: 10,

  apply(ctx) {
    const removeAllStyle = (ctx.metadata.removeAllStyle as boolean) ?? false;
    const removeAllClass = (ctx.metadata.removeAllClass as boolean) ?? true;

    // 遍历所有节点，处理样式
    processStyles(ctx.root, { removeAllStyle, removeAllClass });
  },
};

/**
 * 递归处理节点样式
 */
function processStyles(
  lynxNode: LynxNode,
  options: { removeAllStyle: boolean; removeAllClass: boolean },
): void {
  if (lynxNode.kind === 'element') {
    const element = lynxNode as LynxElementNode;
    const sourceAttrs = element.meta?.sourceAttrs as
      | Record<string, string>
      | undefined;

    // 处理 style 属性
    if (!options.removeAllStyle && sourceAttrs?.style) {
      const styleFromAttr = parseStyleString(sourceAttrs.style);
      // 合并到现有 style
      element.props.style = {
        ...(element.props.style as CSSProperties),
        ...styleFromAttr,
      } as CSSProperties;
    }

    // 处理 class 属性
    if (!options.removeAllClass && sourceAttrs?.class) {
      element.props.className = sourceAttrs.class;
    }

    // 递归处理子节点
    for (const child of element.children) {
      processStyles(child, options);
    }
  }
}

/**
 * 解析 CSS style 字符串为对象
 * 将 kebab-case 转换为 camelCase
 */
function parseStyleString(style: string): CSSProperties {
  const result: CSSProperties = {};

  style.split(';').forEach((item) => {
    const [rawKey, rawValue] = item.split(':');
    if (!rawKey || !rawValue) return;

    // kebab-case → camelCase
    const key = rawKey.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = rawValue.trim();

    result[key] = value;
  });

  return result;
}
