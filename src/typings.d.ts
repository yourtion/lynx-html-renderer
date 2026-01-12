/**
 * Type definitions re-exports
 *
 * This file re-exports all public types from their source modules
 * to provide a unified import interface.
 */

// LynxNode types - re-export from core types
export type {
  LynxNode,
  LynxElementNode,
  LynxTextNode,
  LynxProps,
  CSSProperties,
  ElementRole,
  Capabilities,
} from './lynx/types';

// Transform types - re-export from transform system
export type {
  HtmlAstNode,
  TransformPlugin,
  TransformContext,
  TransformOptions,
  PluginConfig,
  TransformPhase,
} from './transform/types';

// Renderer types - re-export from render layer
export type {
  RenderResult,
  LynxRenderAdapter,
  RenderContext,
} from './render/types';
