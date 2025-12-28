/**
 * Renderer type definitions
 *
 * This file contains all types related to the rendering layer
 */

// Re-export LynxNode types from the core types module
export type {
  Capabilities,
  CSSProperties,
  ElementRole,
  LynxElementNode,
  LynxNode,
  LynxProps,
  LynxTextNode,
} from '../lynx/types';

/**
 * Render result type
 * Represents the Lynx component JSX elements
 */
export type RenderResult = unknown;

/**
 * Render adapter interface
 * Adapters are responsible for rendering specific node types to Lynx components
 */
export interface LynxRenderAdapter {
  /**
   * Check if this adapter can handle the given node
   */
  match(node: LynxElementNode): boolean;

  /**
   * Render the node to a Lynx component
   */
  render(node: LynxElementNode, ctx: RenderContext): RenderResult;
}

/**
 * Render context interface
 * Provides utilities for rendering node children
 */
export interface RenderContext {
  /**
   * Render all children of a node
   */
  renderChildren(node: LynxElementNode): RenderResult[];
}
