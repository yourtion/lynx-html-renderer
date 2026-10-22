import type { HtmlAstNode } from '../ast/types';
import { HTMLTransformError } from '../errors';
import type { TransformLimits } from './types';

const DEFAULT_LIMITS: Required<TransformLimits> = {
  maxInputLength: 1_000_000,
  maxNodes: 50_000,
  maxDepth: 256,
};

export function resolveLimits(
  limits?: TransformLimits,
): Required<TransformLimits> {
  const resolved = { ...DEFAULT_LIMITS };
  for (const key of Object.keys(DEFAULT_LIMITS) as Array<
    keyof TransformLimits
  >) {
    const value = limits?.[key] ?? DEFAULT_LIMITS[key];
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new HTMLTransformError(
        `${key} must be a non-negative safe integer`,
        'parse',
        {
          code: 'VALIDATION_ERROR',
        },
      );
    }
    resolved[key] = value;
  }
  return resolved;
}

export function checkLimit(
  name: keyof TransformLimits,
  actual: number,
  maximum: number,
): void {
  if (actual > maximum) {
    throw new HTMLTransformError(
      `${name} exceeded (${actual} > ${maximum})`,
      'parse',
      {
        code: 'LIMIT_EXCEEDED',
      },
    );
  }
}

/** Run before any recursive plugins, using only O(depth) traversal storage. */
export function validateInputTree(
  ast: HtmlAstNode,
  limits: Required<TransformLimits>,
): void {
  const stack = [{ children: ast.children ?? [], index: 0, depth: 0 }];
  let count = 0;
  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (frame.index === frame.children.length) {
      stack.pop();
      continue;
    }
    const node = frame.children[frame.index++];
    checkLimit('maxNodes', ++count, limits.maxNodes);
    const isElement =
      node.type === 'tag' || node.type === 'script' || node.type === 'style';
    const depth = frame.depth + (isElement ? 1 : 0);
    checkLimit('maxDepth', depth, limits.maxDepth);
    if (node.children?.length) {
      stack.push({ children: node.children, index: 0, depth });
    }
  }
}
