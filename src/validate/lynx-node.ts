/**
 * LynxNode validation utilities
 */

import { LynxRenderError } from '../errors';
import type { LynxElementNode, LynxNode, LynxTextNode } from '../lynx/types';

/**
 * Validate a single LynxNode
 * @throws {LynxRenderError} If the node is invalid
 */
export function validateLynxNode(node: LynxNode): void {
  if (node.kind === 'element') {
    validateElementNode(node);
  } else if (node.kind === 'text') {
    validateTextNode(node);
  } else {
    throw new LynxRenderError(
      `Invalid node kind: "${node.kind}". Expected "element" or "text".`,
      node,
    );
  }
}

/**
 * Validate an element node
 * @throws {LynxRenderError} If the node is invalid
 */
function validateElementNode(node: LynxElementNode): void {
  if (!node.tag || typeof node.tag !== 'string') {
    throw new LynxRenderError(
      'Element node must have a valid tag property',
      node,
    );
  }

  if (!Array.isArray(node.children)) {
    throw new LynxRenderError('Element node children must be an array', node);
  }

  if (!node.props || typeof node.props !== 'object') {
    throw new LynxRenderError('Element node must have a props object', node);
  }

  // Recursively validate children
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    try {
      validateLynxNode(child);
    } catch (error) {
      if (error instanceof LynxRenderError) {
        // Add context about which child failed
        throw new LynxRenderError(
          `Invalid child at index ${i}: ${error.message}`,
          node,
          error instanceof Error ? error : undefined,
        );
      }
      throw error;
    }
  }
}

/**
 * Validate a text node
 * @throws {LynxRenderError} If the node is invalid
 */
function validateTextNode(node: LynxTextNode): void {
  if (typeof node.content !== 'string') {
    throw new LynxRenderError('Text node content must be a string', node);
  }

  // Validate marks if present
  if (node.marks) {
    if (typeof node.marks !== 'object' || Array.isArray(node.marks)) {
      throw new LynxRenderError('Text node marks must be an object', node);
    }

    // Check for valid mark types
    const validMarks = ['bold', 'italic', 'underline', 'code'];
    const invalidMarks = Object.keys(node.marks).filter(
      (key) => !validMarks.includes(key),
    );

    if (invalidMarks.length > 0) {
      throw new LynxRenderError(
        `Invalid mark types: ${invalidMarks.join(', ')}. Valid marks are: ${validMarks.join(', ')}`,
        node,
      );
    }
  }
}

/**
 * Validate an array of LynxNodes
 * @throws {LynxRenderError} If any node is invalid
 */
export function validateLynxNodes(nodes: LynxNode[]): void {
  if (!Array.isArray(nodes)) {
    throw new Error('LynxNodes must be an array');
  }

  for (let i = 0; i < nodes.length; i++) {
    try {
      validateLynxNode(nodes[i]);
    } catch (error) {
      if (error instanceof LynxRenderError) {
        throw new LynxRenderError(
          `Invalid node at index ${i}: ${error.message}`,
          nodes[i],
          error instanceof Error ? error : undefined,
        );
      }
      throw error;
    }
  }
}
