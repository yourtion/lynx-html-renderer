/**
 * CSS generation script
 * Uses the compiled library output so release builds do not depend on tsx.
 */

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadGenerateCSS() {
  const rootDir = join(__dirname, '..');
  const compiledModulePath = join(rootDir, 'dist', 'utils', 'css-generator.js');

  if (!existsSync(compiledModulePath)) {
    throw new Error(
      'Compiled css-generator module not found. Run "pnpm build:lib" first.',
    );
  }

  const moduleUrl = pathToFileURL(compiledModulePath).href;
  const { generateCSS } = await import(moduleUrl);
  return generateCSS;
}

async function generateCSSFiles() {
  const rootDir = join(__dirname, '..');
  const distDir = join(rootDir, 'dist');

  if (!existsSync(distDir)) {
    await mkdir(distDir, { recursive: true });
    console.log('Created dist directory');
  }

  const generateCSS = await loadGenerateCSS();
  const fullCSS = generateCSS();
  await writeFile(join(distDir, 'styles.css'), fullCSS, 'utf-8');
  console.log('Generated dist/styles.css');

  const minifiedCSS = fullCSS
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\{\s*/g, '{')
    .replace(/\s*\}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .trim();

  await writeFile(join(distDir, 'styles.min.css'), minifiedCSS, 'utf-8');
  console.log('Generated dist/styles.min.css');
}

generateCSSFiles().catch((error) => {
  console.error('Error generating CSS files:', error);
  process.exit(1);
});
