/**
 * 对齐评估模式入口。
 *
 * 流程：
 * 1. 启动所有 available provider
 * 2. 逐 fixture 截取所有 provider 的截图
 * 3. 以 chromium 为 baseline，对每个 candidate 做 pixelmatch + looks-same 对比
 * 4. 生成 HTML 对齐报告
 *
 * 用法：pnpm test:visual:align（需先手动启动 rspeedy dev）
 */

import { execSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareImages } from './compare/compare-images.js';
import type { ComparisonResult } from './compare/types.js';
import { fixtures } from './fixtures/index.js';
import { createProviders } from './providers/index.js';
import type { Screenshot } from './providers/types.js';
import { generateReport } from './reports/generate-report.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEMP_DIR = resolve(__dirname, '.tmp-screenshots');

const VIEWPORT = { width: 375, height: 812 };
const LYNX_WEB_BASE =
  'http://localhost:3000/__web_preview?casename=index.web.bundle';

async function main() {
  console.log('🎨 视觉对齐评估启动\n');

  // 重新生成 CSS（用 tsx 从源码生成，不依赖 dist 编译）
  console.log('[setup] 重新生成 CSS...');
  execSync('node --import tsx scripts/generate-css.mjs', {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
  console.log('[setup] CSS 生成完成\n');

  const providers = createProviders(LYNX_WEB_BASE);
  const available = providers.filter((p) => p.available);

  console.log(`活跃 providers: ${available.map((p) => p.name).join(', ')}`);
  console.log(`fixtures: ${fixtures.length} 个\n`);

  // 初始化所有 provider
  for (const provider of available) {
    console.log(`[setup] ${provider.name}...`);
    await provider.setup();
  }

  // 清空临时目录（避免上次运行的残留截图混入报告）
  await rm(TEMP_DIR, { recursive: true, force: true });
  await mkdir(TEMP_DIR, { recursive: true });

  const results: ComparisonResult[] = [];
  const screenshotPaths = new Map<
    string,
    { baseline?: string; candidate?: string }
  >();

  try {
    for (const fixture of fixtures) {
      console.log(`\n📸 截图: ${fixture.id} (${fixture.description})`);

      try {
        // 收集所有 provider 的截图
        const screenshots = new Map<string, Screenshot>();
        for (const provider of available) {
          process.stdout.write(`  [capture] ${provider.name}...`);
          try {
            const shot = await provider.capture(fixture, VIEWPORT);
            screenshots.set(provider.name, shot);

            // 保存临时文件
            const filePath = resolve(
              TEMP_DIR,
              `${fixture.id}-${provider.name}.png`,
            );
            await writeFile(filePath, shot.buffer);

            // 记录路径（chromium 为 baseline，其余为 candidate）
            const entry = screenshotPaths.get(fixture.id) ?? {};
            if (provider.name === 'chromium') {
              entry.baseline = filePath;
            } else {
              entry.candidate = filePath;
            }
            screenshotPaths.set(fixture.id, entry);

            console.log(' done');
          } catch (err) {
            console.log(` 失败: ${String(err).substring(0, 80)}`);
          }
        }

        // 对比：chromium vs 每个 candidate
        const baseline = screenshots.get('chromium');
        if (!baseline) {
          console.log(`  ⚠️ 无 chromium 截图，跳过对比`);
          continue;
        }

        for (const [candidateName, candidate] of screenshots) {
          if (candidateName === 'chromium') continue;

          process.stdout.write(`  [compare] chromium vs ${candidateName}...`);
          const result = await compareImages(
            baseline.buffer,
            candidate.buffer,
            fixture.id,
            'chromium',
            candidateName,
          );
          results.push(result);

          const pct = (result.similarity * 100).toFixed(1);
          const aa =
            result.perceivedEqual !== undefined
              ? ` (AA: ${result.perceivedEqual ? '通过' : '仍有差异'})`
              : '';
          console.log(` ${pct}%${aa}`);
        }
      } catch (err) {
        console.log(
          `  ⚠️ fixture 处理失败，跳过: ${String(err).substring(0, 100)}`,
        );
      }
    }
  } finally {
    // 清理 provider
    for (const provider of available) {
      await provider.teardown();
    }
  }

  // 生成报告
  console.log('\n📊 生成报告...');
  await generateReport(results, fixtures, screenshotPaths);

  // 汇总（防除零）
  if (results.length > 0) {
    const avgSim =
      results.reduce((a, r) => a + r.similarity, 0) / results.length;
    console.log(
      `\n✅ 完成！${results.length} 个对比，平均相似度: ${(avgSim * 100).toFixed(1)}%`,
    );
  } else {
    console.log('\n✅ 完成！无有效对比结果');
  }
  console.log(`   报告: pnpm test:visual:report`);
}

main().catch((err) => {
  console.error('❌ 对齐评估失败:', err);
  process.exit(1);
});
