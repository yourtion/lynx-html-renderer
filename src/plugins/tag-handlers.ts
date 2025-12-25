import { pluginManager } from '../plugin-system';
import type {
  Capabilities,
  ElementRole,
  HtmlParserNode,
  LynxNode,
  TagHandler,
} from '../typings';

// Define htmlparser2 node type interface
interface ExtendedHtmlParserNode extends HtmlParserNode {
  name?: string;
  attribs?: Record<string, string>;
  children?: ExtendedHtmlParserNode[];
}

// Define shared configuration object to reduce redundancy
const BLOCK_ELEMENT_CONFIG = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
  defaultStyle: { flexDirection: 'column' },
};

const INLINE_TEXT_CONFIG = {
  lynxTag: 'text',
  role: 'inline',
  capabilities: { layout: 'inline', textContainer: true, isVoid: false },
};

const TEXT_CONTAINER_CONFIG = {
  lynxTag: 'text',
  role: 'textContainer',
  capabilities: { layout: 'block', textContainer: true, isVoid: false },
};

const PRE_ELEMENT_CONFIG = {
  lynxTag: 'text',
  role: 'block',
  capabilities: { layout: 'block', textContainer: true, isVoid: false },
};

const LINK_CONFIG = {
  lynxTag: 'text',
  role: 'inline',
  capabilities: { layout: 'inline', textContainer: true, isVoid: false },
};

const HEADING_CONFIG = {
  lynxTag: 'text',
  role: 'textContainer',
  capabilities: { layout: 'block', textContainer: true, isVoid: false },
};

const LIST_ELEMENT_CONFIG = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
  defaultStyle: { flexDirection: 'column', paddingLeft: '5px' },
};

const TABLE_ELEMENT_CONFIG = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
};

const _TABLE_CELL_CONFIG = {
  lynxTag: 'view',
  role: 'cell',
  capabilities: { layout: 'flex', isVoid: false },
};

const BLOCK_QUOTE_CONFIG = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
  defaultStyle: {
    flexDirection: 'column',
    marginLeft: '40px',
    marginRight: '40px',
    paddingLeft: '16px',
    borderLeft: '4px solid #ddd',
  },
};

// Marks that specific tags contribute to text nodes
export const TAG_MARKS: Record<
  string,
  { bold?: boolean; italic?: boolean; underline?: boolean; code?: boolean }
> = {
  strong: { bold: true },
  b: { bold: true },
  em: { italic: true },
  i: { italic: true },
  u: { underline: true },
  code: { code: true },
};

// Tag mapping configuration
export const TAG_MAP: Record<
  string,
  {
    lynxTag: string;
    role: ElementRole;
    capabilities: Capabilities;
    defaultStyle?: Record<string, string | number>;
  }
