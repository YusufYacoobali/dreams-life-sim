// Render the actual V3 screen in Chromium, with explicit modeled safe areas and
// text scaling. This is not iOS/Android, native font layout, or spoken AT proof.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { createRequire } = require('node:module'), { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), toolRoot = process.env.DREAMS_REVIEW_TOOLS || '/tmp/dreams-cell-review';
const tool = createRequire(path.join(toolRoot, 'package.json')), { chromium } = tool('playwright');
const output = path.resolve(process.argv[2] || '/tmp/dreams-cell-layout'), baseline = process.argv[3];
const changed = ['src/minigames/components/MiniGameScreen.tsx', 'src/minigames/components/SceneBackdrop.tsx', 'src/minigames/escape/CellEscapeGame.tsx', 'src/minigames/escape/EscapeGame.tsx', 'src/assets/CellEscapeArt.tsx'];
fs.mkdirSync(output, { recursive: true });
(async () => {
  await tool('esbuild').build({
    entryPoints: [path.join(root, 'tools/cell-escape-review.tsx')], bundle: true, outfile: path.join(output, 'scene.js'),
    platform: 'browser', format: 'iife', banner: { js: 'var process={env:{NODE_ENV:"development"}};var global=globalThis;' },
    define: { 'process.env.NODE_ENV': '"development"', 'process.env.EXPO_OS': '"web"', __DEV__: 'true' },
    resolveExtensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: { react: path.join(root, 'node_modules/react'), 'react-dom': path.join(root, 'node_modules/react-dom'), '@react-native/assets-registry/registry': tool.resolve('react-native-web/dist/modules/AssetRegistry'), 'lottie-web': tool.resolve('lottie-web'), 'lottie-react-native': path.join(root, 'tools/minigame-review/lottie.tsx') },
    loader: { '.js': 'jsx', '.ttf': 'file', '.png': 'file', '.webp': 'file', '.wav': 'file' },
    plugins: [{ name: 'cell-review-boundaries', setup(build) {
      if (baseline) build.onLoad({ filter: /\.[jt]sx?$/ }, args => {
        const relative = path.relative(root, args.path).split(path.sep).join('/');
        if (changed.includes(relative)) return { contents: execFileSync('git', ['show', baseline + ':' + relative], { cwd: root, encoding: 'utf8' }), loader: 'tsx', resolveDir: path.dirname(args.path) };
      });
      build.onResolve({ filter: /^(react-native|expo-router|expo-asset|expo-status-bar|react-native-reanimated|react-native-worklets|node:async_hooks)$/ }, args => ({ path: args.path, namespace: 'review' }));
      build.onResolve({ filter: /core\/useMiniGameAudio$/ }, () => ({ path: 'audio', namespace: 'review' }));
      build.onLoad({ filter: /.*/, namespace: 'review' }, args => ({ resolveDir: root, contents: args.path === 'react-native' ? `
        import React from ${JSON.stringify(path.join(root, 'node_modules/react'))};
        import * as Native from ${JSON.stringify(tool.resolve('react-native-web'))};
        export * from ${JSON.stringify(tool.resolve('react-native-web'))};
        export const useWindowDimensions=()=>({...Native.useWindowDimensions(),fontScale:Number(new URLSearchParams(location.search).get('scale')||1)});
        export const Pressable=React.forwardRef((props,ref)=>React.createElement(Native.Pressable,{...props,ref,'aria-checked':props.accessibilityState?.checked,'aria-disabled':props.disabled??props.accessibilityState?.disabled}));
        export const Text=React.forwardRef((props,ref)=>{const s=Native.StyleSheet.flatten(props.style)||{},k=props.allowFontScaling===false?1:Number(new URLSearchParams(location.search).get('scale')||1);return React.createElement(Native.Text,{...props,ref,style:[props.style,{...(typeof s.fontSize==='number'?{fontSize:s.fontSize*k}:{}),...(typeof s.lineHeight==='number'?{lineHeight:s.lineHeight*k}:{})}]});});`
        : args.path === 'expo-router' ? 'import {useEffect} from "react";export const useFocusEffect=fn=>useEffect(fn,[fn]);'
        : args.path === 'expo-asset' ? 'export const Asset={loadAsync:async()=>[]};'
        : args.path === 'expo-status-bar' ? 'export const StatusBar=()=>null;'
        : args.path === 'audio' ? 'export const useMiniGameAudio=()=>async()=>{};'
        : args.path === 'react-native-worklets' ? 'export const scheduleOnRN=(fn,...args)=>fn(...args);'
        : args.path === 'react-native-reanimated' ? `import React,{useRef} from "react";export const useSharedValue=value=>useRef({value}).current;export const useAnimatedProps=fn=>fn();export const useAnimatedReaction=()=>{};export const useDerivedValue=fn=>({value:fn()});export const withTiming=x=>x;export const withSequence=(...x)=>x.at(-1);export const cancelAnimation=()=>{};export const Easing={linear:x=>x,cubic:x=>x*x*x,out:fn=>fn};export const createAnimatedComponent=C=>React.forwardRef(({animatedProps,...props},ref)=>React.createElement(C,{...props,...animatedProps,ref}));export default {createAnimatedComponent};`
        : 'export class AsyncLocalStorage{}' }));
    } }],
  });
  fs.writeFileSync(path.join(output, 'index.html'), '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}#root{display:flex}#root>div{flex:1}</style><div id="root"></div><script src="/scene.js"></script>');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname, file = path.join(output, pathname === '/' ? 'index.html' : pathname);
    if (!file.startsWith(output + path.sep)) return res.writeHead(403).end();
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.png') ? 'image/png' : file.endsWith('.webp') ? 'image/webp' : file.endsWith('.ttf') ? 'font/ttf' : 'text/html');
    fs.createReadStream(file).on('error', () => res.writeHead(404).end()).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.DREAMS_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const errors = [], cases = [], url = 'http://127.0.0.1:' + server.address().port;
  try {
    const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
    page.on('pageerror', error => errors.push(String(error)));
    const open = async (size, difficulty, scale, appearance, motion = 'reduce') => {
      await page.setViewportSize({ width: size[0], height: size[1] });
      await page.goto(url + '/?' + new URLSearchParams({ difficulty, scale, appearance, motion, top: size[2], bottom: size[3] }));
      await page.getByRole('radio').first().waitFor();
      await page.waitForFunction(() => Array.from(document.images).every(img => img.complete && img.naturalWidth > 0));
      await page.waitForTimeout(100);
    };
    if (baseline) {
      await open([393, 852, 59, 34], 2, 1, 'dark');
      await page.screenshot({ path: path.join(output, 'before-standard.png') });
    } else {
      const sizes = process.env.DREAMS_CELL_REVIEW_INTERACTIONS_ONLY === '1' ? [] : [[320, 568, 20, 0], [375, 667, 20, 0], [393, 852, 59, 34], [430, 932, 59, 34], [360, 740, 24, 48], [412, 915, 24, 24]];
      for (const size of sizes) for (const scale of [1, 2]) for (const appearance of ['light', 'dark']) for (const difficulty of [1, 2, 4, 5]) {
        await open(size, difficulty, scale, appearance);
        const geometry = await page.evaluate(() => {
          const box = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; };
          const viewport = document.querySelector('[data-testid="cell-gameplay-viewport"]');
          return { viewport: box(viewport), scrollHeight: viewport.scrollHeight, clientHeight: viewport.clientHeight,
            keys: Array.from(document.querySelectorAll('[role="radio"]')).map(box),
            labels: Array.from(document.querySelectorAll('[data-testid^="cell-key-label-"]')).map(el => ({ ...box(el), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, card: box(el.closest('[role="radio"]')) })),
            locks: Array.from(document.querySelectorAll('[aria-label^="Lock "]')).map(box),
            rows: Array.from(document.querySelectorAll('[data-testid^="cell-lock-row-"]')).map(row => row.querySelectorAll('[role="button"]').length),
            backgroundImages: Array.from(document.images).filter(img => /cell-escape-background/.test(img.src)).length };
        });
        assert.equal(geometry.keys.length, 6); assert.equal(geometry.backgroundImages, 1);
        for (const control of [...geometry.keys, ...geometry.locks]) {
          assert(control.width >= 48 && control.height >= 48);
          assert(control.x >= -1 && control.right <= size[0] + 1, 'Horizontal control clipping');
        }
        for (const label of geometry.labels) assert(label.scrollWidth <= label.clientWidth + 1 && label.x >= label.card.x && label.right <= label.card.right && label.height <= 16 * scale + 1, 'Key caption spills outside its card or wraps');
        for (const row of [geometry.keys.slice(0, 3), geometry.keys.slice(3)]) assert(Math.max(...row.map(key => key.height)) - Math.min(...row.map(key => key.height)) <= 1, 'Key cards in one row must align');
        assert.deepEqual(geometry.rows, difficulty === 1 ? [3] : difficulty === 2 ? size[0] === 320 ? [2, 2] : [4] : difficulty === 4 ? [3, 2] : [3, 3]);
        if (size[0] >= 390 && scale === 1) assert(geometry.keys.every(key => key.bottom <= geometry.viewport.bottom + 1), 'Standard phone must show every key');
        for (const key of await page.getByRole('radio').all()) { await key.scrollIntoViewIfNeeded(); const r = await key.boundingBox(); assert(r.y >= geometry.viewport.y - 1 && r.y + r.height <= geometry.viewport.bottom + 1, 'Key cannot be reached by scrolling'); }
        if (size[0] === 320 && scale === 2 && appearance === 'dark' && difficulty === 5) await page.screenshot({ path: path.join(output, 'small-200percent-scrolled.png') });
        await page.getByTestId('cell-gameplay-viewport').evaluate(el => { el.scrollTop = 0; });
        if (appearance === 'dark' && ((size[0] === 393 && scale === 1 && [2, 5].includes(difficulty)) || (size[0] === 320 && scale === 2 && difficulty === 5) || (size[0] === 360 && scale === 2 && difficulty === 2))) await page.screenshot({ path: path.join(output, `${size[0]}-${scale}x-${geometry.locks.length}locks.png`) });
        cases.push({ size, scale, appearance, difficulty, geometry });
      }
      await open([393, 852, 59, 34], 2, 1, 'dark', 'normal');
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await page.getByRole('button', { name: 'Resume', exact: true }).waitFor();
      assert.equal(await page.getByRole('radio').count(), 0);
      await page.screenshot({ path: path.join(output, 'paused.png') });
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
      const board = await page.evaluate(() => globalThis.__cellBoard);
      const keyLabel = key => 'Key: ' + key.shape + ', ' + key.teeth + (key.teeth === 1 ? ' notch' : ' notches');
      for (const lock of board.locks) {
        await page.getByRole('radio', { name: keyLabel(board.keys.find(key => key.id === lock.keyId)), exact: true }).click();
        if (lock.id === 1) {
          await page.getByRole('radio', { checked: true }).waitFor();
          assert.equal(await page.getByRole('radio', { checked: true }).count(), 1);
          await page.getByText('Used', { exact: true }).waitFor();
          for (const key of await page.getByRole('radio').all()) { const r = await key.boundingBox(); assert(r.y + r.height <= 818, 'Feedback must leave all keys visible on the standard phone'); }
          await page.screenshot({ path: path.join(output, 'selected-used.png') });
        }
        await page.getByRole('button', { name: new RegExp('^Lock ' + (lock.id + 1) + ':') }).click();
      }
      await page.getByText('Out of custody', { exact: true }).waitFor();
      await page.screenshot({ path: path.join(output, 'success.png') });
      assert.equal((await page.evaluate(() => globalThis.__cellSession)).inputs.length, board.locks.length);
      await open([393, 852, 59, 34], 5, 1, 'light');
      const failedBoard = await page.evaluate(() => globalThis.__cellBoard), wrong = failedBoard.keys.find(key => key.id !== failedBoard.locks[0].keyId);
      for (let i = 0; i < 2; i++) { await page.getByRole('radio', { name: keyLabel(wrong), exact: true }).click(); await page.getByRole('button', { name: /^Lock 1:/ }).click(); if (i === 0) await page.getByText('That key does not fit. Try another.', { exact: true }).waitFor(); }
      await page.getByText('Escape failed', { exact: true }).waitFor();
      await page.screenshot({ path: path.join(output, 'failure.png') });
      assert.equal((await page.evaluate(() => globalThis.__cellSession)).inputs.length, 2);
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'checks.json'), JSON.stringify({ renderer: 'Chromium/react-native-web, actual MiniGameScreen/CellEscapeGame and unchanged illustrated assets', nativeDevice: false, baseline: baseline ?? null,
      modeled: 'Explicit safe areas; 1x/2x Text font/line-height scaling. Pressable accessibilityState mapped to ARIA in the browser adapter. Untimed Reanimated clock, audio/preload/status-bar/router boundaries adapted. Cell RN Animated runs on web. No native font, Dynamic Island, paint timing or VoiceOver/TalkBack speech claim.',
      cases, interactions: baseline ? null : { pauseResume: true, success: true, failure: true, motion: ['normal', 'reduce'] }, errors }, null, 2) + '\n');
    console.log(JSON.stringify({ cases: cases.length, errors, output }));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
