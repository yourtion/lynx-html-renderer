import { transformHTML } from '@lynx-html-renderer/html-parser';
import { describe, expect, it } from 'vitest';
import {
  getPluginInfo,
  getPluginInfoByName,
  getPluginsByPhase,
} from '../../src/transform/plugin-info';

describe('Transform Options', () => {
  describe('removeAllClass', () => {
    it('should remove all class attributes by default (removeAllClass=true)', () => {
      const html = '<div class="container">Content</div>';
      const result = transformHTML(html);

      expect(result[0].props?.className).toBeUndefined();
    });

    it('should preserve class attributes when removeAllClass=false', () => {
      const html = '<div class="container">Content</div>';
      const result = transformHTML(html, { removeAllClass: false });

      expect(result[0].props?.className).toBe('container');
    });

    it('should remove class from multiple elements when removeAllClass=true', () => {
      const html = '<div class="outer"><p class="inner">Text</p></div>';
      const result = transformHTML(html, { removeAllClass: true });

      expect(result[0].props?.className).toBeUndefined();
      expect(result[0].children[0].props?.className).toBeUndefined();
    });

    it('should preserve class from multiple elements when removeAllClass=false', () => {
      const html = '<div class="outer"><p class="inner">Text</p></div>';
      const result = transformHTML(html, { removeAllClass: false });

      expect(result[0].props?.className).toBe('outer');
      expect(result[0].children[0].props?.className).toBe('inner');
    });
  });

  describe('removeAllStyle', () => {
    it('should preserve inline styles by default (removeAllStyle=false)', () => {
      const html = '<div style="color: red">Content</div>';
      const result = transformHTML(html);

      expect(result[0].props?.style).toBeDefined();
      expect(result[0].props?.style?.color).toBe('red');
    });

    it('should remove all inline styles when removeAllStyle=true', () => {
      const html = '<div style="color: red; font-size: 16px">Content</div>';
      const result = transformHTML(html, { removeAllStyle: true });

      // Should only have default style (flexDirection for div)
      expect(result[0].props?.style).toEqual({ flexDirection: 'column' });
    });

    it('should preserve style when removeAllStyle is not set', () => {
      const html = '<div style="background-color: blue">Content</div>';
      const result = transformHTML(html, {});

      expect(result[0].props?.style?.backgroundColor).toBe('blue');
    });
  });

  describe('combined options', () => {
    it('should handle both removeAllClass and removeAllStyle together', () => {
      const html = '<div class="wrapper" style="color: green">Text</div>';
      const result = transformHTML(html, {
        removeAllClass: true,
        removeAllStyle: true,
      });

      expect(result[0].props?.className).toBeUndefined();
      // Should only have default style
      expect(result[0].props?.style).toEqual({ flexDirection: 'column' });
    });

    it('should preserve both when options are false', () => {
      const html = '<div class="wrapper" style="color: blue">Text</div>';
      const result = transformHTML(html, {
        removeAllClass: false,
        removeAllStyle: false,
      });

      expect(result[0].props?.className).toBe('wrapper');
      expect(result[0].props?.style?.color).toBe('blue');
    });
  });

  describe('edge cases', () => {
    it('should handle elements with no class or style', () => {
      const html = '<div>Plain content</div>';
      const result = transformHTML(html, {
        removeAllClass: true,
        removeAllStyle: true,
      });

      // div has default flexDirection style
      expect(result[0].props).toEqual({ style: { flexDirection: 'column' } });
    });

    it('should handle empty class attribute', () => {
      const html = '<div class="">Content</div>';
      const result = transformHTML(html, { removeAllClass: false });

      // Empty class attribute should not add className prop (empty string is falsy)
      expect(result[0].props?.className).toBeUndefined();
    });

    it('should handle empty style attribute', () => {
      const html = '<div style="">Content</div>';
      const result = transformHTML(html, { removeAllStyle: false });

      // Empty style should not add style prop
      expect(result[0].props?.style).toEqual({ flexDirection: 'column' });
    });
  });
});

describe('Plugin Info API', () => {
  describe('getPluginInfo', () => {
    it('should return all builtin plugins', () => {
      const plugins = getPluginInfo();

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
    });

    it('should return plugins with required fields', () => {
      const plugins = getPluginInfo();

      for (const plugin of plugins) {
        expect(plugin).toHaveProperty('name');
        expect(plugin).toHaveProperty('phase');
        expect(plugin).toHaveProperty('order');
        expect(plugin).toHaveProperty('enabledByDefault');
        expect(typeof plugin.name).toBe('string');
        expect(typeof plugin.order).toBe('number');
        expect(typeof plugin.enabledByDefault).toBe('boolean');
      }
    });
  });

  describe('getPluginInfoByName', () => {
    it('should return plugin info for existing plugin', () => {
      const plugins = getPluginInfo();
      const firstName = plugins[0].name;

      const plugin = getPluginInfoByName(firstName);

      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe(firstName);
    });

    it('should return undefined for non-existent plugin', () => {
      const plugin = getPluginInfoByName('non-existent-plugin');

      expect(plugin).toBeUndefined();
    });
  });

  describe('getPluginsByPhase', () => {
    it('should filter plugins by phase', () => {
      const structurePlugins = getPluginsByPhase('structure');

      expect(Array.isArray(structurePlugins)).toBe(true);
      for (const plugin of structurePlugins) {
        expect(plugin.phase).toBe('structure');
      }
    });

    it('should sort plugins by order', () => {
      const plugins = getPluginsByPhase('structure');

      for (let i = 1; i < plugins.length; i++) {
        expect(plugins[i].order).toBeGreaterThanOrEqual(plugins[i - 1].order);
      }
    });

    it('should return empty array for phase with no plugins', () => {
      const plugins = getPluginsByPhase('finalize');

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBe(0);
    });
  });
});
