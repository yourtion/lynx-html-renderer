import type { Capabilities, ElementRole } from '../../../lynx/types';

/**
 * 标签映射配置
 * 从现有 src/plugins/tag-handlers.ts 提取
 */

export interface TagMapping {
  lynxTag: string;
  role: ElementRole;
  capabilities: Capabilities;
  defaultStyle?: Record<string, string | number>;
}

const BLOCK_ELEMENT_CONFIG: TagMapping = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
  defaultStyle: { flexDirection: 'column' },
};

const INLINE_TEXT_CONFIG: TagMapping = {
  lynxTag: 'text',
  role: 'inline',
  capabilities: { layout: 'inline', textContainer: true, isVoid: false },
  defaultStyle: { color: 'var(--lhr-text-color)' },
};

const TEXT_CONTAINER_CONFIG: TagMapping = {
  lynxTag: 'text',
  role: 'textContainer',
  capabilities: { layout: 'block', textContainer: true, isVoid: false },
  defaultStyle: { color: 'var(--lhr-text-color)' },
};

const HEADING_CONFIG: TagMapping = {
  lynxTag: 'text',
  role: 'textContainer',
  capabilities: { layout: 'block', textContainer: true, isVoid: false },
  defaultStyle: { color: 'var(--lhr-text-color)' },
};

const BLOCK_QUOTE_CONFIG: TagMapping = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
  defaultStyle: {
    flexDirection: 'column',
    marginLeft: '40px',
    marginRight: '40px',
    paddingLeft: '16px',
    borderLeft: '4px solid var(--lhr-blockquote-border)',
  },
};

const TABLE_ELEMENT_CONFIG: TagMapping = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
};

const _TABLE_CELL_CONFIG: TagMapping = {
  lynxTag: 'view',
  role: 'cell',
  capabilities: { layout: 'flex', isVoid: false },
};

const LIST_ELEMENT_CONFIG: TagMapping = {
  lynxTag: 'view',
  role: 'block',
  capabilities: { layout: 'flex', isVoid: false },
  defaultStyle: { flexDirection: 'column', paddingLeft: '5px' },
};

/**
 * 块级元素 TAG_MAP
 * 只包含 div/p/span/h1-h6/blockquote/pre 等基础块级元素
 */
export const BLOCK_TAG_MAP: Record<string, TagMapping> = {
  // Block elements
  div: BLOCK_ELEMENT_CONFIG,
  section: BLOCK_ELEMENT_CONFIG,
  article: BLOCK_ELEMENT_CONFIG,
  header: BLOCK_ELEMENT_CONFIG,
  footer: BLOCK_ELEMENT_CONFIG,
  nav: BLOCK_ELEMENT_CONFIG,
  aside: BLOCK_ELEMENT_CONFIG,

  // Text elements
  p: {
    ...TEXT_CONTAINER_CONFIG,
    defaultStyle: {
      ...TEXT_CONTAINER_CONFIG.defaultStyle,
      marginBottom: '1em',
    },
  },
  span: INLINE_TEXT_CONFIG,

  // Heading elements (h1-h6)
  h1: {
    ...HEADING_CONFIG,
    defaultStyle: {
      ...HEADING_CONFIG.defaultStyle,
      fontSize: '32px',
      fontWeight: 'bold',
      margin: '10px 0',
    },
  },
  h2: {
    ...HEADING_CONFIG,
    defaultStyle: {
      ...HEADING_CONFIG.defaultStyle,
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '12px 0',
    },
  },
  h3: {
    ...HEADING_CONFIG,
    defaultStyle: {
      ...HEADING_CONFIG.defaultStyle,
      fontSize: '20px',
      fontWeight: 'bold',
      margin: '14px 0',
    },
  },
  h4: {
    ...HEADING_CONFIG,
    defaultStyle: {
      ...HEADING_CONFIG.defaultStyle,
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '16px 0',
    },
  },
  h5: {
    ...HEADING_CONFIG,
    defaultStyle: {
      ...HEADING_CONFIG.defaultStyle,
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '18px 0',
    },
  },
  h6: {
    ...HEADING_CONFIG,
    defaultStyle: {
      ...HEADING_CONFIG.defaultStyle,
      fontSize: '14px',
      fontWeight: 'bold',
      margin: '20px 0',
    },
  },

  // Text formatting
  strong: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: {
      ...INLINE_TEXT_CONFIG.defaultStyle,
      fontWeight: 'bold',
    },
  },
  b: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: {
      ...INLINE_TEXT_CONFIG.defaultStyle,
      fontWeight: 'bold',
    },
  },
  em: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: {
      ...INLINE_TEXT_CONFIG.defaultStyle,
      fontStyle: 'italic',
    },
  },
  i: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: {
      ...INLINE_TEXT_CONFIG.defaultStyle,
      fontStyle: 'italic',
    },
  },
  u: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: {
      ...INLINE_TEXT_CONFIG.defaultStyle,
      textDecoration: 'underline',
    },
  },
  code: {
    ...INLINE_TEXT_CONFIG,
    defaultStyle: {
      ...INLINE_TEXT_CONFIG.defaultStyle,
      fontFamily: 'monospace',
    },
  },

  // Link
  a: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { color: 'blue', textDecoration: 'underline' },
  },

  // Other elements
  hr: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'block', isVoid: true },
    defaultStyle: {
      height: '1px',
      backgroundColor: 'var(--lhr-divider-color)',
      margin: '1em 0',
    },
  },
  blockquote: BLOCK_QUOTE_CONFIG,
  pre: {
    lynxTag: 'text',
    role: 'block',
    capabilities: { layout: 'block', textContainer: true, isVoid: false },
    defaultStyle: {
      color: 'var(--lhr-text-color)',
      fontFamily: 'monospace',
      backgroundColor: 'var(--lhr-bg-color-tertiary)',
      padding: '16px',
      overflow: 'auto',
    },
  },

  // Image
  img: {
    lynxTag: 'image',
    role: 'image',
    capabilities: { layout: 'flex', isVoid: true },
  },

  // Line break
  br: {
    lynxTag: '__BR__',
    role: 'inline',
    capabilities: { layout: 'inline', isVoid: true },
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
      color: 'var(--lhr-text-color)',
    },
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
      borderColor: 'var(--lhr-border-color)',
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
      borderColor: 'var(--lhr-border-color)',
      backgroundColor: 'var(--lhr-bg-color-secondary)',
      fontWeight: 'bold',
      color: 'var(--lhr-text-color)',
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
      borderColor: 'var(--lhr-border-color)',
      color: 'var(--lhr-text-color-secondary)',
    },
  },
};
