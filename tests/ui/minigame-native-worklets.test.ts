import { transformFileSync } from '@babel/core';
import { createContext, runInContext } from 'node:vm';
import { join } from 'node:path';

type Worklet = ((...args: any[]) => any) & {
  __closure: Record<string, unknown>;
  __initData: { code: string };
};
test.each(
  ['ios', 'android'].flatMap((platform) =>
    [true, false].map((isDev) => ({ platform, isDev })),
  ),
)(
  '$platform native gameplay worklets initialize and replay deterministic physics (dev=$isDev)',
  ({ platform, isDev }) => {
    for (const [file, names] of Object.entries({
      'core/svgMotion.ts': ['svgMotion', 'nativeSvgProps'],
      'astronaut/dockingPhysics.ts': [
        'initialDocking',
        'advanceDocking',
        'thrustDocking',
      ],
      'sports/sportsLogic.ts': ['shotPower', 'keeperPosition'],
      'crime/crimeLogic.ts': ['dialAngle', 'targetAngle', 'angleDistance'],
    })) {
      const source = join(__dirname, '../../src/minigames', file),
        caller = {
          name: 'metro',
          platform,
          engine: 'hermes',
          isDev,
          supportsStaticESM: false,
        },
        { code } = transformFileSync(source, { caller })!;
      const module = { exports: {} as Record<string, Worklet> },
        context = createContext({
          module,
          exports: module.exports,
          __DEV__: isDev,
        });
      runInContext('globalThis.global=globalThis', context);
      runInContext(code!, context);
      const reconstructed = new Map();
      function onUI(value: unknown): any {
        if (typeof value !== 'function') return value;
        const fn = value as Worklet;
        if (reconstructed.has(fn)) return reconstructed.get(fn);
        expect(fn.__initData?.code).toEqual(expect.any(String));
        const closure = Object.fromEntries(
          Object.entries(fn.__closure).map(([key, v]) => {
            expect(v).not.toBeUndefined();
            return [key, onUI(v)];
          }),
        );
        const native = runInContext('(' + fn.__initData.code + ')', context),
          call = (...args: any[]) => native.apply({ __closure: closure }, args);
        reconstructed.set(fn, call);
        return call;
      }
      for (const name of names)
        expect(typeof onUI(module.exports[name])).toBe('function');
      if (file.startsWith('core')) {
        const matrix = onUI(module.exports.svgMotion)(
            200,
            262,
            90,
            1,
            1,
            200,
            262,
          ),
          props = { transform: matrix, opacity: 0.5 };
        onUI(module.exports.nativeSvgProps)(props);
        expect(props).toEqual({ matrix, opacity: 0.5 });
        expect(matrix).toHaveLength(6);
        expect(matrix.every(Number.isFinite)).toBe(true);
      }
      if (file.startsWith('astronaut'))
        for (let seed = 1; seed < 12; seed++) {
          const start = onUI(module.exports.initialDocking)(seed, 3),
            pulse = onUI(module.exports.thrustDocking)(start, 'left'),
            advanced = onUI(module.exports.advanceDocking)(pulse, 1250, 3);
          expect(advanced).toEqual(
            module.exports.advanceDocking(
              module.exports.thrustDocking(
                module.exports.initialDocking(seed, 3),
                'left',
              ),
              1250,
              3,
            ),
          );
        }
    }
  },
);

