// global-setup.ts
// 测试前重新生成 CSS，确保源码改动（tag-config.ts / css-variables.ts）
// 反映到 web bundle 的内联 CSS 中。
// CSS 是构建时产物，rspeedy dev 的 HMR 不会自动重新生成。
// 用 tsx 直接从源码生成，避免依赖 dist 编译产物。

import { execSync } from 'node:child_process';

export default async function globalSetup() {
  console.log('[global-setup] 重新生成 CSS...');
  execSync('node --import tsx scripts/generate-css.mjs', {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
  console.log('[global-setup] CSS 生成完成');
}
