/** 对比层配置（初始值，后续按实际数据调整） */
export const compareConfig = {
  pixelmatch: {
    /** 单像素 YIQ 色差容忍（0–1） */
    threshold: 0.1,
    /** 排除抗锯齿像素 */
    includeAA: false,
  },
  /** 触发 looks-same AA 复核的相似度区间 */
  aaReviewRange: {
    min: 0.80,
    max: 0.95,
  },
} as const;

/**
 * 判断一个相似度分数是否应触发 looks-same AA 复核。
 */
export function shouldReviewAA(similarity: number): boolean {
  return (
    similarity >= compareConfig.aaReviewRange.min &&
    similarity <= compareConfig.aaReviewRange.max
  );
}
