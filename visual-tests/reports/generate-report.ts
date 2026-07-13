import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
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
  // 清理上次的截图，避免残留混入本次报告
  await rm(screenshotsDir, { recursive: true, force: true });
  await mkdir(screenshotsDir, { recursive: true });

  // 只复制本次成功采集的 fixture 截图（baseline 和 candidate 都必须有）
  for (const [fixtureId, paths] of screenshots) {
    if (!paths.baseline || !paths.candidate) continue;
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

  // 生成独立 diff 对比查看器（slider 模式）
  const diffViewerHtml = buildDiffViewer(results);
  await writeFile(resolve(REPORTS_DIR, 'diff-viewer.html'), diffViewerHtml);

  console.log(`✅ 报告已生成: ${resolve(REPORTS_DIR, 'align-report.html')}`);
  console.log(`✅ 对比查看器: ${resolve(REPORTS_DIR, 'diff-viewer.html')}`);
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
          <h3>${r.fixtureId} — ${pct}% <a href="diff-viewer.html#${r.fixtureId}" class="slider-link">滑动对比 →</a></h3>
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
    .slider-link { font-size: 13px; color: #007bff; text-decoration: none; margin-left: 12px; }
    .slider-link:hover { text-decoration: underline; }
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

/** 生成独立 diff 对比查看器（slider 模式） */
function buildDiffViewer(results: ComparisonResult[]): string {
  const sorted = [...results].sort((a, b) => b.similarity - a.similarity);
  const fixtureList = sorted
    .map((r) => {
      const pct = (r.similarity * 100).toFixed(1);
      return `<option value="${r.fixtureId}">${r.fixtureId} (${pct}%)</option>`;
    })
    .join('');

  const data = sorted
    .map((r) => {
      const pct = (r.similarity * 100).toFixed(1);
      return `'${r.fixtureId}': { similarity: ${pct}, diffPixels: ${r.diffPixels}, totalPixels: ${r.totalPixels}, perceivedEqual: ${r.perceivedEqual}, resized: ${r.resized} },`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Diff 对比查看器</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #1a1a2e; color: #e0e0e0; height: 100vh; display: flex; flex-direction: column; }
    .toolbar { background: #16213e; padding: 12px 20px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #0f3460; }
    .toolbar select { background: #0f3460; color: #e0e0e0; border: 1px solid #533483; border-radius: 4px; padding: 6px 12px; font-size: 14px; }
    .toolbar .score { font-weight: bold; font-size: 16px; }
    .toolbar .meta { color: #888; font-size: 13px; }
    .toolbar a { color: #e94560; text-decoration: none; font-size: 14px; margin-left: auto; }
    .slider-container { flex: 1; overflow: auto; display: flex; align-items: flex-start; justify-content: center; position: relative; padding: 20px; }
    .compare { position: relative; display: inline-block; max-width: 100%; }
    .compare img { display: block; max-width: 100%; height: auto; user-select: none; -webkit-user-drag: none; }
    .compare .baseline { position: absolute; top: 0; left: 0; width: 50%; overflow: hidden; }
    .compare .baseline img { max-width: none; }
    .divider { position: absolute; top: 0; bottom: 0; width: 3px; background: #e94560; cursor: ew-resize; z-index: 10; }
    .divider::after { content: '⟷'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #e94560; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .label { position: absolute; top: 8px; padding: 4px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; z-index: 5; }
    .label-baseline { left: 8px; background: rgba(40, 167, 69, 0.85); color: white; }
    .label-candidate { right: 8px; background: rgba(220, 53, 69, 0.85); color: white; }
    .info-panel { background: #16213e; padding: 10px 20px; border-top: 1px solid #0f3460; display: flex; gap: 30px; font-size: 13px; }
    .info-panel .item { display: flex; gap: 6px; }
    .info-panel .item .key { color: #888; }
  </style>
</head>
<body>
  <div class="toolbar">
    <select id="fixtureSelect">${fixtureList}</select>
    <span class="score" id="score"></span>
    <span class="meta" id="meta"></span>
    <a href="align-report.html">← 返回报告</a>
  </div>
  <div class="slider-container">
    <div class="compare" id="compare">
      <img id="candidateImg" src="" alt="candidate" class="candidate-img-wrap" />
      <div class="baseline" id="baselineWrap">
        <img id="baselineImg" src="" alt="baseline" />
      </div>
      <div class="divider" id="divider"></div>
      <span class="label label-baseline">Baseline</span>
      <span class="label label-candidate">Candidate</span>
    </div>
  </div>
  <div class="info-panel">
    <div class="item"><span class="key">差异像素:</span><span id="diffPixels"></span></div>
    <div class="item"><span class="key">总像素:</span><span id="totalPixels"></span></div>
    <div class="item"><span class="key">AA复核:</span><span id="aaStatus"></span></div>
    <div class="item"><span class="key">尺寸对齐:</span><span id="resizeStatus"></span></div>
  </div>
  <script>
    var data = { ${data} };
    var compare = document.getElementById('compare');
    var baselineWrap = document.getElementById('baselineWrap');
    var divider = document.getElementById('divider');
    var candidateImg = document.getElementById('candidateImg');
    var baselineImg = document.getElementById('baselineImg');
    var select = document.getElementById('fixtureSelect');
    var sliderPos = 50;

    function loadFixture(id) {
      var d = data[id];
      candidateImg.src = 'screenshots/' + id + '/candidate.png';
      baselineImg.src = 'screenshots/' + id + '/baseline.png';
      document.getElementById('score').textContent = d.similarity + '%';
      document.getElementById('score').style.color = d.similarity >= 95 ? '#28a745' : d.similarity >= 80 ? '#ffc107' : '#dc3545';
      document.getElementById('meta').textContent = id;
      document.getElementById('diffPixels').textContent = d.diffPixels.toLocaleString();
      document.getElementById('totalPixels').textContent = d.totalPixels.toLocaleString();
      document.getElementById('aaStatus').textContent = d.perceivedEqual === undefined ? '未执行' : d.perceivedEqual ? '通过' : '仍有差异';
      document.getElementById('resizeStatus').textContent = d.resized ? '是' : '否';
      // 图片加载后对齐 baseline 宽度到 candidate
      candidateImg.onload = function() {
        var w = candidateImg.offsetWidth;
        baselineImg.style.width = w + 'px';
        updateSlider(50);
      };
    }

    function updateSlider(pct) {
      sliderPos = Math.max(0, Math.min(100, pct));
      var compareWidth = compare.offsetWidth;
      var px = (compareWidth * sliderPos) / 100;
      baselineWrap.style.width = px + 'px';
      divider.style.left = px + 'px';
    }

    select.addEventListener('change', function() { loadFixture(this.value); });

    var dragging = false;
    divider.addEventListener('mousedown', function(e) { dragging = true; e.preventDefault(); });
    document.addEventListener('mouseup', function() { dragging = false; });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      var rect = compare.getBoundingClientRect();
      var pct = ((e.clientX - rect.left) / rect.width) * 100;
      updateSlider(pct);
    });

    // Touch support
    divider.addEventListener('touchstart', function(e) { dragging = true; e.preventDefault(); });
    document.addEventListener('touchend', function() { dragging = false; });
    document.addEventListener('touchmove', function(e) {
      if (!dragging) return;
      var rect = compare.getBoundingClientRect();
      var pct = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      updateSlider(pct);
    });

    window.addEventListener('resize', function() { updateSlider(sliderPos); });

    // Load from hash
    var hashId = window.location.hash.substring(1);
    if (hashId && data[hashId]) {
      select.value = hashId;
      loadFixture(hashId);
    } else {
      loadFixture(select.value);
    }
  </script>
</body>
</html>`;
}
