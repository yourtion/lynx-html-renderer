import type { HtmlToLynxPlugin } from '../typings';
import { mergeAdjacentTextNodes } from './node-processors';
import {
  createBaseTagHandler,
  createTextHandler,
  TAG_MAP,
} from './tag-handlers';
import {
  childrenTransformProcessor,
  htmlTransformProcessor,
  nodeTransformProcessor,
} from './transformation-processors';

/**
 * 内置处理器类型枚举
 * 用于标识不同的内置处理流程，方便用户禁用或插入自定义处理器
 */
export enum BuiltinProcessorType {
  /** 基础标签转换处理器 */
  BASE_TAG_TRANSFORM = 'baseTagTransform',
  /** 文本节点处理器 */
  TEXT_NODE_HANDLER = 'textNodeHandler',
  /** 相邻文本节点合并处理器 */
  MERGE_ADJACENT_TEXT_NODES = 'mergeAdjacentTextNodes',
  /** 样式解析处理器 */
  STYLE_PARSER = 'styleParser',
}

// 内置插件定义
export const builtinPlugin: HtmlToLynxPlugin = {
  name: 'builtin',
  priority: 100,
  setup(ctx) {
    // 注册基础标签处理器，处理所有支持的标签
    Object.keys(TAG_MAP).forEach((tag) => {
      const baseHandler = createBaseTagHandler();
      ctx.registerTagHandler(tag, baseHandler);
    });

    // 注册文本节点处理器
    ctx.registerTagHandler('text', createTextHandler());

    // 注册相邻文本节点合并处理器
    ctx.registerNodePostProcessor(mergeAdjacentTextNodes);

    // 注册HTML转换处理器
    ctx.registerHtmlTransformProcessor(htmlTransformProcessor);

    // 注册子节点转换处理器
    ctx.registerChildrenTransformProcessor(childrenTransformProcessor);

    // 注册节点转换处理器
    ctx.registerNodeTransformProcessor(nodeTransformProcessor);
  },
};
