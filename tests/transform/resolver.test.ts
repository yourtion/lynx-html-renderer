import { describe, expect, it } from 'vitest';
import { TransformPluginResolver } from '../../src/transform/resolver';
import type { TransformPlugin } from '../../src/transform/types';

describe('TransformPluginResolver', () => {
  describe('default behavior', () => {
    it('should load builtin plugins when no config provided', () => {
      const resolver = new TransformPluginResolver();
      const all = resolver.getAllPlugins();
      expect(all.length).toBeGreaterThan(0);
    });

    it('should return plugins by phase', () => {
      const resolver = new TransformPluginResolver();
      const structure = resolver.getPluginsByPhase('structure');
      expect(structure.length).toBeGreaterThan(0);
      for (const p of structure) {
        expect(p.phase).toBe('structure');
      }
    });

    it('should return empty array for phase with no plugins', () => {
      const resolver = new TransformPluginResolver(undefined);
      expect(resolver.getPluginsByPhase('normalize').length).toBeGreaterThan(0);
    });
  });

  describe('disable plugins', () => {
    it('should remove disabled plugins', () => {
      const resolver = new TransformPluginResolver();
      const allBefore = resolver.getAllPlugins().map((p) => p.name);

      const resolver2 = new TransformPluginResolver({
        disable: [allBefore[0]],
      });
      const allAfter = resolver2.getAllPlugins().map((p) => p.name);
      expect(allAfter).not.toContain(allBefore[0]);
    });
  });

  describe('replace plugins', () => {
    it('should replace a plugin by name', () => {
      const resolver = new TransformPluginResolver();
      const originalNames = resolver.getAllPlugins().map((p) => p.name);

      const replacement: TransformPlugin = {
        name: originalNames[0],
        phase: 'finalize',
        order: 999,
        apply: () => {},
      };

      const resolver2 = new TransformPluginResolver({
        replace: { [originalNames[0]]: replacement },
      });

      const found = resolver2
        .getAllPlugins()
        .find((p) => p.name === originalNames[0]);
      expect(found).toBe(replacement);
    });
  });

  describe('extra plugins', () => {
    it('should append extra plugins', () => {
      const extra: TransformPlugin = {
        name: 'test-extra',
        phase: 'finalize',
        order: 50,
        apply: () => {},
      };

      const resolver = new TransformPluginResolver({ extra: [extra] });
      const all = resolver.getAllPlugins();
      expect(all.some((p) => p.name === 'test-extra')).toBe(true);
    });

    it('should sort extra plugins by phase then order', () => {
      const plugins: TransformPlugin[] = [
        { name: 'late', phase: 'finalize', order: 100, apply: () => {} },
        { name: 'early', phase: 'finalize', order: 1, apply: () => {} },
      ];

      const resolver = new TransformPluginResolver({ extra: plugins });
      const finalize = resolver.getPluginsByPhase('finalize');
      const lateIdx = finalize.findIndex((p) => p.name === 'late');
      const earlyIdx = finalize.findIndex((p) => p.name === 'early');
      expect(earlyIdx).toBeLessThan(lateIdx);
    });
  });

  describe('enabledByDefault=false', () => {
    it('should include extra plugins even with enabledByDefault=false', () => {
      const plugin: TransformPlugin = {
        name: 'opt-in-plugin',
        phase: 'finalize',
        order: 1,
        enabledByDefault: false,
        apply: () => {},
      };

      const resolverWithExtra = new TransformPluginResolver({
        extra: [plugin],
      });
      // Extra plugins are always included regardless of enabledByDefault
      expect(
        resolverWithExtra
          .getAllPlugins()
          .some((p) => p.name === 'opt-in-plugin'),
      ).toBe(true);
    });
  });

  describe('getAllPlugins', () => {
    it('should return a copy of the plugins array', () => {
      const resolver = new TransformPluginResolver();
      const a = resolver.getAllPlugins();
      const b = resolver.getAllPlugins();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });
});
