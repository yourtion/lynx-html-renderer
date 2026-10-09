import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../src/html-parser';
import type {
  NodeCapabilityHandler,
  TransformPlugin,
} from '../../src/transform/types';

function handlerPlugin(
  name: string,
  order: number,
  tag: string,
  handler: NodeCapabilityHandler,
): TransformPlugin {
  return {
    name,
    phase: 'capability',
    order,
    registerCapabilityHandlers: () => new Map([[tag, handler]]),
  };
}

describe('Capability plugin composition', () => {
  it('supports replacement of the synthetic root with a text leaf', () => {
    const result = transformHTML('<div>T</div>', {
      plugins: {
        extra: [
          handlerPlugin('replace-root', 100, 'root', () => ({
            kind: 'text',
            content: 'replacement',
          })),
        ],
      },
    });
    expect(result).toMatchObject([{ kind: 'text', content: 'replacement' }]);
  });
  it('passes a replacement to the next handler and retains later mutations', () => {
    const result = transformHTML('<div>T</div>', {
      plugins: {
        extra: [
          handlerPlugin('replace', 100, 'view', (node) =>
            node.kind === 'element'
              ? { ...node, props: { ...node.props, first: true } }
              : undefined,
          ),
          handlerPlugin('mutate', 200, 'view', (node) => {
            if (node.kind === 'element') node.props.second = true;
          }),
        ],
      },
    });
    expect(result[0]).toMatchObject({ props: { first: true, second: true } });
  });

  it('uses apply plugins as order boundaries for preceding and following handlers', () => {
    const events: string[] = [];
    const apply = (name: string, order: number): TransformPlugin => ({
      name,
      order,
      phase: 'capability',
      apply: () => {
        events.push(name);
      },
    });
    transformHTML('<div>T</div>', {
      plugins: {
        extra: [
          apply('before', -100),
          handlerPlugin('first', 100, 'view', (node) => {
            if (node.meta?.sourceTag === 'div') events.push('first');
          }),
          apply('between', 150),
          handlerPlugin('second', 200, 'view', (node) => {
            if (node.meta?.sourceTag === 'div') events.push('second');
          }),
          apply('after', 250),
        ],
      },
    });
    expect(events).toEqual(['before', 'first', 'between', 'second', 'after']);
  });

  it('matches later handlers against the replacement tag', () => {
    const result = transformHTML('<div>T</div>', {
      plugins: {
        extra: [
          handlerPlugin('change-tag', 100, 'view', (node) =>
            node.kind === 'element' && node.meta?.sourceTag === 'div'
              ? { ...node, tag: 'frame' }
              : undefined,
          ),
          handlerPlugin('frame-only', 200, 'frame', (node) => {
            if (node.kind === 'element') node.props.matched = true;
          }),
        ],
      },
    });
    expect(result[0]).toMatchObject({ tag: 'frame', props: { matched: true } });
  });

  it('visits replacement children and discards the removed subtree', () => {
    const seen: string[] = [];
    const result = transformHTML('<div><span>old</span></div>', {
      plugins: {
        extra: [
          handlerPlugin('new-children', 100, 'view', (node) =>
            node.kind === 'element' && node.meta?.sourceTag === 'div'
              ? { ...node, children: [{ kind: 'text', content: 'new' }] }
              : undefined,
          ),
          handlerPlugin('child', 200, 'text', (node) => {
            if (node.kind === 'text') {
              seen.push(node.content);
              node.content += '!';
            }
          }),
        ],
      },
    });
    expect(seen).toEqual(['new']);
    expect(result[0]).toMatchObject({ children: [{ content: 'new!' }] });
  });

  it('does not lose child replacements when a parent is replaced', () => {
    const result = transformHTML('<div>T</div>', {
      plugins: {
        extra: [
          handlerPlugin('parent', 100, 'view', (node) =>
            node.kind === 'element'
              ? { ...node, children: [...node.children] }
              : undefined,
          ),
          handlerPlugin('leaf', 200, 'text', (node) =>
            node.kind === 'text' ? { ...node, content: 'replaced' } : undefined,
          ),
        ],
      },
    });
    expect(result[0]).toMatchObject({ children: [{ content: 'replaced' }] });
  });
});
