import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../src/html-parser';
import type { LynxTextNode } from '../../src/lynx/types';
import { mergeAdjacentTextNodes } from '../../src/lynx/utils';
import type { TagMapping } from '../../src/transform/plugins/structure/tag-config';

function withoutRecentObjectAPIs(run: () => void): void {
  const descriptors = ['hasOwn', 'fromEntries'].map((key) => ({
    key,
    descriptor: Object.getOwnPropertyDescriptor(Object, key),
  }));
  try {
    for (const { key } of descriptors) {
      Object.defineProperty(Object, key, {
        configurable: true,
        writable: true,
        value: undefined,
      });
    }
    run();
  } finally {
    for (const { key, descriptor } of descriptors) {
      if (descriptor) Object.defineProperty(Object, key, descriptor);
      else Reflect.deleteProperty(Object, key);
    }
  }
}

describe('Lynx JavaScript runtime compatibility', () => {
  it.each(['inline', 'css-class'] as const)(
    'transforms inherited styles without recent Object APIs (%s)',
    (styleMode) => {
      withoutRecentObjectAPIs(() => {
        const nodes = transformHTML(
          '<div style="color:red"><p><span>A</span><span>B</span><span style="color:blue">C</span></p></div>',
          { styleMode },
        );
        expect(nodes).toMatchObject([
          {
            children: [
              {
                children: [
                  {
                    children: [
                      { content: 'A', inheritableStyles: { color: 'red' } },
                    ],
                  },
                  {
                    children: [
                      { content: 'B', inheritableStyles: { color: 'red' } },
                    ],
                  },
                  {
                    children: [
                      { content: 'C', inheritableStyles: { color: 'blue' } },
                    ],
                  },
                ],
              },
            ],
          },
        ]);
      });
    },
  );

  it('merges compatible text while preserving extension semantics without recent Object APIs', () => {
    const first: LynxTextNode = {
      kind: 'text',
      content: 'A',
      meta: { source: 'text', interaction: 'link' },
      inheritableStyles: { color: 'red' },
    };
    withoutRecentObjectAPIs(() => {
      expect(
        mergeAdjacentTextNodes([
          { ...first },
          {
            ...first,
            content: 'B',
            meta: { source: 'plugin', interaction: 'link' },
          },
          { ...first, content: 'C', meta: { interaction: 'button' } },
        ]),
      ).toMatchObject([{ content: 'AB' }, { content: 'C' }]);
    });
  });

  it('resolves null-prototype custom mappings, inline whitespace and fallback attributes', () => {
    const tagMappings: Record<string, TagMapping> = Object.create(null);
    tagMappings['custom-inline'] = {
      lynxTag: 'text',
      role: 'inline',
      capabilities: { textContainer: true },
    };
    withoutRecentObjectAPIs(() => {
      const nodes = transformHTML(
        '<custom-inline>A</custom-inline> <custom-inline>B</custom-inline><custom-card title="card">C</custom-card>',
        { tagMappings, unknownTagPolicy: 'fallback' },
      );
      expect(nodes).toMatchObject([
        { meta: { customMapping: true }, children: [{ content: 'A' }] },
        { content: ' ' },
        { meta: { customMapping: true }, children: [{ content: 'B' }] },
        { tag: 'custom-card', props: { title: 'card' } },
      ]);
    });
  });

  it('ignores inherited custom tag mappings', () => {
    const tagMappings: Record<string, TagMapping> = Object.create({
      'custom-card': { lynxTag: 'view', role: 'block' },
    });
    withoutRecentObjectAPIs(() => {
      expect(
        transformHTML('<custom-card>T</custom-card>', { tagMappings }),
      ).toEqual([]);
    });
  });
});
