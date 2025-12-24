import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser.js';
import { BuiltinProcessorType } from '../../plugins/builtin.js';
import { mergeAdjacentTextNodes } from '../../plugins/node-processors.js';
import { defaultStyleHandler } from '../../plugins/style-handlers.js';
import { createTextHandler } from '../../plugins/tag-handlers.js';
import type { HtmlParserNode, LynxNode, LynxTextNode } from '../../typings.js';

describe('Plugin System - Builtin Plugin', () => {
  it('should have all builtin processor types defined', () => {
    // Test BuiltinProcessorType enum completeness
    expect(Object.values(BuiltinProcessorType)).toHaveLength(4);
    expect(BuiltinProcessorType.BASE_TAG_TRANSFORM).toBeDefined();
    expect(BuiltinProcessorType.TEXT_NODE_HANDLER).toBeDefined();
    expect(BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES).toBeDefined();
    expect(BuiltinProcessorType.STYLE_PARSER).toBeDefined();
  });

  it('should register all builtin processors', () => {
    // Test that builtin plugin correctly registers all processors
    const html = '<div><strong>Test</strong></div>';
    const result = transformHTML(html);
    expect(result).toBeDefined();
    // With marks system, strong tag creates text node with marks
    const textChild = result[0].children[0];
    expect(textChild?.kind).toBe('text');
    expect(textChild?.marks?.bold).toBe(true);
  });
});

describe('Builtin Processors', () => {
  it('should test defaultStyleHandler function', () => {
    // Test defaultStyleHandler function
    const inputStyle = { color: 'red', fontSize: '12px' };
    const result = defaultStyleHandler(inputStyle);
    expect(result).toEqual(inputStyle);

    // Test with empty style object
    expect(defaultStyleHandler({})).toEqual({});
  });

  it('should test createTextHandler function', () => {
    // Test createTextHandler function
    const textHandler = createTextHandler();
    const textNode: HtmlParserNode = {
      type: 'text',
      data: 'Test text content',
    };

    const result = textHandler(textNode);
    expect(result).toBeDefined();
    expect(result?.kind).toBe('text');
    expect(result?.content).toBe('Test text content');

    // Test with empty text
    const emptyTextNode: HtmlParserNode = {
      type: 'text',
      data: '   \n   ',
    };

    const emptyResult = textHandler(emptyTextNode);
    expect(emptyResult).toBe(null);
  });

  it('should test mergeAdjacentTextNodes function', () => {
    // Test mergeAdjacentTextNodes function
    const inputNode: LynxNode = {
      kind: 'element',
      tag: 'view',
      props: {},
      children: [
        { kind: 'text', content: 'Hello ' },
        { kind: 'text', content: 'World' },
        {
          kind: 'element',
          tag: 'text',
          props: {},
          children: [{ kind: 'text', content: 'test' }],
        },
        { kind: 'text', content: 'foo' },
        { kind: 'text', content: 'bar' },
      ],
    };

    const result = mergeAdjacentTextNodes(inputNode);
    expect(result).toBeDefined();
    expect(result.kind).toBe('element');
    expect(result.children).toHaveLength(3);
    expect(result.children[0].kind).toBe('text');
    expect((result.children[0] as LynxTextNode).content).toBe('Hello World');
    expect(result.children[2].kind).toBe('text');
    expect((result.children[2] as LynxTextNode).content).toBe('foobar');
  });

  it('should test childrenTransformProcessor indirectly through transformHTML', () => {
    // Test childrenTransformProcessor by rendering nested HTML
    const html =
      '<div><p>Paragraph <strong>with</strong> <em>formatting</em></p></div>';
    const result = transformHTML(html);
    expect(result).toBeDefined();
    expect(result[0].children).toHaveLength(1);

    // With marks system, inline formatting tags don't create wrapper elements
    // The <p> element has multiple text children with marks
    const pChildren = result[0].children[0].children;
    expect(pChildren.length).toBeGreaterThanOrEqual(1);

    // Check that marks are properly applied
    const hasBoldMark = pChildren.some(
      (child: LynxNode) => child.kind === 'text' && (child as LynxTextNode).marks?.bold,
    );
    const hasItalicMark = pChildren.some(
      (child: LynxNode) => child.kind === 'text' && (child as LynxTextNode).marks?.italic,
    );
    expect(hasBoldMark).toBe(true);
    expect(hasItalicMark).toBe(true);
  });
});
