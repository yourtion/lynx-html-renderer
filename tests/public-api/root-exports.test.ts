import { describe, expect, it } from 'vitest';
import {
  generateCSS,
  getClassNameForTag,
  HTMLRenderer,
  renderHTMLDirect,
} from '../../src/index';
import {
  generateCSS as generateCSSFromStyles,
  getClassNameForTag as getClassNameForTagFromStyles,
} from '../../src/styles';

describe('root public exports', () => {
  it('should export style helpers from the package root', () => {
    expect(generateCSS).toBeTypeOf('function');
    expect(getClassNameForTag('p')).toBe('lhr-p');
  });

  it('should expose style helpers from the dedicated styles entry', () => {
    expect(generateCSSFromStyles).toBeTypeOf('function');
    expect(getClassNameForTagFromStyles('table')).toBe('lhr-table');
  });

  it('should keep renderer exports available from the package root', () => {
    expect(HTMLRenderer).toBeDefined();
    expect(renderHTMLDirect).toBeTypeOf('function');
  });
});
