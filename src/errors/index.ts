/**
 * Custom error classes for better error handling and debugging
 */

import type { LynxNode } from '../lynx/types';

/**
 * Base error class for HTML transformation errors
 */
export class HTMLTransformError extends Error {
  public readonly phase: string;
  public readonly html?: string;
  public readonly cause?: Error;

  constructor(message: string, phase: string, html?: string, cause?: Error) {
    super(`[HTML Transform Error in ${phase}] ${message}`);
    this.name = 'HTMLTransformError';
    this.phase = phase;
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
