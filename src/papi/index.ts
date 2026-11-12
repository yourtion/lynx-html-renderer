/**
 * Element PAPI 直绘路线
 *
 * HTML → transformHTML（既有管道） → serializeNodes（精简序列化）
 *   → runOnMainThread → buildPapiTree（主线程直接构建原生元素树）
 */
export { buildPapiTree } from './builder';
export type { PapiHTMLRendererProps } from './PapiHTMLRenderer';
export { PapiHTMLRenderer } from './PapiHTMLRenderer';
export { serializeNodes, styleToCssString } from './serialize';
export type {
  PapiElementNode,
  PapiNode,
  PapiTextNode,
  PapiTree,
} from './types';
