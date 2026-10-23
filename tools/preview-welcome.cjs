// Captures the actual welcome components with React Native Web. This is a UI-only
// browser adapter, not an Expo/native runtime or a SQLite durability test.
// Temporary tools: npm install --prefix /tmp/dreams-welcome-preview esbuild@0.25.11 react-native-web@0.21.2
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const modules = process.env.DREAMS_PREVIEW_MODULES || '/tmp/dreams-welcome-preview/node_modules';
const esbuild = require(path.join(modules, 'esbuild'));
const { chromium } = require('playwright');
const output = path.resolve(process.argv[2] || '/tmp/dreams-welcome-captures');
const build = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-welcome-web-'));
const web = path.join(modules, 'react-native-web/dist/index.js');
const moduleSource = {
  native: `import React from 'react'; import * as Native from ${JSON.stringify(web)}; export * from ${JSON.stringify(web)};
    const scale = Number(new URLSearchParams(location.search).get('fontScale') || 1);
    export function useWindowDimensions() { return {...Native.useWindowDimensions(), fontScale: scale}; }
    export const Text = React.forwardRef(function CaptureText(props, ref) {
      const style = Native.StyleSheet.flatten(props.style) || {}; let size = style.fontSize || 14;
      const scaled = scale !== 1 && props.allowFontScaling !== false;
      if (scaled) size *= scale;
      if (scaled && props.adjustsFontSizeToFit && typeof props.children === 'string') {
        const context = document.createElement('canvas').getContext('2d'); context.font = (style.fontWeight || 400) + ' ' + size + 'px Arial';
        size *= Math.min(1, Math.min(440, innerWidth - 48) / context.measureText(props.children).width);
      }
      return <Native.Text {...props} ref={ref} style={[props.style, scaled && {fontSize:size, ...(style.lineHeight ? {lineHeight:style.lineHeight * scale}: {})}]} />;
    });`,
  router: `export const router = {push(route) { (window.__welcomeRoutes ||= []).push(route); }};`,
  status: `export const StatusBar = () => null;`,
  icons: `import React from 'react'; import {Text} from 'react-native'; import glyphs from ${JSON.stringify(require.resolve('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'))};
    export default function Icon({name,size,color}) { return <Text accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" allowFontScaling={false} style={{fontFamily:'DreamsIonicons',fontSize:size,color,lineHeight:size + 2}}>{String.fromCodePoint(glyphs[name])}</Text>; }`,
  store: `import {useSyncExternalStore} from 'react'; import {decodeWorld} from ${JSON.stringify(path.join(root, 'src/game/model.ts'))}; import saved from ${JSON.stringify(path.join(root, 'tests/fixtures/v3-employed-graduate.json'))};
    const query = new URLSearchParams(location.search), state = query.get('state') || 'new';
    let snapshot = {ready:state !== 'loading',busy:query.has('busy'),error:state === 'error' ? 'Could not open saved lives. Please try again.' : null,
      world:state === 'returning' ? decodeWorld(JSON.stringify(saved)) : null, bootstrap:async () => {snapshot={...snapshot,ready:true,busy:false,error:null}; listeners.forEach(fn=>fn());}};
    const listeners = new Set(); export const freshSeed = () => 42;
    export const useGame = selector => selector(useSyncExternalStore(fn => {listeners.add(fn); return () => listeners.delete(fn);}, () => snapshot));
    window.__welcomeState = () => ({ready:snapshot.ready,busy:snapshot.busy,error:snapshot.error,worldId:snapshot.world?.id});`,
};

