import { describe, expect, it } from 'vitest';
import { BLOCK_TAG_MAP } from '../../src/transform/plugins/structure/tag-config';

/**
 * Locks the full default tag mapping table.
 *
 * This expectation is written out verbatim on purpose (never derived from
 * the source constants): any change to a default tag mapping must be made
 * consciously and update this table, so config regressions fail loudly.
 */
const EXPECTED_TAGS: Record<
  string,
  {
    lynxTag: string;
    role: string;
    capabilities: {
      layout: string;
      textContainer?: boolean;
      isVoid: boolean;
    };
    defaultStyle?: Record<string, string>;
  }
> = {
  // block elements
  div: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  section: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  article: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  header: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  footer: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  nav: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  aside: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column' },
  },
  // text elements
  p: {
    lynxTag: 'text',
    role: 'textContainer',
    capabilities: { layout: 'block', textContainer: true, isVoid: false },
    defaultStyle: { color: 'var(--lhr-text-color)', marginBottom: '1em' },
  },
  span: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { color: 'var(--lhr-text-color)' },
  },
  // headings
  h1: {
    lynxTag: 'text',
    role: 'textContainer',
    capabilities: { layout: 'block', textContainer: true, isVoid: false },
    defaultStyle: {
      color: 'var(--lhr-text-color)',
      fontSize: '32px',
      fontWeight: 'bold',
      margin: '24px 0',
    },
  },
  h2: {
    lynxTag: 'text',
    role: 'textContainer',
    capabilities: { layout: 'block', textContainer: true, isVoid: false },
    defaultStyle: {
      color: 'var(--lhr-text-color)',
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '20px 0',
    },
  },
  h3: {
    lynxTag: 'text',
    role: 'textContainer',
    capabilities: { layout: 'block', textContainer: true, isVoid: false },
    defaultStyle: {
      color: 'var(--lhr-text-color)',
      fontSize: '20px',
      fontWeight: 'bold',
      margin: '16px 0',
    },
  },
  h4: {
    lynxTag: 'text',
    role: 'textContainer',
    capabilities: { layout: 'block', textContainer: true, isVoid: false },
    defaultStyle: {
      color: 'var(--lhr-text-color)',
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '14px 0',
    },
  },
  h5: {
    lynxTag: 'text',
    role: 'textContainer',
    capabilities: { layout: 'block', textContainer: true, isVoid: false },
    defaultStyle: {
      color: 'var(--lhr-text-color)',
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '12px 0',
    },
  },
  h6: {
    lynxTag: 'text',
    role: 'textContainer',
    capabilities: { layout: 'block', textContainer: true, isVoid: false },
    defaultStyle: {
      color: 'var(--lhr-text-color)',
      fontSize: '14px',
      fontWeight: 'bold',
      margin: '10px 0',
    },
  },
  // text formatting
  strong: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { color: 'var(--lhr-text-color)', fontWeight: 'bold' },
  },
  b: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { color: 'var(--lhr-text-color)', fontWeight: 'bold' },
  },
  em: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { color: 'var(--lhr-text-color)', fontStyle: 'italic' },
  },
  i: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { color: 'var(--lhr-text-color)', fontStyle: 'italic' },
  },
  u: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: {
      color: 'var(--lhr-text-color)',
      textDecoration: 'underline',
    },
  },
  code: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: {
      color: 'var(--lhr-text-color)',
      fontFamily: 'monospace',
      backgroundColor: '#f0f0f0',
      padding: '2px 4px',
      borderRadius: '3px',
    },
  },
  // link
  a: {
    lynxTag: 'text',
    role: 'inline',
    capabilities: { layout: 'inline', textContainer: true, isVoid: false },
    defaultStyle: { color: 'blue', textDecoration: 'underline' },
  },
  // misc
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
  blockquote: {
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
  },
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
  // image
  img: {
    lynxTag: 'image',
    role: 'image',
    capabilities: { layout: 'flex', isVoid: true },
  },
  // line break
  br: {
    lynxTag: '__BR__',
    role: 'inline',
    capabilities: { layout: 'inline', isVoid: true },
  },
  // lists
  ul: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column', paddingLeft: '5px' },
  },
  ol: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column', paddingLeft: '5px' },
  },
  li: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
    defaultStyle: { flexDirection: 'column', color: 'var(--lhr-text-color)' },
  },
  // tables
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
  thead: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
  },
  tbody: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
  },
  tfoot: {
    lynxTag: 'view',
    role: 'block',
    capabilities: { layout: 'flex', isVoid: false },
  },
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

describe('BLOCK_TAG_MAP defaults (mutation hardening)', () => {
  it('contains exactly the expected set of tags', () => {
    expect(Object.keys(BLOCK_TAG_MAP).sort()).toEqual(
      Object.keys(EXPECTED_TAGS).sort(),
    );
  });

  it('locks every tag mapping in full', () => {
    for (const tag of Object.keys(EXPECTED_TAGS)) {
      expect(BLOCK_TAG_MAP[tag], `mapping for <${tag}>`).toEqual(
        EXPECTED_TAGS[tag],
      );
    }
  });
});
