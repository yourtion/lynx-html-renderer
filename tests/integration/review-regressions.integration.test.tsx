import '@testing-library/jest-dom';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it, vi } from 'vitest';
import {
  createDefaultRegistry,
  HTMLRenderer,
  type LynxElementNode,
  type RenderContext,
  renderHTMLDirect,
  type TagMapping,
  type TransformPlugin,
} from '../../src/index';

function leafTexts(container: Element) {
  return Array.from(container.querySelectorAll('text')).filter(
    (node) => !node.querySelector('text'),
  );
}

const cardMapping: TagMapping = {
  lynxTag: 'custom-card',
  role: 'card',
  capabilities: { layout: 'flex' },
};

describe('Architecture review regressions', () => {
  it.each(['inline', 'css-class'] as const)(
    'preserves paragraph boxes and child color in %s mode',
    (styleMode) => {
      const { container } = render(
        <HTMLRenderer
          html='<p style="color:red;margin-bottom:20px;padding:8px"><span style="color:blue">T</span></p>'
          styleMode={styleMode}
        />,
      );
      const paragraph = container.querySelector('text');
      expect(paragraph?.getAttribute('style')).toContain('margin-bottom: 20px');
      expect(paragraph?.getAttribute('style')).toContain('padding: 8px');
      expect(leafTexts(container)[0].getAttribute('style')).toContain(
        'color: blue',
      );
      expect(leafTexts(container)[0].getAttribute('style')).not.toContain(
        'padding',
      );
    },
  );

  it('preserves heading and pre backgrounds, borders and spacing', () => {
    const { container } = render(
      <HTMLRenderer html='<h1 style="background-color:red;border-width:2px">Title</h1><pre style="padding:8px">Code</pre>' />,
    );
    const outerTexts = Array.from(container.children);
    expect(outerTexts[0].getAttribute('style')).toContain(
      'background-color: red',
    );
    expect(outerTexts[0].getAttribute('style')).toContain('border-width: 2px');
    expect(outerTexts[1].getAttribute('style')).toContain('padding: 8px');
  });

  it.each(['inline', 'css-class'] as const)(
    'inherits final inline styles through nested views in %s mode',
    (styleMode) => {
      const { container } = render(
        <HTMLRenderer
          html='<div style="color:red;font-size:20px"><div><p><strong>T</strong></p></div></div>'
          styleMode={styleMode}
        />,
      );
      const style = leafTexts(container)[0].getAttribute('style');
      expect(style).toContain('color: red');
      expect(style).toContain('font-size: 20px');
      expect(style).toContain('font-weight: bold');
    },
  );

  it('retains formatting attributes and lets explicit styles override marks', () => {
    const { container } = render(
      <HTMLRenderer
        html='<strong class="business" style="color:red;font-size:24px;font-weight:normal">A</strong><strong><span style="font-weight:normal">B</span></strong>'
        removeAllClass={false}
      />,
    );
    expect(container.querySelector('.business')).toBeTruthy();
    const texts = leafTexts(container);
    expect(texts[0].getAttribute('style')).toContain('color: red');
    expect(texts[0].getAttribute('style')).toContain('font-size: 24px');
    expect(texts[0].getAttribute('style')).toContain('font-weight: normal');
    expect(texts[1].getAttribute('style')).toContain('font-weight: normal');
  });

  it('preserves link styles, class, href and its container', () => {
    const { container } = render(
      <HTMLRenderer
        html='<a href="/next" class="link" style="color:red;padding:8px">T</a>'
        removeAllClass={false}
      />,
    );
    const link = container.querySelector('[data-href="/next"]');
    expect(link?.getAttribute('class')).toContain('link');
    expect(link?.getAttribute('style')).toContain('color: red');
    expect(link?.getAttribute('style')).toContain('padding: 8px');
    expect(leafTexts(container)[0].getAttribute('style')).toContain(
      'color: red',
    );
  });

  it('calls semantic table, row and cell adapters from real HTML', () => {
    const registry = createDefaultRegistry();
    const calls: string[] = [];
    for (const role of ['table', 'row', 'cell']) {
      registry.registerByRole(role, {
        render(node, ctx) {
          calls.push(node.role ?? '');
          return <view>{ctx.renderChildren(node)}</view>;
        },
      });
    }
    const { container } = render(
      <HTMLRenderer
        html="<table><tbody><tr><td>T</td></tr></tbody></table>"
        adapterRegistry={registry}
      />,
    );
    expect(calls).toEqual(['table', 'row', 'cell']);
    expect(container.textContent).toBe('T');
  });

  it('resolves header and cell text styles before the default adapters run', () => {
    const { container } = render(
      <HTMLRenderer html='<table><tr><th style="color:red">H</th><td style="color:blue;font-size:24px"><span>T</span></td></tr></table>' />,
    );
    const texts = leafTexts(container);
    expect(texts[0].getAttribute('style')).toContain('font-weight: bold');
    expect(texts[0].getAttribute('style')).toContain('color: red');
    expect(texts[1].getAttribute('style')).toContain('color: blue');
    expect(texts[1].getAttribute('style')).toContain('font-size: 24px');
  });

  it('passes plugins through both rendering APIs and invalidates memoized transforms', () => {
    const plugin = (color: string): TransformPlugin => ({
      name: `color-${color}`,
      phase: 'capability',
      order: 100,
      registerCapabilityHandlers() {
        return new Map([
          [
            'view',
            (node) => {
              if (node.kind === 'element')
                node.props.style = { ...node.props.style, color };
            },
          ],
        ]);
      },
    });
    const { container, rerender } = render(
      <HTMLRenderer html="<div>T</div>" plugins={{ extra: [plugin('red')] }} />,
    );
    expect(leafTexts(container)[0].getAttribute('style')).toContain(
      'color: red',
    );
    rerender(
      <HTMLRenderer
        html="<div>T</div>"
        plugins={{ extra: [plugin('blue')] }}
      />,
    );
    expect(leafTexts(container)[0].getAttribute('style')).toContain(
      'color: blue',
    );
    const direct = render(
      <view>
        {renderHTMLDirect({
          html: '<div>D</div>',
          plugins: { extra: [plugin('green')] },
        })}
      </view>,
    );
    expect(leafTexts(direct.container)[0].getAttribute('style')).toContain(
      'color: green',
    );
  });

  it.each(['component', 'direct'] as const)(
    'renders mapped custom tags using the %s API',
    (api) => {
      const registry = createDefaultRegistry();
      const adapter = vi.fn((node: LynxElementNode, ctx: RenderContext) => (
        <view data-card={node.props.title}>{ctx.renderChildren(node)}</view>
      ));
      registry.registerByTag('custom-card', { render: adapter });
      const props = {
        html: '<custom-card title="card" style="color:red"><p>T</p></custom-card>',
        adapterRegistry: registry,
        tagMappings: { 'custom-card': cardMapping },
      };
      const { container } = render(
        api === 'component' ? (
          <HTMLRenderer {...props} />
        ) : (
          <view>{renderHTMLDirect(props)}</view>
        ),
      );
      expect(adapter).toHaveBeenCalled();
      expect(container.querySelector('[data-card="card"]')?.textContent).toBe(
        'T',
      );
      expect(leafTexts(container)[0].getAttribute('style')).toContain(
        'color: red',
      );
    },
  );

  it('supports explicit fallback tags and complete document wrappers', () => {
    const registry = createDefaultRegistry();
    registry.registerByTag('custom-card', {
      render: (node, ctx) => (
        <view data-card="yes">{ctx.renderChildren(node)}</view>
      ),
    });
    const { container } = render(
      <HTMLRenderer
        html="<html><head><title>Hidden</title></head><body><custom-card><p>T</p></custom-card></body></html>"
        unknownTagPolicy="fallback"
        adapterRegistry={registry}
      />,
    );
    expect(container.querySelector('[data-card="yes"]')?.textContent).toBe('T');
    expect(container.textContent).toBe('T');
  });

  it('keeps code box styles on the container and honors explicit overrides', () => {
    const { container } = render(
      <HTMLRenderer html='<code style="background-color:red;padding:8px">T</code>' />,
    );
    expect(container.querySelector('text')?.getAttribute('style')).toContain(
      'background-color: red',
    );
    expect(container.querySelector('text')?.getAttribute('style')).toContain(
      'padding: 8px',
    );
    const leafStyle = leafTexts(container)[0].getAttribute('style');
    expect(leafStyle).toContain('font-family: monospace');
    expect(leafStyle).not.toContain('background-color');
    expect(leafStyle).not.toContain('padding');
  });

  it('preserves boxes added by capability plugins to formatting tags', () => {
    const plugin: TransformPlugin = {
      name: 'format-box',
      phase: 'capability',
      order: 200,
      registerCapabilityHandlers: () =>
        new Map([
          [
            'text',
            (node) => {
              if (
                node.kind === 'element' &&
                node.meta?.sourceTag === 'strong'
              ) {
                node.props.style = { ...node.props.style, padding: '8px' };
              }
            },
          ],
        ]),
    };
    const { container } = render(
      <HTMLRenderer html="<strong>T</strong>" plugins={{ extra: [plugin] }} />,
    );
    expect(container.querySelector('text')?.getAttribute('style')).toContain(
      'padding: 8px',
    );
  });

  it('inherits styles from body and attributed table sections', () => {
    const { container } = render(
      <HTMLRenderer html='<html><body style="color:red;font-size:20px"><table><tbody style="font-weight:bold"><tr><td>T</td></tr></tbody></table></body></html>' />,
    );
    const style = leafTexts(container)[0].getAttribute('style');
    // The cell has an intentional secondary default color; font properties inherit.
    expect(style).toContain('font-size: 20px');
    expect(style).toContain('font-weight: bold');
    expect(container.querySelector('view')?.getAttribute('style')).toContain(
      'color: red',
    );
  });

  it('retains custom default styles in CSS-class mode', () => {
    const registry = createDefaultRegistry();
    registry.registerByTag('custom-card', {
      render: (node, ctx) => (
        <view {...node.props}>{ctx.renderChildren(node)}</view>
      ),
    });
    const { container } = render(
      <HTMLRenderer
        html="<custom-card>T</custom-card>"
        styleMode="css-class"
        adapterRegistry={registry}
        tagMappings={{
          'custom-card': { ...cardMapping, defaultStyle: { color: 'red' } },
        }}
      />,
    );
    expect(leafTexts(container)[0].getAttribute('style')).toContain(
      'color: red',
    );
  });

  it('keeps list markers inline with formatted text and inherits explicit color', () => {
    const { container } = render(
      <HTMLRenderer html='<ul><li style="color:red"><strong>T</strong></li></ul>' />,
    );
    expect(container.textContent).toBe('• T');
    expect(leafTexts(container)).toHaveLength(1);
    expect(leafTexts(container)[0].getAttribute('style')).toContain(
      'color: red',
    );
  });

  it('retains default table layout when an inline style only changes color', () => {
    const { container } = render(
      <HTMLRenderer html='<table style="color:red"><tr><td>T</td></tr></table>' />,
    );
    expect(container.querySelector('view')?.getAttribute('style')).toContain(
      'flex-direction: column',
    );
  });

  it('keeps custom-mapped inline text containers available to adapters', () => {
    const registry = createDefaultRegistry();
    const renderCustom = vi.fn((node: LynxElementNode, ctx: RenderContext) => (
      <text>{ctx.renderChildren(node)}</text>
    ));
    registry.registerByTag('text', { render: renderCustom });
    render(
      <HTMLRenderer
        html="<custom-inline>T</custom-inline>"
        adapterRegistry={registry}
        tagMappings={{
          'custom-inline': {
            lynxTag: 'text',
            role: 'inline',
            capabilities: { textContainer: true },
          },
        }}
      />,
    );
    expect(renderCustom).toHaveBeenCalledTimes(1);
  });
});
