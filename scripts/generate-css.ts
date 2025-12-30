/**
 * CSS生成脚本
 * 用于生成预编译的CSS文件
 */

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCSS } from '../src/utils/css-generator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateCSSFiles() {
  const rootDir = join(__dirname, '..');
  const distDir = join(rootDir, 'dist');

  // 确保 dist 目录存在
  if (!existsSync(distDir)) {
    await mkdir(distDir, { recursive: true });
    console.log('✅ Created dist directory');
  }

  // 生成完整版CSS
  const fullCSS = generateCSS();
  await writeFile(join(distDir, 'styles.css'), fullCSS, 'utf-8');
  console.log('✅ Generated dist/styles.css');

  // 生成压缩版CSS（简单移除换行和注释）
  const minifiedCSS = fullCSS
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
    .replace(/\s+/g, ' ') // 压缩空白
    .replace(/\s*\{\s*/g, '{') // 压缩花括号
    .replace(/\s*\}\s*/g, '}')
    .replace(/\s*:\s*/g, ':') // 压缩冒号
    .replace(/\s*;\s*/g, ';') // 压缩分号
    .trim();

  await writeFile(join(distDir, 'styles.min.css'), minifiedCSS, 'utf-8');
  console.log('✅ Generated dist/styles.min.css');

  console.log('\n🎉 CSS files generated successfully!');
}

generateCSSFiles().catch((error) => {
  console.error('❌ Error generating CSS files:', error);
  process.exit(1);
});
