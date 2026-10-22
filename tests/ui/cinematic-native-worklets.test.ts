import { transformFileSync } from '@babel/core';
import { createContext, runInContext } from 'node:vm';
import { join } from 'node:path';

type Worklet = ((...args: unknown[]) => unknown) & { __closure: Record<string, unknown>; __initData: { code: string } };

// Browser rendering uses ordinary JS closures. Run the native Babel output and
// reconstruct its serialized UI-runtime closures to catch captured undefined
// helpers before an iOS/Android launch (the failure reported in inkRibbon).
test.each(['ios', 'android'].flatMap(platform => [true, false].map(isDev => ({ platform, isDev }))))(
  '$platform native worklet closures initialize and render correctly (dev=$isDev)', ({ platform, isDev }) => {
    const file = join(__dirname, '../../src/ui/cinematic/inkGeometry.ts');
    const caller = { name: 'metro', platform, engine: 'hermes', isDev, supportsStaticESM: false };
    const { code } = transformFileSync(file, { caller })!;
    const module = { exports: {} as Record<string, Worklet> };
    const context = createContext({ module, exports: module.exports, __DEV__: isDev });
    runInContext('globalThis.global = globalThis', context);
    runInContext(code!, context, { filename: file });
    const reconstructed = new Map<Worklet, (...args: unknown[]) => unknown>();
    function onUI(value: unknown): unknown {
      if (typeof value !== 'function') return value;
      const worklet = value as Worklet;
      expect(worklet.__initData?.code).toEqual(expect.any(String));
      if (reconstructed.has(worklet)) return reconstructed.get(worklet);
      const closure = Object.fromEntries(Object.entries(worklet.__closure).map(([key, captured]) => {
        expect({ key, captured }).not.toEqual({ key, captured: undefined });
        return [key, onUI(captured)];
      }));
      const native = runInContext('(' + worklet.__initData.code + ')', context);
      const result = (...args: unknown[]) => native.apply({ __closure: closure }, args);
      reconstructed.set(worklet, result); return result;
    }
    for (const name of ['smooth', 'inkFront', 'inkRibbon', 'coverageAt']) expect(typeof onUI(module.exports[name])).toBe('function');
    const ribbon = onUI(module.exports.inkRibbon) as Worklet;
    for (const time of [0, 0.2, 0.4, 0.7, 1, 1.4, 2.1, 2.6]) for (const strand of [0, 1]) {
      const path = ribbon(time, strand, -0.39, 0.23) as string;
      expect(path).toBe(module.exports.inkRibbon(time, strand, -0.39, 0.23));
      expect(path).toMatch(/^M.*Z$/); expect(path).not.toMatch(/NaN|Infinity/);
    }
    const coverage = onUI(module.exports.coverageAt) as Worklet;
    expect(coverage('welcome', 0)).toBe(1); expect(coverage('welcome', 2600)).toBe(0);
    for (const [kind, cover, end] of [['birth', 620, 1500], ['death', 760, 1800]] as const) {
      expect(coverage(kind, 0)).toBe(0); expect(coverage(kind, cover)).toBe(1); expect(coverage(kind, end)).toBe(0);
    }
  },
);
