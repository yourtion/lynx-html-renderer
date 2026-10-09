import {
  createDefaultRegistry,
  HTMLRenderer,
  type HTMLRendererProps,
  type LynxRenderAdapter,
  renderHTMLDirect,
  type TransformPlugin,
} from '../../src/index';

const plugin: TransformPlugin = {
  name: 'consumer-style',
  phase: 'capability',
  registerCapabilityHandlers() {
    return new Map([
      [
        'view',
        (node) => {
          if (node.kind === 'element') node.props.style = { color: 'red' };
        },
      ],
    ]);
  },
};
const adapter: LynxRenderAdapter = {
  render(node, ctx) {
    return <view {...node.props}>{ctx.renderChildren(node)}</view>;
  },
};
const registry = createDefaultRegistry();
registry.registerByTag('custom-card', adapter);
const props: HTMLRendererProps = {
  html: '<custom-card>T</custom-card>',
  adapterRegistry: registry,
  plugins: { extra: [plugin] },
  tagMappings: {
    'custom-card': {
      lynxTag: 'custom-card',
      role: 'card',
      capabilities: { layout: 'flex' },
    },
  },
  unknownTagPolicy: 'unwrap',
};
export const component = <HTMLRenderer {...props} />;
export const direct = renderHTMLDirect(props);
export const invalidAdapter: LynxRenderAdapter = {
  // @ts-expect-error adapters must return a ReactNode, not an arbitrary object.
  render: () => ({ arbitrary: true }),
};
