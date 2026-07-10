import pixelmatch from 'pixelmatch';
import looksSame from 'looks-same';
import sharp from 'sharp';
import type { ComparisonResult } from './types.js';
import { compareConfig, shouldReviewAA } from './config.js';

/**
 * 对比两张截图，返回相似度分数 + diff 图。
 *
 * 两段式策略：
 * 1. pixelmatch 主对比（每次都跑）— 算差异像素 + 生成 diff 图
 * 2. looks-same AA 复核（仅分数落在灰色区间时）— 判断是否为亚像素噪声
 *
 * @param baselineImg  基准图 PNG Buffer
 * @param candidateImg 候选图 PNG Buffer
 * @param fixtureId    fixture id（用于结果标识）
 * @param baselineName  基准 provider 名
 * @param candidateName 候选 provider 名
 */
export async function compareImages(
  baselineImg: Buffer,
  candidateImg: Buffer,
  fixtureId: string,
  baselineName: string,
  candidateName: string,
): Promise<ComparisonResult> {
  // 1. 解码 + 尺寸对齐
  const baselineMeta = await sharp(baselineImg).metadata();
  const candidateMeta = await sharp(candidateImg).metadata();

  const baselineW = baselineMeta.width!;
  const baselineH = baselineMeta.height!;
  const candidateW = candidateMeta.width!;
  const candidateH = candidateMeta.height!;

  // 以 baseline 尺寸为基准，candidate 缩放对齐
  let resizedCandidate = candidateImg;
  const resized = baselineW !== candidateW || baselineH !== candidateH;
  if (resized) {
    resizedCandidate = await sharp(candidateImg)
      .resize(baselineW, baselineH)
      .png()
      .toBuffer();
  }

  // 2. 转为 RGBA raw buffer
  const raw1 = await sharp(baselineImg)
    .ensureAlpha()
    .raw()
    .toBuffer();
  const raw2 = await sharp(resizedCandidate)
    .ensureAlpha()
    .raw()
    .toBuffer();

  const totalPixels = baselineW * baselineH;
  const diffRaw = Buffer.alloc(totalPixels * 4);

  // 3. pixelmatch 主对比
  const diffPixels = pixelmatch(raw1, raw2, diffRaw, baselineW, baselineH, {
    threshold: compareConfig.pixelmatch.threshold,
    includeAA: compareConfig.pixelmatch.includeAA,
  });

  const similarity = 1 - diffPixels / totalPixels;

  // 4. 生成 diff PNG（差异标红）
  const diffImage = await sharp(diffRaw, {
    raw: { width: baselineW, height: baselineH, channels: 4 },
  })
    .png()
    .toBuffer();

  // 5. looks-same AA 复核（条件触发）
  let perceivedEqual: boolean | undefined;
  if (shouldReviewAA(similarity)) {
    const result = await looksSame(baselineImg, resizedCandidate, {
      ignoreAntialiasing: true,
      antialiasingTolerance: 3,
      tolerance: 2.5,
    });
    perceivedEqual = result.equal;
  }

  return {
    fixtureId,
    baseline: baselineName,
    candidate: candidateName,
    similarity,
    diffPixels,
    totalPixels,
    diffImage,
    perceivedEqual,
    resized,
  };
}