> = {
  // Block elements (using shared configuration)
  div: BLOCK_ELEMENT_CONFIG,
  section: BLOCK_ELEMENT_CONFIG,
  article: BLOCK_ELEMENT_CONFIG,
  header: BLOCK_ELEMENT_CONFIG,
  footer: BLOCK_ELEMENT_CONFIG,
  nav: BLOCK_ELEMENT_CONFIG,
  aside: BLOCK_ELEMENT_CONFIG,

  // Text elements
  p: { ...TEXT_CONTAINER_CONFIG, defaultStyle: { marginBottom: '1em' } },
  span: INLINE_TEXT_CONFIG,

  // Heading elements (h1-h6)
  h1: {
    ...HEADING_CONFIG,
    defaultStyle: { fontSize: '32px', fontWeight: 'bold', margin: '10px 0' },
  },
  h2: {
    ...HEADING_CONFIG,
    defaultStyle: { fontSize: '24px', fontWeight: 'bold', margin: '12px 0' },
  },
  h3: {
    ...HEADING_CONFIG,
    defaultStyle: { fontSize: '20px', fontWeight: 'bold', margin: '14px 0' },
  },
  h4: {
    ...HEADING_CONFIG,
    defaultStyle: { fontSize: '18px', fontWeight: 'bold', margin: '16px 0' },
  },
  h5: {
    ...HEADING_CONFIG,
    defaultStyle: {
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '18px 0',
    },
  },
  h6: {
    ...HEADING_CONFIG,
    defaultStyle: {
      fontSize: '14px',
      fontWeight: 'bold',
      margin: '20px 0',
    },
  },

  // Text formatting (simplified duplicate configuration)
  strong: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontWeight: 'bold' },
  },
  b: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontWeight: 'bold' },
  },
  em: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontStyle: 'italic' },
  },
  i: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontStyle: 'italic' },
  },
  u: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { textDecoration: 'underline' },
  },
  code: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: { fontFamily: 'monospace' },
  },

  // List elements
  ul: LIST_ELEMENT_CONFIG,
  ol: LIST_ELEMENT_CONFIG,
  li: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: {
      flexDirection: 'column',
    },
  },

  // Other common elements
  a: {
    ...LINK_CONFIG,
    defaultStyle: { color: 'blue', textDecoration: 'underline' },
  },
  hr: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'block', isVoid: true },
    defaultStyle: { height: '1px', backgroundColor: '#ccc', margin: '1em 0' },
  },
  blockquote: BLOCK_QUOTE_CONFIG,
  pre: {
    ...PRE_ELEMENT_CONFIG,
    defaultStyle: {
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      padding: '16px',
      overflow: 'auto',
    },
  },

  // Image
  img: {
    lynxTag: 'image',
    role: 'image',
    capabilities: { layout: 'inline', isVoid: true },
  },

  // Line break
  br: {
    lynxTag: '__BR__',
    role: 'inline',
    capabilities: { layout: 'inline', isVoid: true },
  },

  // Table elements
  table: {
    lynxTag: 'view',
    role: 'table',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#dee2e6',
    },
  },
  thead: TABLE_ELEMENT_CONFIG,
  tbody: TABLE_ELEMENT_CONFIG,
  tfoot: TABLE_ELEMENT_CONFIG,
  tr: {
    lynxTag: 'view',
    role: 'row',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { display: 'flex', flexDirection: 'row' },
  },
  th: {
    lynxTag: 'view',
    role: 'cell',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: {
      display: 'flex',
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      padding: '8px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#dee2e6',
      backgroundColor: '#f8f9fa',
      fontWeight: 'bold',
    },
  },
  td: {
    lynxTag: 'view',
    role: 'cell',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: {
      display: 'flex',
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      padding: '8px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#dee2e6',
    },
  },
};

// Parse style string to object
function parseStyleString(style?: string): Record<string, string | number> {
  if (!style) return {};

  const res: Record<string, string | number> = {};

  style.split(';').forEach((item) => {
    const [rawKey, rawValue] = item.split(':');
    if (!rawKey || !rawValue) return;

    const key = rawKey.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = rawValue.trim();

    res[key] = value;
  });

  return res;
}

// Use a WeakMap to track list item counters for ordered lists
const _olCounters = new WeakMap<object, number>();