test.each(
  ['ios', 'android'].flatMap((platform) =>
    [true, false].map((isDev) => ({ platform, isDev })),
  ),
)(
  '$platform actual scene updaters send numeric SVG matrices on the UI runtime (dev=$isDev)',
  ({ platform, isDev }) => {
    const context = createContext({ __DEV__: isDev }),
      cache = new Map<string, any>(),
      captured: Record<string, any>[] = [],
      reconstructed = new Map<Function, Function>();
    runInContext('globalThis.global=globalThis', context);
    function onUI(value: any): any {
      if (typeof value === 'function') {
        if (reconstructed.has(value)) return reconstructed.get(value);
        expect(value.__initData?.code).toEqual(expect.any(String));
        const closure = onUI(value.__closure),
          native = runInContext('(' + value.__initData.code + ')', context),
          call = (...args: any[]) => native.apply({ __closure: closure }, args);
        reconstructed.set(value, call);
        return call;
      }
      if (Array.isArray(value)) return value.map(onUI);
      if (value && typeof value === 'object')
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, onUI(item)]),
        );
      return value;
    }
    const React = require('react'),
      mocks: Record<string, any> = {
        react: {
          ...React,
          useEffect: () => {},
          useId: () => 'native_scene',
          useRef: (value: any) => ({ current: value }),
          useState: (value: any) => [value, () => {}],
          useMemo: (fn: Function) => fn(),
        },
        'react/jsx-runtime': require('react/jsx-runtime'),
        'react-native': {
          Platform: { OS: platform },
          Text: 'Text',
          View: 'View',
          StyleSheet: { create: (styles: any) => styles },
          useWindowDimensions: () => ({
            width: 400,
            height: 900,
            fontScale: 1,
          }),
          PanResponder: { create: () => ({ panHandlers: {} }) },
        },
        'react-native-svg': new Proxy(
          { __esModule: true, default: 'Svg' },
          {
            get: (obj, key) =>
              key in obj ? obj[key as keyof typeof obj] : String(key),
          },
        ),
        'react-native-reanimated': {
          __esModule: true,
          default: { createAnimatedComponent: (component: any) => component },
          Easing: {
            linear: (v: number) => v,
            cubic: (v: number) => v ** 3,
            out: (fn: Function) => fn,
          },
          useSharedValue: (value: any) => ({ value }),
          useAnimatedReaction: () => {},
          useDerivedValue: (calculate: Worklet) => ({
            value: onUI(calculate)(),
          }),
          useAnimatedProps: (
            calculate: Worklet,
            _deps: any,
            adapter?: Worklet,
          ) => {
            const props = onUI(calculate)();
            if (adapter) onUI(adapter)(props);
            captured.push(props);
            return props;
          },
          withTiming: (value: any) => value,
        },
        'react-native-worklets': { scheduleOnRN: () => {} },
      };
    function load(file: string): any {
      if (cache.has(file)) return cache.get(file);
      const module = { exports: {} },
        caller = {
          name: 'metro',
          platform,
          engine: 'hermes',
          isDev,
          supportsStaticESM: false,
        },
        code = transformFileSync(file, { caller })!.code!;
      cache.set(file, module.exports);
      runInContext(
        '(function(require,module,exports){' + code + '\n})',
        context,
      )(
        (name: string) => {
          if (mocks[name]) return mocks[name];
          if (
            name.startsWith('@babel/runtime/') ||
            name.startsWith('react/jsx-')
          )
            return require(name);
          if (name.endsWith('/sceneArtwork')) return { sceneArt: new Proxy({}, { get: () => 1 }) };
          if (name.endsWith('/SceneCanvas')) return { SceneCanvas: 'SceneCanvas' };
          if (name.endsWith('/GameButton')) return { GameButton: 'GameButton' };
          if (name.endsWith('/gameStyles'))
            return {
              gameStyles: {},
              palette: { gold: '#E5BD77', white: '#FFF', blue: '#83CDEB' },
            };
          return load(join(file, '..', name) + '.ts');
        },
        module,
        module.exports,
      );
      return module.exports;
    }
    const session = {
      id: 'mini_native',
      kind: 'sports',
      seed: 42,
      difficulty: 3,
      assisted: false,
      elapsedMs: 0,
      inputs: [],
    };
    for (const [file, name] of [
      ['sports/SportsGame.tsx', 'SportsGame'],
      ['crime/CrimeGame.tsx', 'CrimeGame'],
      ['astronaut/DockingGame.tsx', 'DockingGame'],
    ]) {
      captured.length = 0;
      load(join(__dirname, '../../src/minigames', file))[name]({
        session,
        clock: { value: 1200 },
        enabled: true,
        reducedMotion: false,
        onInput: () => {},
        onFinished: () => {},
      });
      const moving = captured.filter((props) => props.matrix);
      expect(moving.length).toBeGreaterThan(0);
      for (const props of moving) {
        expect(props).not.toHaveProperty('transform');
        expect(props.matrix).toHaveLength(6);
        expect(props.matrix.every(Number.isFinite)).toBe(true);
      }
      if (name === 'SportsGame') {
        captured.length = 0;
        load(join(__dirname, '../../src/minigames', file))[name]({
          session: { ...session, inputs: [{ at: 1200, action: { type: 'shot', x: 0.1, y: 0.6 } }] },
          clock: { value: 1200 }, enabled: true, reducedMotion: false, onInput: () => {},
        });
        const keeper = captured.find(props => props.matrix)!.matrix;
        // Leftward dives mirror only horizontally; the keeper stays upright.
        expect(keeper[0]).toBe(-1);
        expect(keeper[3]).toBe(1);
      }
    }
  },
);
