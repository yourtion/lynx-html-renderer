import type { LynxTextNode } from "./typings.js";

export function HTMLRenderer(props: { node: LynxTextNode }) {
  const { node } = props;
  if (node.kind === 'text') {
    return <text style={node.props?.style}>{node.content}</text>;
  }
  return null;
}