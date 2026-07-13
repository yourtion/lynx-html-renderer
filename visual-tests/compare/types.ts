/** 单次对比的结果 */
export interface ComparisonResult {
  /** fixture id */
  fixtureId: string;
  /** 基准 provider 名 */
  baseline: string;
  /** 候选 provider 名 */
  candidate: string;
  /** 相似度分数 0–1（1 = 完全相同） */
  similarity: number;
  /** 差异像素数 */
  diffPixels: number;
  /** 总像素数 */
  totalPixels: number;
  /** diff 图 PNG Buffer（差异标红叠加） */
  diffImage: Buffer;
  /** looks-same 复核结论（仅分数落在灰色区间时存在） */
  perceivedEqual?: boolean;
  /** 截图尺寸是否经过缩放对齐 */
  resized: boolean;
}
