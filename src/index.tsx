import { transformHTML } from './html-parser.ts';
import type { LynxNode } from './typings.js';

function render(node: LynxNode) {
  if (node.kind === 'text') {
    return <text style={node.props?.style}>{node.content}</text>;
  }

  return <view {...node.props}>{node.children.map(render)}</view>;
}

export function HTMLRenderer(props: { html: string }) {
  const { html } = props;
  const nodes = transformHTML(html);
  return nodes.map(render);
}
