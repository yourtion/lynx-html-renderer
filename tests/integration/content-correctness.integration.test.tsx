import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';
import { HTMLRenderer, renderHTMLDirect } from '../../src/index';

// These assertions cover the ReactLynx node/attribute bridge, not native layout.
describe('content correctness through the renderer', () => {
  it.each(['inline', 'css-class'] as const)(
    'preserves pre text and translated image sizes in %s mode',
    (styleMode) => {
      const { container } = render(
        <HTMLRenderer
          styleMode={styleMode}
          html={
            '<pre><span>one</span>\n  <span>two</span></pre><img src="x.png" width="100" height="50" style="width:200px">'
          }
        />,
      );
      expect(container.textContent).toBe('one\n  two');
      const style = container.querySelector('image')?.getAttribute('style');
      expect(style).toContain('width: 200px');
      expect(style).toContain('height: 50px');
    },
  );

  it('renders explicit and reversed list ordinals', () => {
    const { container } = render(
      <HTMLRenderer html='<ol start="5" reversed><li>a</li><li value="9">b</li><li>c</li></ol>' />,
    );
    expect(container.textContent).toBe('5. a9. b8. c');
  });

  it('passes limits through the direct renderer', () => {
    expect(() =>
      renderHTMLDirect({
        html: '<div><p>x</p></div>',
        limits: { maxDepth: 1 },
      }),
    ).toThrow('maxDepth exceeded');
  });

  it('invalidates the component transform when limits change', () => {
    const { container, rerender } = render(
      <HTMLRenderer html="<p>x</p>" limits={{ maxNodes: 2 }} />,
    );
    expect(container.textContent).toBe('x');
    expect(() =>
      rerender(<HTMLRenderer html="<p>x</p>" limits={{ maxNodes: 1 }} />),
    ).toThrow('maxNodes exceeded');
  });
});
