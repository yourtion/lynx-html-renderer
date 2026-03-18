import { glob, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const IMPORT_PATTERN =
  /((?:import|export)\s+[^'"]*?from\s+|import\s*\()\s*(['"])(\.[^'"]+)\2/g;

function needsJsExtension(specifier) {
  return (
    specifier.startsWith('.') &&
    !specifier.endsWith('.js') &&
    !specifier.endsWith('.mjs') &&
    !specifier.endsWith('.json') &&
    !specifier.endsWith('.css')
  );
}

async function resolvePatchedSpecifier(filePath, specifier) {
  if (!needsJsExtension(specifier)) {
    return specifier;
  }

  const basePath = resolve(dirname(filePath), specifier);

  try {
    const directoryStat = await stat(basePath);
    if (directoryStat.isDirectory()) {
      return `${specifier}/index.js`;
    }
  } catch {}

  return `${specifier}.js`;
}

async function patchImports(filePath, source) {
  const matches = [...source.matchAll(IMPORT_PATTERN)];
  if (matches.length === 0) {
    return source;
  }

  let patched = source;
  for (const match of matches) {
    const [full, prefix, quote, specifier] = match;
    const nextSpecifier = await resolvePatchedSpecifier(filePath, specifier);

    if (nextSpecifier !== specifier) {
      patched = patched.replace(
        full,
        `${prefix}${quote}${nextSpecifier}${quote}`,
      );
    }
  }

  return patched;
}

async function main() {
  const distDir = join(process.cwd(), 'dist');

  for await (const file of glob('**/*.js', { cwd: distDir })) {
    const fullPath = join(distDir, file);
    const content = await readFile(fullPath, 'utf-8');
    const patched = await patchImports(fullPath, content);

    if (patched !== content) {
      await writeFile(fullPath, patched, 'utf-8');
    }
  }
}

main().catch((error) => {
  console.error('Failed to patch ESM imports:', error);
  process.exit(1);
});
