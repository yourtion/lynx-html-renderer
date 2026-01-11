/**
 * Custom error classes for better error handling and debugging
 */

import type { HtmlAstNode } from '../ast/types';
import type { LynxNode } from '../lynx/types';

/**
 * Error codes for transformation errors
 */
export type TransformErrorCode =
  /** HTML parsing failed */
  | 'PARSE_ERROR'
  /** Unsupported HTML tag encountered */
  | 'UNSUPPORTED_TAG'
  /** Style parsing failed */
  | 'STYLE_ERROR'
  /** Plugin execution failed */
  | 'PLUGIN_ERROR'
  /** Validation error */
  | 'VALIDATION_ERROR'
  /** Rendering error */
  | 'RENDER_ERROR';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Position information for error reporting
 */
export interface ErrorPosition {
  line: number;
  column: number;
  offset?: number;
}

/**
 * Base error class for HTML transformation errors
 */
export class HTMLTransformError extends Error {
  public readonly phase: string;
  public readonly code: TransformErrorCode;
  public readonly html?: string;
  public readonly position?: ErrorPosition;
  public readonly node?: HtmlAstNode;
  public readonly cause?: Error;

  constructor(
    message: string,
    phase: string,
    options?:
      | string
      | { html?: string; code?: TransformErrorCode; cause?: Error },
    causeOrHtml?: Error | string,
  ) {
    // Handle old signature: (message, phase, html, cause)
    let html: string | undefined;
    let cause: Error | undefined;
    let code: TransformErrorCode = 'PARSE_ERROR';

    if (typeof options === 'string') {
      // Old signature: (message, phase, html) - options is html
      html = options;
      cause =
        typeof causeOrHtml === 'object' && causeOrHtml !== null
          ? (causeOrHtml as Error)
          : undefined;
    } else if (options === undefined) {
      // No options provided
      cause =
        typeof causeOrHtml === 'object' && causeOrHtml !== null
          ? (causeOrHtml as Error)
          : undefined;
    } else if (options instanceof Error) {
      // Old signature: (message, phase, cause) - options is cause
      cause = options;
    } else if (typeof causeOrHtml === 'string') {
      // New signature with object - but causeOrHtml is a string (shouldn't happen)
      html = causeOrHtml;
      cause = (options as { cause?: Error }).cause;
      code = (options as { code?: TransformErrorCode }).code ?? 'PARSE_ERROR';
    } else if (typeof causeOrHtml === 'object' && causeOrHtml !== null) {
      // New signature with options object and cause - options is the object
      html = (options as { html?: string }).html;
      cause = causeOrHtml as Error;
      code = (options as { code?: TransformErrorCode }).code ?? 'PARSE_ERROR';
    } else {
      // New signature with options object only
      html = (options as { html?: string }).html;
      cause = (options as { cause?: Error }).cause;
      code = (options as { code?: TransformErrorCode }).code ?? 'PARSE_ERROR';
    }

    super(`[${code}] [${phase}] ${message}`);
    this.name = 'HTMLTransformError';
    this.phase = phase;
    this.code = code;
    this.html = html;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HTMLTransformError);
    }
  }

  /**
   * Get a detailed error report
   */
  getDetails(): string {
    let details = `${this.message}\n`;
    details += `Phase: ${this.phase}\n`;
    details += `Code: ${this.code}\n`;
    if (this.position) {
      details += `Position: line ${this.position.line}, column ${this.position.column}\n`;
    }
    if (this.cause) {
      details += `Caused by: ${this.cause.message}\n`;
    }
    if (this.html) {
      details += `HTML (first 200 chars): ${this.html.slice(0, 200)}${this.html.length > 200 ? '...' : ''}\n`;
    }
    return details;
  }
}

/**
 * Error class for Lynx rendering errors
 */
export class LynxRenderError extends Error {
  public readonly node: LynxNode;
  public readonly cause?: Error;

  constructor(message: string, node: LynxNode, cause?: Error) {
    super(`[Lynx Render Error] ${message}`);
    this.name = 'LynxRenderError';
    this.node = node;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LynxRenderError);
    }
  }

  /**
   * Get a detailed error report including node information
   */
  getDetails(): string {
    let details = `${this.message}\n`;
    details += `Node kind: ${this.node.kind}\n`;

    if (this.node.kind === 'element') {
      details += `Node tag: ${this.node.tag}\n`;
      details += `Children count: ${this.node.children.length}\n`;
      if (this.node.meta?.sourceTag) {
        details += `Source tag: ${this.node.meta.sourceTag}\n`;
      }
    } else if (this.node.kind === 'text') {
      details += `Text content (first 50 chars): ${this.node.content.slice(0, 50)}${this.node.content.length > 50 ? '...' : ''}\n`;
    }

    if (this.cause) {
      details += `Caused by: ${this.cause.message}\n`;
    }

    return details;
  }
}

/**
 * Error class for plugin execution errors
 */
export class PluginError extends Error {
  public readonly pluginName: string;
  public readonly phase: string;
  public readonly cause?: Error;

  constructor(
    message: string,
    pluginName: string,
    phase: string,
    cause?: Error,
  ) {
    super(`[Plugin Error] ${pluginName} failed in phase ${phase}: ${message}`);
    this.name = 'PluginError';
    this.pluginName = pluginName;
    this.phase = phase;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PluginError);
    }
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create a parse error
 */
export function createParseError(
  message: string,
  html: string,
  cause?: Error,
): HTMLTransformError {
  return new HTMLTransformError(message, 'parse', {
    code: 'PARSE_ERROR',
    html,
    cause,
  });
}

/**
 * Create an unsupported tag error
 */
export function createUnsupportedTagError(
  tag: string,
  phase: string,
  html: string,
): HTMLTransformError {
  return new HTMLTransformError(`Unsupported HTML tag: ${tag}`, phase, {
    code: 'UNSUPPORTED_TAG',
    html,
  });
}

/**
 * Create a style parsing error
 */
export function createStyleError(
  message: string,
  _style: string,
  phase: string,
  cause?: Error,
): HTMLTransformError {
  return new HTMLTransformError(message, phase, {
    code: 'STYLE_ERROR',
    cause,
  });
}

/**
 * Create a plugin error
 */
export function createPluginError(
  pluginName: string,
  message: string,
  phase: string,
  cause?: Error,
): PluginError {
  return new PluginError(message, pluginName, phase, cause);
}

/**
 * Check if an error is a transform error
 */
export function isTransformError(error: unknown): error is HTMLTransformError {
  return error instanceof HTMLTransformError;
}

/**
 * Check if an error is a render error
 */
export function isRenderError(error: unknown): error is LynxRenderError {
  return error instanceof LynxRenderError;
}

/**
 * Check if an error is a plugin error
 */
export function isPluginError(error: unknown): error is PluginError {
  return error instanceof PluginError;
}

/**
 * Get error code from any error
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof HTMLTransformError) return error.code;
  if (error instanceof LynxRenderError) return 'RENDER_ERROR';
  if (error instanceof PluginError) return 'PLUGIN_ERROR';
  if (error instanceof Error) return error.name;
  return undefined;
}
