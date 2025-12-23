import { pluginManager } from '../plugin-system';
import type { HtmlParserNode, TagHandler } from '../typings';

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
  defaultStyle: { flexDirection: 'column', paddingLeft: '40px' },
};

const TABLE_ELEMENT_CONFIG = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
};

const TABLE_CELL_CONFIG = {
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

// Structure role type
export type ElementRole =
  | 'block'
  | 'inline'
  | 'textContainer'
  | 'image'
  | 'table'
  | 'row'
  | 'cell';

// Capabilities description interface
export interface Capabilities {
  layout?: 'block' | 'inline' | 'flex' | 'table';
  isVoid?: boolean; // Like img / br
  textContainer?: boolean; // Whether can only contain text
}

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
    defaultStyle: { fontSize: '2em', fontWeight: 'bold', margin: '0.67em 0' },
  },
  h2: {
    ...HEADING_CONFIG,
    defaultStyle: { fontSize: '1.5em', fontWeight: 'bold', margin: '0.83em 0' },
  },
  h3: {
    ...HEADING_CONFIG,
    defaultStyle: { fontSize: '1.17em', fontWeight: 'bold', margin: '1em 0' },
  },
  h4: {
    ...HEADING_CONFIG,
    defaultStyle: { fontSize: '1em', fontWeight: 'bold', margin: '1.33em 0' },
  },
  h5: {
    ...HEADING_CONFIG,
    defaultStyle: {
      fontSize: '0.83em',
      fontWeight: 'bold',
      margin: '1.67em 0',
    },
  },
  h6: {
    ...HEADING_CONFIG,
    defaultStyle: {
      fontSize: '0.67em',
      fontWeight: 'bold',
      margin: '2.33em 0',
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
    defaultStyle: { display: 'list-item' },
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
  },
  thead: TABLE_ELEMENT_CONFIG,
  tbody: TABLE_ELEMENT_CONFIG,
  tfoot: TABLE_ELEMENT_CONFIG,
  tr: {
    lynxTag: 'view',
    role: 'row',
    capabilities: { layout: 'flex', isVoid: false },
  },
  th: TABLE_CELL_CONFIG,
  td: TABLE_CELL_CONFIG,
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

    // Parse inline style string to object
    let styleFromAttr = parseStyleString(node.attribs?.style);

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

    // Basic element node structure
    const baseNode = {
      kind: 'element',
      tag: mapping.lynxTag,
      props: {},
      children: mapping.capabilities.isVoid
        ? []
        : context.transformChildren(node.children ?? []),
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