async function main() {
  fs.mkdirSync(output, { recursive: true });
  await esbuild.build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {SafeAreaProvider,SafeAreaInsetsContext} from 'react-native-safe-area-context';
      import Welcome from './app/index'; import {ThemeProvider} from './src/ui/theme';
      const appearance=new URLSearchParams(location.search).get('appearance') || 'light';
      createRoot(document.getElementById('root')).render(<SafeAreaProvider><SafeAreaInsetsContext.Provider value={{top:24,bottom:24,left:0,right:0}}><ThemeProvider appearance={appearance}><Welcome /></ThemeProvider></SafeAreaInsetsContext.Provider></SafeAreaProvider>);`, resolveDir: root, loader: 'tsx' },
    bundle: true, outdir: build, entryNames: 'welcome', assetNames: 'assets/[name]-[hash]', platform: 'browser', format: 'iife',
    define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false' },
    resolveExtensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js', '.json'],
    loader: { '.png': 'file', '.jpg': 'file', '.webp': 'file', '.ttf': 'file', '.mp3': 'file' },
    plugins: [{ name: 'welcome-browser-boundaries', setup(b) {
      b.onResolve({ filter: /^react-native$/ }, () => ({ path: 'native', namespace: 'welcome' }));
      b.onResolve({ filter: /^expo-router$/ }, () => ({ path: 'router', namespace: 'welcome' }));
      b.onResolve({ filter: /^expo-status-bar$/ }, () => ({ path: 'status', namespace: 'welcome' }));
      b.onResolve({ filter: /^@expo\/vector-icons\/Ionicons$/ }, () => ({ path: 'icons', namespace: 'welcome' }));
      b.onResolve({ filter: /state\/useGame$/ }, () => ({ path: 'store', namespace: 'welcome' }));
      b.onResolve({ filter: /^react-native-svg$/ }, () => ({ path: path.join(root, 'node_modules/react-native-svg/src/ReactNativeSVG.web.ts') }));
      b.onResolve({ filter: /^(react|react-dom\/client|react-dom)$/ }, args => ({ path: require.resolve(args.path, { paths: [root] }) }));
      b.onLoad({ filter: /.*/, namespace: 'welcome' }, args => ({ contents: moduleSource[args.path], loader: 'tsx', resolveDir: root }));
    } }],
  });
  fs.copyFileSync(require.resolve('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'), path.join(build, 'ionicons.ttf'));
  fs.writeFileSync(path.join(build, 'index.html'), `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    @font-face{font-family:DreamsIonicons;src:url('/ionicons.ttf')}html,body,#root{margin:0;width:100%;height:100%;background:#0D1729}#root{display:flex}*{box-sizing:border-box}
    </style></head><body><div id="root"></div><script src="/welcome.js"></script></body></html>`);
  const server = http.createServer((req, res) => {
    const file = path.join(build, new URL(req.url, 'http://localhost').pathname === '/' ? 'index.html' : new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(build + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.ttf') ? 'font/ttf' : file.endsWith('.png') ? 'image/png' : 'text/html');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const cases = [
    { id: 'new-phone', width: 390, height: 844, state: 'new', appearance: 'light' },
    { id: 'returning-phone', width: 390, height: 844, state: 'returning', appearance: 'dark' },
    { id: 'new-small', width: 320, height: 568, state: 'new', appearance: 'light' },
    { id: 'returning-small', width: 320, height: 568, state: 'returning', appearance: 'dark' },
    { id: 'returning-tall', width: 430, height: 932, state: 'returning', appearance: 'light' },
    { id: 'new-tablet', width: 768, height: 1024, state: 'new', appearance: 'light' },
    { id: 'returning-tablet', width: 1024, height: 1366, state: 'returning', appearance: 'dark' },
    { id: 'returning-large-text', width: 320, height: 568, state: 'returning', appearance: 'dark', fontScale: 2 },
    { id: 'new-large-text', width: 390, height: 844, state: 'new', appearance: 'light', fontScale: 2 },
    { id: 'loading-phone', width: 390, height: 844, state: 'loading', appearance: 'dark' },
    { id: 'error-phone', width: 390, height: 844, state: 'error', appearance: 'light' },
  ];
  const results = [];
  try {
    for (const scenario of cases) {
      const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height }, deviceScaleFactor: 2, colorScheme: scenario.appearance });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      const query = new URLSearchParams({ state: scenario.state, appearance: scenario.appearance, fontScale: String(scenario.fontScale || 1) });
      await page.goto(`http://127.0.0.1:${server.address().port}/?${query}`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: 'Dreams' }).waitFor(); await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.getByRole('button', { name: 'Saved Lives', exact: true }).count(), 0);
      assert.equal(await page.getByText('Free to play', { exact: false }).count(), 0);
      assert.equal(await page.getByText('Make choices.', { exact: false }).count(), 0);
      const bounds = await page.getByRole('button').evaluateAll(nodes => nodes.map(node => {const r=node.getBoundingClientRect();return {label:node.getAttribute('aria-label'),x:r.x,y:r.y,width:r.width,height:r.height};}));
      for (const rect of bounds) { assert(rect.height >= 44, scenario.id + ': minimum tap height'); assert(rect.x >= -1 && rect.x + rect.width <= scenario.width + 1, scenario.id + ': horizontal button bounds'); }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, scenario.id + ': horizontal overflow');
      await page.screenshot({ path: path.join(output, scenario.id + '.png') });
      const interactions = [];
      if (scenario.state === 'returning') { await page.getByRole('button', { name: /^Continue Life as / }).click(); interactions.push('continue'); }
      if (scenario.state !== 'loading') {
        await page.getByRole('button', { name: 'Start New Life', exact: true }).click(); interactions.push('start');
        await page.getByRole('button', { name: 'Random Life', exact: true }).click(); interactions.push('random');
        if (scenario.fontScale > 1) await page.screenshot({ path: path.join(output, scenario.id + '-scrolled.png') });
        await page.getByRole('button', { name: 'Help', exact: true }).click(); interactions.push('help');
      }
      const routes = await page.evaluate(() => window.__welcomeRoutes || []);
      if (scenario.state === 'returning') assert.equal(routes[0], '/life');
      if (scenario.state !== 'loading') assert.deepEqual(routes.slice(-3), [{pathname:'/new-life',params:{seed:'42',mode:'custom'}},{pathname:'/new-life',params:{seed:'42',mode:'random'}},'/help']);
      assert.deepEqual(errors, []);
      results.push({ ...scenario, bounds, interactions, routes, errors });
      await page.close();
    }
    const sourceHashes = Object.fromEntries(['app/index.tsx', 'src/ui/OpeningScene.tsx', 'app/_layout.tsx', 'src/ui/cinematic/CinematicTransition.tsx', 'src/ui/cinematic/CinematicInk.tsx', 'package-lock.json'].map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
    fs.writeFileSync(path.join(output, 'captures.json'), JSON.stringify({ scope: 'React Native Web render of production Welcome/OpeningScene; controlled read-only saved-world fixture, router and icon-font adapters; 2x text metrics approximate native font scaling, not device evidence', sourceHashes, results }, null, 2) + '\n');
    console.log(`Captured ${results.length} welcome states in ${output}`);
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