// Base tag processor
export const createBaseTagHandler = (): TagHandler => {
  const handler = (node: ExtendedHtmlParserNode, context) => {
    if (node.type !== 'tag') return null;

    const tag = node.name?.toLowerCase() || '';
    const mapping = TAG_MAP[tag];

    if (!mapping) return null;

    // br special processing
    if (mapping.lynxTag === '__BR__') {
      return {
        kind: 'text',
        content: '\n',
        meta: { source: 'br' },
      };
    }

    // Special handling for inline text formatting tags (strong, b, em, i, u, code)
    // These tags should NOT create wrapper elements - they just pass marks to children
    const isInlineFormatting = TAG_MARKS[tag] !== undefined;
    const hasInlineStyle =
      node.attribs?.style &&
      Object.keys(parseStyleString(node.attribs.style)).length > 0;

    if (isInlineFormatting && mapping.lynxTag === 'text' && !hasInlineStyle) {
      // For inline formatting tags without inline styles,
      // return the transformed children directly without wrapping
      // The marks are passed to children via parentMarks in transformChildren
      const children = context.transformChildren(node.children ?? []);

      // If single child, return it directly (unwraps the wrapper)
      if (children.length === 1) {
        return children[0];
      }

      // If multiple children, this shouldn't happen for simple formatting tags
      // but we need to return something valid
      return {
        kind: 'element',
        tag: 'text',
        props: {},
        children,
        meta: { sourceTag: tag },
      };
    }

    // Parse inline style string to object
    // 获取转换选项，决定是否删除 style
    const transformOptions = pluginManager.getTransformOptions();
    let styleFromAttr =
      transformOptions.removeAllStyle === true
        ? {}
        : parseStyleString(node.attribs?.style);

    // Apply global style processor
    const styleHandlers = pluginManager.getStyleHandlers();
    for (const styleHandler of styleHandlers) {
      styleFromAttr = styleHandler(styleFromAttr, node);
    }

    // Process text mark styles
    const textMarkStyle: Record<string, string | number> = {};
    if (tag === 'strong' || tag === 'b') {
      textMarkStyle.fontWeight = 'bold';
    } else if (tag === 'em' || tag === 'i') {
      textMarkStyle.fontStyle = 'italic';
    } else if (tag === 'u') {
      textMarkStyle.textDecoration = 'underline';
    } else if (tag === 'code') {
      textMarkStyle.fontFamily = 'monospace';
    }

    const style = {
      ...(mapping.defaultStyle ?? {}),
      ...textMarkStyle,
      ...styleFromAttr,
    };

    // Special handling for thead, tbody, tfoot - flatten them
    // These tags should not create wrapper elements, just return their children
    if (tag === 'thead' || tag === 'tbody' || tag === 'tfoot') {
      const children = context.transformChildren(node.children ?? []);
      // If only one child, return it directly
      if (children.length === 1) {
        return children[0];
      }
      // If multiple children (rare but possible), return a fragment-like structure
      // Since we can't return multiple nodes, wrap in a transparent view
      return {
        kind: 'element',
        tag: 'view',
        props: {},
        children,
        meta: { sourceTag: tag },
      };
    }

    // Transform children with special handling for ul/ol to add list markers
    let children: LynxNode[];
    if (tag === 'ul' || tag === 'ol') {
      // For ul/ol, transform children and add list markers to li elements
      const rawChildren = context.transformChildren(node.children ?? []);
      let liCounter = 1;
      children = rawChildren.map((child) => {
        if (child.kind === 'element' && child.meta?.sourceTag === 'li') {
          const marker = tag === 'ol' ? `${liCounter}. ` : '• ';
          liCounter++;
          // Try to merge marker with first text child
          if (child.children.length > 0 && child.children[0].kind === 'text') {
            const firstText = child.children[0];
            return {
              ...child,
              children: [
                {
                  ...firstText,
                  content: marker + firstText.content,
                },
                ...child.children.slice(1),
              ],
            };
          }
          // If no text child, add marker as text node
          return {
            ...child,
            children: [
              {
                kind: 'text',
                content: marker,
                meta: { source: 'li-marker' },
              },
              ...child.children,
            ],
          };
        }
        return child;
      });
    } else {
      children = context.transformChildren(node.children ?? []);
    }

    // Basic element node structure
    const baseNode = {
      kind: 'element',
      tag: mapping.lynxTag,
      props: {},
      children: mapping.capabilities.isVoid ? [] : children,
      meta: { sourceTag: tag },
    };

    // Process image elements, always add style attribute (even if empty object) to match test cases
    if (mapping.lynxTag === 'image') {
      baseNode.props.style = style;
      baseNode.props.src = node.attribs?.src;
    }
    // Other elements only add style when style object has properties
    else if (Object.keys(style).length > 0) {
      baseNode.props.style = style;
    }

    // Process className based on removeAllClass option
    if (transformOptions.removeAllClass !== true && node.attribs?.class) {
      baseNode.props.className = node.attribs.class;
    }

    // Process other void elements
    if (mapping.capabilities.isVoid && mapping.lynxTag !== 'image') {
      return baseNode;
    }

    return baseNode;
  };

  return handler;
};

// Text node processor
export const createTextHandler = (): TagHandler => {
  const handler = (node: ExtendedHtmlParserNode) => {
    if (node.type === 'text') {
      const content = node.data;
      if (!content?.trim()) return null;

      return {
        kind: 'text',
        content: content || '',
      };
    }

    return null;
  };

  return handler;
};
