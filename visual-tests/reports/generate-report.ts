import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComparisonResult } from '../compare/types.js';
import type { Fixture } from '../fixtures/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPORTS_DIR = resolve(__dirname, '..');

interface ScreenshotPaths {
  baseline?: string;
  candidate?: string;
}

/**
 * 生成 HTML 对齐报告 + 结构化 JSON。
 *
 * @param results  所有对比结果
 * @param fixtures fixture 列表（用于特性分组）
 * @param screenshots 原始截图文件路径（fixtureId → { baseline, candidate }）
 */
export async function generateReport(
  results: ComparisonResult[],
  fixtures: Fixture[],
  screenshots: Map<string, ScreenshotPaths>,
): Promise<void> {
  const screenshotsDir = resolve(REPORTS_DIR, 'screenshots');
  await mkdir(screenshotsDir, { recursive: true });

  // 复制原始截图到报告目录
  for (const [fixtureId, paths] of screenshots) {
    const fixtureDir = resolve(screenshotsDir, fixtureId);
    await mkdir(fixtureDir, { recursive: true });

    if (paths.baseline) {
      await copyFile(paths.baseline, resolve(fixtureDir, 'baseline.png'));
    }
    if (paths.candidate) {
      await copyFile(paths.candidate, resolve(fixtureDir, 'candidate.png'));
    }

    // 复制 diff 图
    const result = results.find((r) => r.fixtureId === fixtureId);
    if (result) {
      await writeFile(resolve(fixtureDir, 'diff.png'), result.diffImage);
    }
  }

  // 生成 HTML 报告
  const html = buildHtmlReport(results, fixtures);
  await writeFile(resolve(REPORTS_DIR, 'align-report.html'), html);

  // 生成 JSON 数据
  const jsonData = results.map((r) => ({
    fixtureId: r.fixtureId,
    baseline: r.baseline,
    candidate: r.candidate,
    similarity: r.similarity,
    diffPixels: r.diffPixels,
    totalPixels: r.totalPixels,
    perceivedEqual: r.perceivedEqual,
    resized: r.resized,
  }));
  await writeFile(
    resolve(REPORTS_DIR, 'align-report.json'),
    JSON.stringify(jsonData, null, 2),
  );

  console.log(`✅ 报告已生成: ${resolve(REPORTS_DIR, 'align-report.html')}`);
}

/** 按特性分组聚合平均相似度 */
function aggregateByFeature(
  results: ComparisonResult[],
  fixtures: Fixture[],
): Map<string, number[]> {
  const featureMap = new Map<string, number[]>();
  for (const result of results) {
    const fixture = fixtures.find((f) => f.id === result.fixtureId);
    if (!fixture) continue;
    for (const feature of fixture.features) {
      const arr = featureMap.get(feature) ?? [];
      arr.push(result.similarity);
      featureMap.set(feature, arr);
    }
  }
  return featureMap;
}

function buildHtmlReport(
  results: ComparisonResult[],
  fixtures: Fixture[],
): string {
  const sorted = [...results].sort((a, b) => a.similarity - b.similarity);

  // 总览条形图数据
  const overviewBars = sorted
    .map((r) => {
      const pct = (r.similarity * 100).toFixed(1);
      const color =
        r.similarity >= 0.95
          ? '#28a745'
          : r.similarity >= 0.8
            ? '#ffc107'
            : '#dc3545';
      return `
        <div class="bar-row">
          <span class="bar-label">${r.fixtureId}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="bar-value">${pct}%</span>
        </div>`;
    })
    .join('');

  // 特性分组
  const featureAgg = aggregateByFeature(results, fixtures);
  const featureBars = [...featureAgg.entries()]
    .map(([feature, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const pct = (avg * 100).toFixed(1);
      const color =
        avg >= 0.95 ? '#28a745' : avg >= 0.8 ? '#ffc107' : '#dc3545';
      return `
        <div class="bar-row">
          <span class="bar-label">${feature}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="bar-value">${pct}%</span>
        </div>`;
    })
    .sort()
    .join('');

  // 逐项详情
  const details = sorted
    .map((r) => {
      const pct = (r.similarity * 100).toFixed(1);
      const aaTag =
        r.perceivedEqual !== undefined
          ? `<span class="tag ${r.perceivedEqual ? 'tag-ok' : 'tag-warn'}">AA复核: ${r.perceivedEqual ? '通过' : '仍有差异'}</span>`
          : '';
      const resizeTag = r.resized
        ? '<span class="tag tag-info">尺寸已对齐</span>'
        : '';
      return `
        <div class="detail-card">
          <h3>${r.fixtureId} — ${pct}%</h3>
          <p>差异像素: ${r.diffPixels} / ${r.totalPixels} ${aaTag} ${resizeTag}</p>
          <div class="img-grid">
            <div><h4>Baseline (${r.baseline})</h4><img src="screenshots/${r.fixtureId}/baseline.png" /></div>
            <div><h4>Candidate (${r.candidate})</h4><img src="screenshots/${r.fixtureId}/candidate.png" /></div>
            <div><h4>Diff</h4><img src="screenshots/${r.fixtureId}/diff.png" /></div>
          </div>
        </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>视觉对齐报告</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { margin-top: 40px; }
    .bar-row { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
    .bar-label { width: 200px; text-align: right; font-size: 14px; }
    .bar-track { flex: 1; height: 24px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; transition: width 0.3s; }
    .bar-value { width: 60px; font-size: 14px; font-weight: bold; }
    .detail-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .img-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
    .img-grid img { width: 100%; border: 1px solid #dee2e6; border-radius: 4px; }
    .img-grid h4 { margin: 0 0 8px 0; font-size: 13px; color: #666; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; margin-left: 8px; }
    .tag-ok { background: #d4edda; color: #155724; }
    .tag-warn { background: #fff3cd; color: #856404; }
    .tag-info { background: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <h1>视觉对齐报告</h1>

  <h2>总览</h2>
  ${overviewBars}

  <h2>按特性分组（平均相似度）</h2>
  ${featureBars}

  <h2>逐项详情</h2>
  ${details}
</body>
</html>`;
}
