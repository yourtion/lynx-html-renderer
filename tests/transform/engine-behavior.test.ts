import { afterEach, describe, expect, it, vi } from 'vitest';
import { PluginError } from '../../src/errors';
import { transformHTML } from '../../src/html-parser';
import type { TransformPlugin } from '../../src/transform/types';

afterEach(() => {
  vi.restoreAllMocks();
});

function withPlugin(
  plugin: TransformPlugin,
  html = '<div><p>a</p><p>b</p></div>',
) {
  return () => transformHTML(html, { plugins: { extra: [plugin] } });
}

describe('transformHTML metrics (debug mode)', () => {
  it('logs the node count and per-plugin timings in debug mode', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const doc = '<div><p>a</p><p>b</p></div>';

    transformHTML(doc, { debug: true });

    expect(debugSpy).toHaveBeenCalledTimes(1);
    const message = debugSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain(
      '[lynx-html-renderer] transform completed, nodeCount=6, pluginTimings={',
    );
    // timings are sorted descending and rendered with 3 decimal places
    expect(message).toMatch(/block-structure: \d+\.\d{3}ms/);
    expect(message).toMatch(/html-normalize: \d+\.\d{3}ms/);
    expect(message).not.toContain('NaN');
    expect(message).toMatch(/\}$/);
  });

  it('logs timings for successful extra capability plugins', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const okApply: TransformPlugin = {
      name: 'cap-ok-apply',
      phase: 'capability',
      order: 900,
      apply: () => {},
    };
    const okRegister: TransformPlugin = {
      name: 'cap-ok-register',
      phase: 'capability',
      order: 910,
      registerCapabilityHandlers: () =>
        new Map([
          [
            'view',
            (node) => {
              if (node.kind === 'element') node.props.touched = true;
            },
          ],
        ]),
    };

    transformHTML('<div><p>a</p></div>', {
      debug: true,
      plugins: { extra: [okApply, okRegister] },
    });

    const message = debugSpy.mock.calls[0]?.[0] as string;
    expect(message).toMatch(/cap-ok-apply: \d+\.\d{3}ms/);
    expect(message).toMatch(/cap-ok-register: \d+\.\d{3}ms/);
    // timings are comma-separated and sorted descending
    expect(message).toMatch(/ms, /);
    const durations = [...message.matchAll(/: (\d+\.\d{3})ms/g)].map((m) =>
      Number(m[1]),
    );
    for (let i = 1; i < durations.length; i++) {
      expect(durations[i]).toBeLessThanOrEqual(durations[i - 1] as number);
    }
  });

  it('does not log or collect metrics outside debug mode', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    transformHTML('<div><p>a</p><p>b</p></div>');
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('validates the result tree in debug mode', () => {
    const invalidNode = {
      kind: 'element',
      tag: 'view',
      children: [],
    } as never;
    const brokenFinalize: TransformPlugin = {
      name: 'broken-finalize',
      phase: 'finalize',
      order: 900,
      apply: (ctx) => {
        ctx.root.children.push(invalidNode);
      },
    };

    expect(() =>
      transformHTML('<div><p>a</p></div>', {
        debug: true,
        plugins: { extra: [brokenFinalize] },
      }),
    ).toThrow(/props object/);
  });
});

describe('transformHTML capability phase error wrapping', () => {
  it('rejects capability plugins implementing neither entry point', () => {
    const noEntry: TransformPlugin = {
      name: 'no-entry',
      phase: 'capability',
      order: 900,
    };
    expect(withPlugin(noEntry)).toThrow(PluginError);
    expect(withPlugin(noEntry)).toThrow(
      /no-entry failed in phase capability: Capability plugins must implement registerCapabilityHandlers\(\) or apply\(\)/,
    );
  });

  it('wraps apply() failures with the plugin name', () => {
    const failing: TransformPlugin = {
      name: 'cap-apply-boom',
      phase: 'capability',
      order: 900,
      apply: () => {
        throw new Error('boom-cap-apply');
      },
    };
    expect(withPlugin(failing)).toThrow(
      /cap-apply-boom failed in phase capability: boom-cap-apply/,
    );
  });

  it('rethrows PluginError from apply() untouched', () => {
    const rethrown: TransformPlugin = {
      name: 'cap-apply-plugin-error',
      phase: 'capability',
      order: 900,
      apply: () => {
        throw new PluginError('boom', 'inner-plugin', 'custom-phase');
      },
    };
    try {
      withPlugin(rethrown)();
      expect.unreachable('should have thrown');
    } catch (error) {
      // the message must not be wrapped a second time
      expect((error as Error).message).toBe(
        '[Plugin Error] inner-plugin failed in phase custom-phase: boom',
      );
    }
  });

  it('falls back to a generic message for non-error apply throws', () => {
    const throwingString: TransformPlugin = {
      name: 'cap-apply-string',
      phase: 'capability',
      order: 900,
      apply: () => {
        throw 'just a string';
      },
    };
    expect(withPlugin(throwingString)).toThrow(
      /cap-apply-string failed in phase capability: Plugin apply\(\) failed/,
    );
  });

  it('wraps registerCapabilityHandlers() failures', () => {
    const failing: TransformPlugin = {
      name: 'cap-register-boom',
      phase: 'capability',
      order: 900,
      registerCapabilityHandlers: () => {
        throw new Error('boom-register');
      },
    };
    expect(withPlugin(failing)).toThrow(
      /cap-register-boom failed in phase capability: boom-register/,
    );
  });

  it('rethrows PluginError from registerCapabilityHandlers() untouched', () => {
    const rethrown: TransformPlugin = {
      name: 'cap-register-plugin-error',
      phase: 'capability',
      order: 900,
      registerCapabilityHandlers: () => {
        throw new PluginError('boom2', 'inner-plugin', 'custom-phase');
      },
    };
    try {
      withPlugin(rethrown)();
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as Error).message).toBe(
        '[Plugin Error] inner-plugin failed in phase custom-phase: boom2',
      );
    }
  });

  it('falls back to a generic message for non-error register throws', () => {
    const throwingString: TransformPlugin = {
      name: 'cap-register-string',
      phase: 'capability',
      order: 900,
      registerCapabilityHandlers: () => {
        throw 'just a string';
      },
    };
    expect(withPlugin(throwingString)).toThrow(
      /cap-register-string failed in phase capability: registerCapabilityHandlers\(\) failed/,
    );
  });

  it('wraps node handler failures with the plugin name', () => {
    const failing: TransformPlugin = {
      name: 'cap-handler-boom',
      phase: 'capability',
      order: 900,
      registerCapabilityHandlers: () =>
        new Map([
          [
            'view',
            () => {
              throw new Error('boom-handler');
            },
          ],
        ]),
    };
    expect(withPlugin(failing)).toThrow(
      /cap-handler-boom failed in phase capability: boom-handler/,
    );
  });

  it('falls back to a generic message for non-error handler throws', () => {
    const throwingString: TransformPlugin = {
      name: 'cap-handler-string',
      phase: 'capability',
      order: 900,
      registerCapabilityHandlers: () =>
        new Map([
          [
            'view',
            () => {
              throw 'just a string';
            },
          ],
        ]),
    };
    expect(withPlugin(throwingString)).toThrow(
      /cap-handler-string failed in phase capability: capability handler failed/,
    );
  });
});

describe('transformHTML apply-phase error wrapping', () => {
  it('rejects structure plugins without apply()', () => {
    const noApply: TransformPlugin = {
      name: 'no-apply',
      phase: 'structure',
      order: 900,
    };
    expect(withPlugin(noApply)).toThrow(
      /no-apply failed in phase structure: Plugins in phase "structure" must implement apply\(\)/,
    );
  });

  it('wraps apply() failures and keeps the phase', () => {
    const failing: TransformPlugin = {
      name: 'struct-boom',
      phase: 'structure',
      order: 900,
      apply: () => {
        throw new Error('boom-struct');
      },
    };
    expect(withPlugin(failing)).toThrow(
      /struct-boom failed in phase structure: boom-struct/,
    );
  });

  it('falls back to a generic message for non-error apply throws', () => {
    const throwing: TransformPlugin = {
      name: 'struct-throw-42',
      phase: 'structure',
      order: 900,
      apply: () => {
        throw 42;
      },
    };
    expect(withPlugin(throwing)).toThrow(
      /struct-throw-42 failed in phase structure: Plugin apply\(\) failed/,
    );
  });

  it('rethrows PluginError from apply() untouched', () => {
    const rethrown: TransformPlugin = {
      name: 'struct-plugin-error',
      phase: 'structure',
      order: 900,
      apply: () => {
        throw new PluginError('boom3', 'inner-plugin', 'custom-phase');
      },
    };
    expect(withPlugin(rethrown)).toThrow(
      '[Plugin Error] inner-plugin failed in phase custom-phase: boom3',
    );
  });
});
